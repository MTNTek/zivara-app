import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { RatingsRepository } from '../ratings/ratings.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@zivara/shared';
import type { ReviewVerificationDto } from './dto/review-verification.dto';
import type { SuspendAccountDto } from './dto/suspend-account.dto';
import type { ModerateRatingDto } from './dto/moderate-rating.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly repo: AdminRepository,
    private readonly ratingsRepo: RatingsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  async getDashboard() {
    return this.repo.getDashboardStats();
  }

  // ─── Verification ─────────────────────────────────────────────────────────

  async getPendingVerifications() {
    const [professionals, employers] = await Promise.all([
      this.repo.getPendingProfessionalVerifications(),
      this.repo.getPendingEmployerVerifications(),
    ]);
    return { professionals, employers };
  }

  async reviewProfessionalVerification(
    adminId: string,
    professionalId: string,
    dto: ReviewVerificationDto,
  ) {
    const pending = await this.repo.getPendingProfessionalVerifications();
    const target = pending.find((p) => p.id === professionalId);
    if (!target) throw new NotFoundException('Professional verification request not found.');

    // Map 'approved' → 'verified' for the DB schema
    const dbStatus = dto.decision === 'approved' ? 'verified' : 'rejected';
    await this.repo.updateProfessionalVerification(professionalId, dbStatus);

    await this.repo.writeAuditLog(
      adminId,
      `professional_verification_${dto.decision}`,
      'professional',
      professionalId,
      dto.reason,
    );

    // Notify the professional
    const notificationType =
      dto.decision === 'approved'
        ? NotificationType.VerificationApproved
        : NotificationType.VerificationRejected;

    await this.notificationsService.send(target.userId, notificationType, {
      referenceType: 'professional',
      referenceId: professionalId,
    });

    return { success: true, decision: dto.decision };
  }

  async reviewEmployerVerification(
    adminId: string,
    employerId: string,
    dto: ReviewVerificationDto,
  ) {
    const pending = await this.repo.getPendingEmployerVerifications();
    const target = pending.find((e) => e.id === employerId);
    if (!target) throw new NotFoundException('Employer verification request not found.');

    const empDbStatus = dto.decision === 'approved' ? 'verified' : 'rejected';
    await this.repo.updateEmployerVerification(employerId, empDbStatus);
    await this.repo.recomputeEmployerBadge(employerId);

    await this.repo.writeAuditLog(
      adminId,
      `employer_verification_${dto.decision}`,
      'employer',
      employerId,
      dto.reason,
    );

    // Notify the employer owner
    const notificationType =
      dto.decision === 'approved'
        ? NotificationType.VerificationApproved
        : NotificationType.VerificationRejected;

    await this.notificationsService.send(target.ownerUserId, notificationType, {
      referenceType: 'employer',
      referenceId: employerId,
    });

    return { success: true, decision: dto.decision };
  }

  // ─── Account suspension ───────────────────────────────────────────────────

  async suspendAccount(adminId: string, userId: string, dto: SuspendAccountDto) {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new NotFoundException('User not found.');
    if (user.suspendedAt) throw new BadRequestException('Account is already suspended.');

    await this.repo.suspendUser(userId, dto.reason);

    await this.repo.writeAuditLog(
      adminId,
      'account_suspended',
      'user',
      userId,
      dto.reason,
    );

    // Notify user
    await this.notificationsService.send(userId, NotificationType.AccountSuspended);

    return { success: true, userId };
  }

  async unsuspendAccount(adminId: string, userId: string, reason: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new NotFoundException('User not found.');
    if (!user.suspendedAt) throw new BadRequestException('Account is not currently suspended.');

    await this.repo.unsuspendUser(userId);

    await this.repo.writeAuditLog(adminId, 'account_unsuspended', 'user', userId, reason);

    return { success: true, userId };
  }

  // ─── Ratings moderation ───────────────────────────────────────────────────

  async getFlaggedRatings() {
    return this.repo.getFlaggedRatings();
  }

  async moderateRating(
    adminId: string,
    ratingId: string,
    dto: ModerateRatingDto,
  ) {
    const rating = await this.ratingsRepo.findById(ratingId);
    if (!rating) throw new NotFoundException('Rating not found.');

    if (rating.moderationStatus !== 'flagged') {
      throw new BadRequestException('Only flagged ratings can be moderated.');
    }

    const updated = await this.ratingsRepo.updateModerationStatus(
      ratingId,
      dto.decision,
      adminId,
      dto.reason,
    );

    await this.repo.writeAuditLog(
      adminId,
      `rating_${dto.decision}`,
      'rating',
      ratingId,
      dto.reason ?? 'Admin moderation decision',
    );

    // If approved, send notification to reviewee that they received a rating
    if (dto.decision === 'approved') {
      await this.notificationsService.send(
        updated.revieweeId,
        NotificationType.RatingReceived,
        { referenceType: 'rating', referenceId: ratingId },
      );
    }

    return updated;
  }

  // ─── Disputes ─────────────────────────────────────────────────────────────

  async getDisputedShifts() {
    return this.repo.getDisputedShifts();
  }

  async resolveDispute(
    adminId: string,
    shiftId: string,
    resolution: 'completed' | 'cancelled',
    reason: string,
  ) {
    await this.repo.resolveDispute(shiftId, resolution);

    await this.repo.writeAuditLog(
      adminId,
      'dispute_resolved',
      'shift',
      shiftId,
      reason,
      { resolution },
    );

    return { success: true, shiftId, resolution };
  }

  // ─── Analytics + Audit ────────────────────────────────────────────────────

  async getAnalytics() {
    return this.repo.getAnalytics();
  }

  async getAuditLogs() {
    return this.repo.getAuditLogs();
  }
}
