import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsRepository } from './shifts.repository';
import { EmployersRepository } from '../employers/employers.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@zivara/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeShift(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'shift-1', employerId: 'emp-1', professionalId: 'prof-1',
    applicationId: null, shiftDate: '2025-08-01', startTime: '08:00:00',
    endTime: '16:00:00', location: 'Site A', roleDescription: 'Scaffolding work',
    status: 'scheduled', professionalConfirmedAt: null,
    employerConfirmedCompletion: false, professionalConfirmedCompletion: false,
    cancelledBy: null, cancellationReason: null, version: 1,
    createdAt: new Date(), updatedAt: new Date(), ...overrides,
  };
}

function makeProfessional() { return { id: 'prof-1', userId: 'user-pro' }; }
function makeEmployer() { return { id: 'emp-1', ownerUserId: 'user-emp' }; }

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockShiftsRepo = {
  findById: jest.fn(), create: jest.fn(), update: jest.fn(),
  listByProfessional: jest.fn(), listByEmployer: jest.fn(),
  findPendingCompletion: jest.fn(), findUpcoming: jest.fn(),
};
const mockEmployersRepo = {
  findEmployerByMemberUserId: jest.fn(), findById: jest.fn(), findMember: jest.fn(),
};
const mockProfessionalsRepo = { findByUserId: jest.fn(), findById: jest.fn() };
const mockNotifications = { send: jest.fn().mockResolvedValue(undefined) };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ShiftsService', () => {
  let service: ShiftsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: ShiftsRepository, useValue: mockShiftsRepo },
        { provide: EmployersRepository, useValue: mockEmployersRepo },
        { provide: ProfessionalsRepository, useValue: mockProfessionalsRepo },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get<ShiftsService>(ShiftsService);
  });

  // ─── createShift ──────────────────────────────────────────────────────────

  describe('createShift', () => {
    it('creates shift and notifies professional', async () => {
      const employer = makeEmployer();
      const professional = makeProfessional();
      const shift = makeShift();

      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockProfessionalsRepo.findById.mockResolvedValue(professional);
      mockShiftsRepo.create.mockResolvedValue(shift);

      const result = await service.createShift('user-emp', {
        professionalId: 'prof-1', shiftDate: '2025-08-01',
        startTime: '08:00', endTime: '16:00',
        location: 'Site A', roleDescription: 'Scaffolding work',
      });

      expect(result.id).toBe('shift-1');
      expect(mockNotifications.send).toHaveBeenCalledWith(
        'user-pro', NotificationType.ShiftAssigned,
        expect.objectContaining({ referenceType: 'shift', referenceId: 'shift-1' }),
      );
    });
  });

  // ─── confirmCompletion — Correctness Property 7 ───────────────────────────

  describe('confirmCompletion — Correctness Property 7', () => {
    it('does NOT mark completed when only employer confirms', async () => {
      const shift = makeShift({ status: 'confirmed', employerConfirmedCompletion: false, professionalConfirmedCompletion: false });
      const employer = makeEmployer();

      mockShiftsRepo.findById.mockResolvedValue(shift);
      mockProfessionalsRepo.findByUserId.mockResolvedValue(null);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockShiftsRepo.update.mockResolvedValue({ ...shift, employerConfirmedCompletion: true });

      await service.confirmCompletion('user-emp', 'shift-1');

      const updateCall = (mockShiftsRepo.update as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
      // status must NOT be 'completed' — professional hasn't confirmed yet
      expect(updateCall['status']).toBeUndefined();
      expect(updateCall['employerConfirmedCompletion']).toBe(true);
    });

    it('does NOT mark completed when only professional confirms', async () => {
      const shift = makeShift({ status: 'confirmed', employerConfirmedCompletion: false, professionalConfirmedCompletion: false });
      const professional = makeProfessional();

      mockShiftsRepo.findById.mockResolvedValue(shift);
      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      mockShiftsRepo.update.mockResolvedValue({ ...shift, professionalConfirmedCompletion: true });

      await service.confirmCompletion('user-pro', 'shift-1');

      const updateCall = (mockShiftsRepo.update as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
      expect(updateCall['status']).toBeUndefined();
      expect(updateCall['professionalConfirmedCompletion']).toBe(true);
    });

    it('marks completed ONLY when both parties confirm (Correctness Property 7)', async () => {
      // Employer already confirmed — now professional confirms
      const shift = makeShift({ status: 'confirmed', employerConfirmedCompletion: true, professionalConfirmedCompletion: false });
      const professional = makeProfessional();
      const employer = makeEmployer();

      mockShiftsRepo.findById.mockResolvedValue(shift);
      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      mockEmployersRepo.findById.mockResolvedValue(employer);
      const completedShift = { ...shift, professionalConfirmedCompletion: true, employerConfirmedCompletion: true, status: 'completed' };
      mockShiftsRepo.update.mockResolvedValue(completedShift);

      await service.confirmCompletion('user-pro', 'shift-1');

      const updateCall = (mockShiftsRepo.update as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
      expect(updateCall['status']).toBe('completed');
      expect(updateCall['professionalConfirmedCompletion']).toBe(true);
    });

    it('sends completion prompt to both parties when shift completes', async () => {
      const shift = makeShift({ status: 'confirmed', employerConfirmedCompletion: true });
      const professional = makeProfessional();
      const employer = makeEmployer();

      mockShiftsRepo.findById.mockResolvedValue(shift);
      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      mockEmployersRepo.findById.mockResolvedValue(employer);
      mockShiftsRepo.update.mockResolvedValue({ ...shift, status: 'completed' });

      await service.confirmCompletion('user-pro', 'shift-1');

      const calls = (mockNotifications.send as jest.Mock).mock.calls as [string, NotificationType][];
      const promptCalls = calls.filter(([, type]) => type === NotificationType.ShiftCompletionPrompt);
      expect(promptCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── cancelShift ──────────────────────────────────────────────────────────

  describe('cancelShift', () => {
    it('allows professional to cancel and notifies employer', async () => {
      const shift = makeShift({ status: 'confirmed' });
      const professional = makeProfessional();
      const employer = makeEmployer();

      mockShiftsRepo.findById.mockResolvedValue(shift);
      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      mockEmployersRepo.findById.mockResolvedValue(employer);
      mockShiftsRepo.update.mockResolvedValue({ ...shift, status: 'cancelled' });

      await service.cancelShift('user-pro', 'shift-1', { reason: 'Unable to attend due to illness.' });

      expect(mockShiftsRepo.update).toHaveBeenCalledWith('shift-1', expect.objectContaining({ status: 'cancelled' }));
      expect(mockNotifications.send).toHaveBeenCalledWith(
        'user-emp', NotificationType.ShiftCancelled, expect.any(Object),
      );
    });

    it('throws ForbiddenException when unrelated user tries to cancel', async () => {
      const shift = makeShift();
      mockShiftsRepo.findById.mockResolvedValue(shift);
      mockProfessionalsRepo.findByUserId.mockResolvedValue(null);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);

      await expect(
        service.cancelShift('user-stranger', 'shift-1', { reason: 'Some reason here.' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when cancelling a completed shift', async () => {
      const shift = makeShift({ status: 'completed' });
      const professional = makeProfessional();
      mockShiftsRepo.findById.mockResolvedValue(shift);
      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);

      await expect(
        service.cancelShift('user-pro', 'shift-1', { reason: 'Some reason here.' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── raiseDispute ─────────────────────────────────────────────────────────

  describe('raiseDispute', () => {
    it('sets status to disputed on a completed shift', async () => {
      const shift = makeShift({ status: 'completed' });
      const professional = makeProfessional();
      mockShiftsRepo.findById.mockResolvedValue(shift);
      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      mockShiftsRepo.update.mockResolvedValue({ ...shift, status: 'disputed' });

      const result = await service.raiseDispute('user-pro', 'shift-1');
      expect(result.status).toBe('disputed');
    });

    it('throws BadRequestException when disputing a non-completed shift', async () => {
      const shift = makeShift({ status: 'confirmed' });
      const professional = makeProfessional();
      mockShiftsRepo.findById.mockResolvedValue(shift);
      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(null);

      await expect(service.raiseDispute('user-pro', 'shift-1')).rejects.toThrow(BadRequestException);
    });
  });
});
