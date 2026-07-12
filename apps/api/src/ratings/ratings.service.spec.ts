import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsRepository } from './ratings.repository';
import { ShiftsRepository } from '../shifts/shifts.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { EmployersRepository } from '../employers/employers.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@zivara/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeShift = (o: Partial<Record<string, unknown>> = {}) => ({
  id: 'shift-1', employerId: 'emp-1', professionalId: 'prof-1',
  status: 'completed', ...o,
});
const makeProfessional = () => ({ id: 'prof-1', userId: 'user-pro' });
const makeEmployer = () => ({ id: 'emp-1', ownerUserId: 'user-emp' });
const makeRating = (o: Partial<Record<string, unknown>> = {}) => ({
  id: 'rating-1', shiftId: 'shift-1', reviewerId: 'user-pro',
  revieweeId: 'user-emp', reviewerRole: 'professional',
  stars: 5, reviewText: null, moderationStatus: 'approved',
  flaggedReason: null, reviewedByAdmin: null, createdAt: new Date(), ...o,
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRatingsRepo = {
  create: jest.fn(), findById: jest.fn(),
  findByShiftAndReviewer: jest.fn(), listByReviewee: jest.fn(),
  getAverageRating: jest.fn(), updateModerationStatus: jest.fn(),
};
const mockShiftsRepo = { findById: jest.fn() };
const mockProfessionalsRepo = { findByUserId: jest.fn(), findById: jest.fn() };
const mockEmployersRepo = {
  findEmployerByMemberUserId: jest.fn(), findById: jest.fn(),
};
const mockNotifications = { send: jest.fn().mockResolvedValue(undefined) };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RatingsService', () => {
  let service: RatingsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: RatingsRepository, useValue: mockRatingsRepo },
        { provide: ShiftsRepository, useValue: mockShiftsRepo },
        { provide: ProfessionalsRepository, useValue: mockProfessionalsRepo },
        { provide: EmployersRepository, useValue: mockEmployersRepo },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get<RatingsService>(RatingsService);
  });

  // ─── submitRating ─────────────────────────────────────────────────────────

  describe('submitRating', () => {
    it('professional rates employer after completed shift', async () => {
      const professional = makeProfessional();
      const employer = makeEmployer();
      const rating = makeRating();

      mockShiftsRepo.findById.mockResolvedValue(makeShift());
      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      mockEmployersRepo.findById.mockResolvedValue(employer);
      mockRatingsRepo.findByShiftAndReviewer.mockResolvedValue(null);
      mockRatingsRepo.create.mockResolvedValue(rating);

      const result = await service.submitRating('user-pro', {
        shiftId: 'shift-1', stars: 5, reviewText: 'Excellent employer.',
      });

      expect(mockRatingsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ reviewerRole: 'professional', stars: 5, moderationStatus: 'approved' }),
      );
      expect(result.flaggedForReview).toBe(false);
      expect(mockNotifications.send).toHaveBeenCalledWith(
        'user-emp', NotificationType.RatingReceived, expect.any(Object),
      );
    });

    it('employer rates professional after completed shift', async () => {
      const professional = makeProfessional();
      const employer = makeEmployer();
      const rating = makeRating({ reviewerRole: 'employer', reviewerId: 'user-emp', revieweeId: 'user-pro' });

      mockShiftsRepo.findById.mockResolvedValue(makeShift());
      mockProfessionalsRepo.findByUserId.mockResolvedValue(null);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockProfessionalsRepo.findById.mockResolvedValue(professional);
      mockRatingsRepo.findByShiftAndReviewer.mockResolvedValue(null);
      mockRatingsRepo.create.mockResolvedValue(rating);

      await service.submitRating('user-emp', { shiftId: 'shift-1', stars: 4 });

      expect(mockRatingsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ reviewerRole: 'employer' }),
      );
    });

    it('throws BadRequestException when shift is not completed (Correctness Property 7 dependency)', async () => {
      mockShiftsRepo.findById.mockResolvedValue(makeShift({ status: 'confirmed' }));
      mockProfessionalsRepo.findByUserId.mockResolvedValue(makeProfessional());
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);

      await expect(
        service.submitRating('user-pro', { shiftId: 'shift-1', stars: 5 }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRatingsRepo.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException on duplicate rating (Correctness Property 8 — immutability)', async () => {
      mockShiftsRepo.findById.mockResolvedValue(makeShift());
      mockProfessionalsRepo.findByUserId.mockResolvedValue(makeProfessional());
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      mockRatingsRepo.findByShiftAndReviewer.mockResolvedValue(makeRating()); // already exists

      await expect(
        service.submitRating('user-pro', { shiftId: 'shift-1', stars: 3 }),
      ).rejects.toThrow(ConflictException);
      // Must not create a new rating — immutability enforced
      expect(mockRatingsRepo.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user was not part of the shift', async () => {
      mockShiftsRepo.findById.mockResolvedValue(makeShift());
      mockProfessionalsRepo.findByUserId.mockResolvedValue(null);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);

      await expect(
        service.submitRating('user-stranger', { shiftId: 'shift-1', stars: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('flags rating with prohibited content and does NOT send notification', async () => {
      const professional = makeProfessional();
      const employer = makeEmployer();
      const flaggedRating = makeRating({ moderationStatus: 'flagged' });

      mockShiftsRepo.findById.mockResolvedValue(makeShift());
      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      mockEmployersRepo.findById.mockResolvedValue(employer);
      mockRatingsRepo.findByShiftAndReviewer.mockResolvedValue(null);
      mockRatingsRepo.create.mockResolvedValue(flaggedRating);

      const result = await service.submitRating('user-pro', {
        shiftId: 'shift-1', stars: 1,
        reviewText: 'This person made a racist remark.',
      });

      expect(result.flaggedForReview).toBe(true);
      // Notification must NOT be sent for flagged ratings
      expect(mockNotifications.send).not.toHaveBeenCalled();
    });
  });

  // ─── getRatingsForUser ────────────────────────────────────────────────────

  describe('getRatingsForUser', () => {
    it('returns only approved ratings with time-decayed average', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 100 * 86_400_000); // 100 days ago

      mockRatingsRepo.listByReviewee.mockResolvedValue([
        { stars: 5, createdAt: now },           // weight 1.0
        { stars: 3, createdAt: oldDate },        // weight 0.7 (>90 days)
      ]);

      const result = await service.getRatingsForUser('user-1');

      // Weighted: (5 * 1.0 + 3 * 0.7) / (1.0 + 0.7) = (5 + 2.1) / 1.7 = 4.18 ≈ 4.2
      expect(result.count).toBe(2);
      expect(result.average).toBe(4.2);
    });

    it('returns zero average when no ratings exist', async () => {
      mockRatingsRepo.listByReviewee.mockResolvedValue([]);
      const result = await service.getRatingsForUser('user-no-ratings');
      expect(result.average).toBe(0);
      expect(result.count).toBe(0);
    });
  });
});
