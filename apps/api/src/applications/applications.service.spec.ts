import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';
import { JobsRepository } from '../jobs/jobs.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { EmployersRepository } from '../employers/employers.repository';
import { NotificationType } from '@zivara/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeApplication(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'app-1', jobId: 'job-1', professionalId: 'prof-1',
    status: 'received', coverNote: null, rejectionReason: null,
    lastReviewedAt: null, version: 1, deletedAt: null,
    createdAt: new Date(), updatedAt: new Date(), ...overrides,
  };
}

function makeJob(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'job-1', employerId: 'emp-1', status: 'active',
    title: { en: 'Site Engineer' }, deletedAt: null, ...overrides,
  };
}

function makeProfessional() {
  return { id: 'prof-1', userId: 'user-pro', deletedAt: null };
}

function makeEmployer() {
  return { id: 'emp-1', ownerUserId: 'user-emp', verificationStatus: 'verified' };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockApplicationsRepo = {
  findById: jest.fn(),
  findByJobAndProfessional: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  withdraw: jest.fn(),
  listByProfessional: jest.fn(),
  listByJob: jest.fn(),
  findStale: jest.fn(),
};

const mockJobsRepo = {
  findById: jest.fn(),
  findWithSkills: jest.fn(),
  listByEmployer: jest.fn(),
};

const mockProfessionalsRepo = {
  findByUserId: jest.fn(),
  findById: jest.fn(),
};

const mockEmployersRepo = {
  findEmployerByMemberUserId: jest.fn(),
  findMember: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let notificationSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: ApplicationsRepository, useValue: mockApplicationsRepo },
        { provide: JobsRepository, useValue: mockJobsRepo },
        { provide: ProfessionalsRepository, useValue: mockProfessionalsRepo },
        { provide: EmployersRepository, useValue: mockEmployersRepo },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    // Spy on the private notification method
    notificationSpy = jest.spyOn(service as unknown as { sendNotification: () => void }, 'sendNotification')
      .mockResolvedValue(undefined);
  });

  // ─── apply ────────────────────────────────────────────────────────────────

  describe('apply', () => {
    it('creates application and sends received notification', async () => {
      const professional = makeProfessional();
      const job = makeJob();
      const application = makeApplication();

      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockJobsRepo.findById.mockResolvedValue(job);
      mockApplicationsRepo.findByJobAndProfessional.mockResolvedValue(null);
      mockApplicationsRepo.create.mockResolvedValue(application);

      await service.apply('user-pro', { jobId: 'job-1' });

      expect(mockApplicationsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: 'job-1', professionalId: 'prof-1', status: 'received' }),
      );
      expect(notificationSpy).toHaveBeenCalledWith(
        'user-pro',
        NotificationType.ApplicationReceived,
        'app-1',
      );
    });

    it('throws ConflictException on duplicate application (Correctness Property 2)', async () => {
      const professional = makeProfessional();
      const job = makeJob();
      const existing = makeApplication();

      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockJobsRepo.findById.mockResolvedValue(job);
      mockApplicationsRepo.findByJobAndProfessional.mockResolvedValue(existing);

      await expect(service.apply('user-pro', { jobId: 'job-1' })).rejects.toThrow(ConflictException);
      expect(mockApplicationsRepo.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when job is not active', async () => {
      const professional = makeProfessional();
      const closedJob = makeJob({ status: 'closed' });

      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockJobsRepo.findById.mockResolvedValue(closedJob);

      await expect(service.apply('user-pro', { jobId: 'job-1' })).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Correctness Property 1: notification accuracy ───────────────────────

  describe('updateApplicationStatus — notification accuracy (Correctness Property 1)', () => {
    const setup = () => {
      const application = makeApplication({ status: 'received' });
      const job = makeJob();
      const employer = makeEmployer();
      const professional = makeProfessional();

      mockApplicationsRepo.findById.mockResolvedValue(application);
      mockJobsRepo.findById.mockResolvedValue(job);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockProfessionalsRepo.findById.mockResolvedValue(professional);
      mockApplicationsRepo.updateStatus.mockResolvedValue({ ...application });

      return { application, job, employer, professional };
    };

    it('sends ApplicationShortlisted notification ONLY when status = shortlisted', async () => {
      setup();
      await service.updateApplicationStatus('user-emp', 'app-1', { status: 'shortlisted' });

      expect(notificationSpy).toHaveBeenCalledWith(
        'user-pro',
        NotificationType.ApplicationShortlisted,
        'app-1',
      );
    });

    it('sends ApplicationRejected notification when status = rejected', async () => {
      setup();
      await service.updateApplicationStatus('user-emp', 'app-1', { status: 'rejected' });

      expect(notificationSpy).toHaveBeenCalledWith(
        'user-pro',
        NotificationType.ApplicationRejected,
        'app-1',
      );
      // Must NOT send shortlisted notification
      const calls = notificationSpy.mock.calls as [string, NotificationType, string][];
      const shortlistedCalls = calls.filter(([, type]) => type === NotificationType.ApplicationShortlisted);
      expect(shortlistedCalls).toHaveLength(0);
    });

    it('sends ApplicationHired notification when status = hired', async () => {
      setup();
      await service.updateApplicationStatus('user-emp', 'app-1', { status: 'hired' });

      expect(notificationSpy).toHaveBeenCalledWith(
        'user-pro',
        NotificationType.ApplicationHired,
        'app-1',
      );
    });

    it('NEVER sends ApplicationShortlisted notification for rejected status', async () => {
      setup();
      await service.updateApplicationStatus('user-emp', 'app-1', { status: 'rejected' });

      const calls = notificationSpy.mock.calls as [string, NotificationType, string][];
      const wrongCalls = calls.filter(([, type]) => type === NotificationType.ApplicationShortlisted);
      expect(wrongCalls).toHaveLength(0);
    });

    it('NEVER sends ApplicationShortlisted notification for hired status', async () => {
      setup();
      await service.updateApplicationStatus('user-emp', 'app-1', { status: 'hired' });

      const calls = notificationSpy.mock.calls as [string, NotificationType, string][];
      const wrongCalls = calls.filter(([, type]) => type === NotificationType.ApplicationShortlisted);
      expect(wrongCalls).toHaveLength(0);
    });

    it('throws ForbiddenException when employer does not own the job', async () => {
      const application = makeApplication();
      const job = makeJob({ employerId: 'emp-OTHER' });
      const employer = makeEmployer();

      mockApplicationsRepo.findById.mockResolvedValue(application);
      mockJobsRepo.findById.mockResolvedValue(job);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(employer);

      await expect(
        service.updateApplicationStatus('user-emp', 'app-1', { status: 'shortlisted' }),
      ).rejects.toThrow(ForbiddenException);
      expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when updating a withdrawn application', async () => {
      const withdrawnApp = makeApplication({ status: 'withdrawn' });
      const job = makeJob();
      const employer = makeEmployer();

      mockApplicationsRepo.findById.mockResolvedValue(withdrawnApp);
      mockJobsRepo.findById.mockResolvedValue(job);
      mockEmployersRepo.findEmployerByMemberUserId.mockResolvedValue(employer);

      await expect(
        service.updateApplicationStatus('user-emp', 'app-1', { status: 'shortlisted' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── withdraw ─────────────────────────────────────────────────────────────

  describe('withdrawApplication', () => {
    it('withdraws own application', async () => {
      const professional = makeProfessional();
      const application = makeApplication({ status: 'received' });

      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockApplicationsRepo.findById.mockResolvedValue(application);
      mockApplicationsRepo.withdraw.mockResolvedValue({ ...application, status: 'withdrawn' });

      const result = await service.withdrawApplication('user-pro', 'app-1');
      expect(result.status).toBe('withdrawn');
    });

    it('throws ForbiddenException when withdrawing another professional\'s application', async () => {
      const professional = makeProfessional({ id: 'prof-MINE' });
      const application = makeApplication({ professionalId: 'prof-OTHER' });

      mockProfessionalsRepo.findByUserId.mockResolvedValue(professional);
      mockApplicationsRepo.findById.mockResolvedValue(application);

      await expect(service.withdrawApplication('user-pro', 'app-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
