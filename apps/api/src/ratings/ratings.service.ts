import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RatingsRepository } from './ratings.repository';
import { ShiftsRepository } from '../shifts/shifts.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { EmployersRepository } from '../employers/employers.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@zivara/shared';
import type { SubmitRatingDto } from './dto/submit-rating.dto';

/**
 * Prohibited content patterns — if matched, rating is flagged for admin review.
 * This is a simple rule-based filter. Production would use a more sophisticated model.
 */
const PROHIBITED_PATTERNS = [
  /\b(kill|murder|threat|racist|sexist|discriminat)\b/i,
];

function containsProhibitedContent(text: string): boolean {
  return PROHIBITED_PATTERNS.some((p) => p.test(text));
}

/**
 * Time-decay weight for average rating computation.
 * Ratings older than 90 days are weighted at 70% to surface recent behaviour.
 */
function computeDecayedAverage(
  ratingRows: { stars: number; createdAt: Date }[],
): { average: number; count: number } {
  if (ratingRows.length === 0) return { average: 0, count: 0 };

  const now = Date.now();
  const NINETY_DAYS = 90 * 86_400_000;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const r of ratingRows) {
    const age = now - new Date(r.createdAt).getTime();
    const weight = age < NINETY_DAYS ? 1.0 : 0.7;
    weightedSum += r.stars * weight;
    totalWeight += weight;
  }

  return {
    average: Math.round((weightedSum / totalWeight) * 10) / 10,
    count: ratingRows.length,
  };
}

@Injectable()
export class RatingsService {
  constructor(
    private readonly ratingsRepo: RatingsRepository,
    private readonly shiftsRepo: ShiftsRepository,
    private readonly professionalsRepo: ProfessionalsRepository,
    private readonly employersRepo: EmployersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Submit rating ────────────────────────────────────────────────────────

  async submitRating(userId: string, dto: SubmitRatingDto) {
    const shift = await this.shiftsRepo.findById(dto.shiftId);
    if (!shift) throw new NotFoundException('Shift not found.');

    // Correctness Property 7 dependency: ratings only allowed after BOTH parties confirm
    if (shift.status !== 'completed') {
      throw new BadRequestException(
        'Ratings can only be submitted after both parties have confirmed shift completion.',
      );
    }

    // Determine who is rating whom
    const professional = await this.professionalsRepo.findByUserId(userId);
    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);

    const isProfessional = professional && shift.professionalId === professional.id;
    const isEmployer = employer && shift.employerId === employer.id;

    if (!isProfessional && !isEmployer) {
      throw new ForbiddenException('You were not part of this shift.');
    }

    // Prevent duplicate ratings per shift per reviewer
    const existing = await this.ratingsRepo.findByShiftAndReviewer(dto.shiftId, userId);
    if (existing) {
      throw new ConflictException('You have already submitted a rating for this shift.');
    }

    // Determine reviewee userId
    let revieweeUserId: string;
    let reviewerRole: 'professional' | 'employer';

    if (isProfessional) {
      // Professional rates the employer
      const emp = await this.employersRepo.findById(shift.employerId);
      if (!emp) throw new NotFoundException('Employer not found.');
      revieweeUserId = emp.ownerUserId;
      reviewerRole = 'professional';
    } else {
      // Employer rates the professional
      const prof = await this.professionalsRepo.findById(shift.professionalId);
      if (!prof) throw new NotFoundException('Professional not found.');
      revieweeUserId = prof.userId;
      reviewerRole = 'employer';
    }

    // Content moderation — flag if prohibited content detected
    const hasProhibitedContent =
      dto.reviewText ? containsProhibitedContent(dto.reviewText) : false;

    const rating = await this.ratingsRepo.create({
      shiftId: dto.shiftId,
      reviewerId: userId,
      revieweeId: revieweeUserId,
      reviewerRole,
      stars: dto.stars,
      reviewText: dto.reviewText ?? null,
      // Flagged ratings are held for admin review before being visible
      moderationStatus: hasProhibitedContent ? 'flagged' : 'approved',
    });

    // Notify reviewee that they received a rating (only if approved — not flagged)
    if (!hasProhibitedContent) {
      await this.notificationsService.send(
        revieweeUserId,
        NotificationType.RatingReceived,
        { referenceType: 'rating', referenceId: rating.id },
      );
    }

    return {
      ...rating,
      flaggedForReview: hasProhibitedContent,
    };
  }

  // ─── View ratings ─────────────────────────────────────────────────────────

  /**
   * Get ratings for a user's public profile.
   * Only returns approved ratings — flagged/removed ratings are never shown.
   * Uses time-decay weighting for the average.
   */
  async getRatingsForUser(revieweeUserId: string) {
    const approvedRatings = await this.ratingsRepo.listByReviewee(revieweeUserId);
    const { average, count } = computeDecayedAverage(
      approvedRatings.map((r) => ({ stars: r.stars, createdAt: r.createdAt })),
    );

    return {
      average,
      count,
      ratings: approvedRatings.map((r) => ({
        id: r.id,
        stars: r.stars,
        reviewText: r.reviewText,
        reviewerRole: r.reviewerRole,
        createdAt: r.createdAt,
      })),
    };
  }

  async getAverageRating(revieweeUserId: string) {
    const ratingRows = await this.ratingsRepo.listByReviewee(revieweeUserId);
    return computeDecayedAverage(
      ratingRows.map((r) => ({ stars: r.stars, createdAt: r.createdAt })),
    );
  }
}
