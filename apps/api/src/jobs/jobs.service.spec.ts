import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsRepository } from './jobs.repository';
import { EmployersRepository } from '../employers/employers.repository';

function makeEmployer(overrides: Partial<Record<string, unknown>> = {}) {
  return { id: 'emp-1', verificationStatus: 'verified', deletedAt: null, ...overrides };
}

function makeJob(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'job-1', employerId: 'emp-1', title: { en: 'Engineer', ar: 'مهندس' },
    description: { en: 'Description', ar: 'وصف' }, industry: 'Construction',
    city: 'Dubai', country: 'UAE', employmentType: 'full_time',
    salaryMin: '5000', salaryMax: '8000', salaryCurrency: 'AED',
    status: 'active', viewCount: 0, expiresAt: new Date(Date.now() + 86400000),
    version: 1, deletedAt: null, skills: [], createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  };
}

const mockJobsRepo = {
  findById: jest.fn(), findWithSkills: jest.fn(), listByEmployer: jest.fn(),
  create: jest.fn(), update: jest.fn(), softDelete: jest.fn(),
  incrementViewCount: jest.fn(), replaceSkills: jest.fn(), search: jest.fn(),
  expireStaleJobs: jest.fn(), listSkills: jest.fn(),
};
const mockEmployerRepo = {
  findEmployerByMemberUserId: jest.fn(),
};

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: JobsRepository, useValue: mockJobsRepo },
        { provide: EmployersRepository, useValue: mockEmployerRepo },
      ],
    }).compile();
    service = module.get<JobsService>(JobsService);
  });

  describe('createJob', () => {
    it('creates job for verified employer', async () => {
      const employer = makeEmployer();
      const job = makeJob();
      mockEmployerRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockJobsRepo.create.mockResolvedValue(job);
      mockJobsRepo.findWithSkills.mockResolvedValue({ ...job, skills: [] });

      const result = await service.createJob('user-1', {
        title: { en: 'Engineer' }, description: { en: 'Description' },
        industry: 'Construction', city: 'Dubai', country: 'UAE',
        employmentType: 'full_time', requiredSkills: ['Welding'],
      });

      expect(mockJobsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ employerId: 'emp-1', industry: 'Construction' }),
      );
      expect(result?.id).toBe('job-1');
    });

    it('throws ForbiddenException for unverified employer', async () => {
      mockEmployerRepo.findEmployerByMemberUserId.mockResolvedValue(
        makeEmployer({ verificationStatus: 'pending' }),
      );
      await expect(
        service.createJob('user-1', {
          title: { en: 'Job' }, description: { en: 'Desc' },
          industry: 'Construction', city: 'Dubai', country: 'UAE',
          employmentType: 'full_time',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when employer not found', async () => {
      mockEmployerRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      await expect(
        service.createJob('user-1', { title: { en: 'J' }, description: { en: 'D' }, industry: 'C', city: 'D', country: 'UAE', employmentType: 'full_time' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateJob', () => {
    it('throws ForbiddenException when job belongs to different employer', async () => {
      mockEmployerRepo.findEmployerByMemberUserId.mockResolvedValue(makeEmployer({ id: 'emp-OTHER' }));
      mockJobsRepo.findById.mockResolvedValue(makeJob({ employerId: 'emp-1' }));

      await expect(service.updateJob('user-1', 'job-1', {})).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when editing a closed job', async () => {
      mockEmployerRepo.findEmployerByMemberUserId.mockResolvedValue(makeEmployer());
      mockJobsRepo.findById.mockResolvedValue(makeJob({ status: 'closed' }));

      await expect(service.updateJob('user-1', 'job-1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('closeJob', () => {
    it('closes job for owner employer', async () => {
      mockEmployerRepo.findEmployerByMemberUserId.mockResolvedValue(makeEmployer());
      mockJobsRepo.findById.mockResolvedValue(makeJob());
      mockJobsRepo.update.mockResolvedValue(makeJob({ status: 'closed' }));

      await service.closeJob('user-1', 'job-1');
      expect(mockJobsRepo.update).toHaveBeenCalledWith('job-1', { status: 'closed' });
    });
  });

  describe('getPublicJob', () => {
    it('returns public job data without internal fields', async () => {
      mockJobsRepo.findWithSkills.mockResolvedValue(makeJob());
      const result = await service.getPublicJob('job-1', false);

      expect(result.id).toBe('job-1');
      expect(result).not.toHaveProperty('viewCount');
      expect(result).not.toHaveProperty('version');
      expect(result).not.toHaveProperty('deletedAt');
    });

    it('throws NotFoundException for inactive job', async () => {
      mockJobsRepo.findWithSkills.mockResolvedValue(makeJob({ status: 'closed' }));
      await expect(service.getPublicJob('job-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for non-existent job', async () => {
      mockJobsRepo.findWithSkills.mockResolvedValue(null);
      await expect(service.getPublicJob('no-job')).rejects.toThrow(NotFoundException);
    });
  });

  describe('duplicateJob', () => {
    it('creates draft copy of existing job', async () => {
      const original = makeJob({ skills: [{ skillName: 'Welding' }] });
      const copy = makeJob({ id: 'job-2', status: 'draft' });

      mockEmployerRepo.findEmployerByMemberUserId.mockResolvedValue(makeEmployer());
      mockJobsRepo.findWithSkills.mockResolvedValue(original);
      mockJobsRepo.create.mockResolvedValue(copy);
      mockJobsRepo.findWithSkills
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce({ ...copy, skills: [{ skillName: 'Welding' }] });
      mockJobsRepo.replaceSkills.mockResolvedValue(undefined);

      const result = await service.duplicateJob('user-1', 'job-1');
      expect(mockJobsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' }),
      );
      expect(result?.id).toBe('job-2');
    });
  });
});
