import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsRepository } from './jobs.repository';
import { EmployersRepository } from '../employers/employers.repository';
import type { CreateJobDto } from './dto/create-job.dto';
import type { UpdateJobDto } from './dto/update-job.dto';
import type { SearchJobsDto } from './dto/search-jobs.dto';

@Injectable()
export class JobsService {
  constructor(
    private readonly jobsRepo: JobsRepository,
    private readonly employersRepo: EmployersRepository,
  ) {}

  // ─── Employer: create / manage ────────────────────────────────────────────

  async createJob(userId: string, dto: CreateJobDto) {
    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    if (employer.verificationStatus !== 'verified') {
      throw new ForbiddenException(
        'Your company must be verified before you can post jobs.',
      );
    }

    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + 60 * 86_400_000);

    const job = await this.jobsRepo.create({
      employerId: employer.id,
      createdBy: userId,
      title: dto.title as unknown as Record<string, string>,
      description: dto.description as unknown as Record<string, string>,
      industry: dto.industry,
      city: dto.city,
      country: dto.country,
      employmentType: dto.employmentType,
      salaryMin: dto.salaryMin != null ? String(dto.salaryMin) : null,
      salaryMax: dto.salaryMax != null ? String(dto.salaryMax) : null,
      salaryCurrency: dto.salaryCurrency ?? 'AED',
      status: 'draft',
      expiresAt,
    });

    if (dto.requiredSkills?.length) {
      await this.jobsRepo.replaceSkills(job.id, dto.requiredSkills);
    }

    return this.jobsRepo.findWithSkills(job.id);
  }

  async publishJob(userId: string, jobId: string) {
    const job = await this.assertOwnership(userId, jobId);

    if (job.status !== 'draft') {
      throw new BadRequestException('Only draft jobs can be published.');
    }

    return this.jobsRepo.update(jobId, { status: 'active' });
  }

  async closeJob(userId: string, jobId: string) {
    await this.assertOwnership(userId, jobId);
    return this.jobsRepo.update(jobId, { status: 'closed' });
  }

  async updateJob(userId: string, jobId: string, dto: UpdateJobDto) {
    const job = await this.assertOwnership(userId, jobId);

    if (job.status === 'closed' || job.status === 'expired') {
      throw new BadRequestException('Closed or expired jobs cannot be edited.');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.title) updateData['title'] = dto.title;
    if (dto.description) updateData['description'] = dto.description;
    if (dto.industry) updateData['industry'] = dto.industry;
    if (dto.city) updateData['city'] = dto.city;
    if (dto.country) updateData['country'] = dto.country;
    if (dto.employmentType) updateData['employmentType'] = dto.employmentType;
    if (dto.salaryMin != null) updateData['salaryMin'] = String(dto.salaryMin);
    if (dto.salaryMax != null) updateData['salaryMax'] = String(dto.salaryMax);
    if (dto.salaryCurrency) updateData['salaryCurrency'] = dto.salaryCurrency;
    if (dto.expiresAt) updateData['expiresAt'] = new Date(dto.expiresAt);

    const updated = await this.jobsRepo.update(jobId, updateData as Parameters<typeof this.jobsRepo.update>[1]);

    if (dto.requiredSkills) {
      await this.jobsRepo.replaceSkills(jobId, dto.requiredSkills);
    }

    return this.jobsRepo.findWithSkills(updated.id);
  }

  async duplicateJob(userId: string, jobId: string) {
    const job = await this.assertOwnership(userId, jobId);
    const skills = await this.jobsRepo.listSkills(jobId);

    const newJob = await this.jobsRepo.create({
      employerId: job.employerId,
      createdBy: userId,
      title: job.title as Record<string, string>,
      description: job.description as Record<string, string>,
      industry: job.industry,
      city: job.city,
      country: job.country,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      status: 'draft',
    });

    if (skills.length > 0) {
      await this.jobsRepo.replaceSkills(newJob.id, skills.map((s) => s.skillName));
    }

    return this.jobsRepo.findWithSkills(newJob.id);
  }

  async deleteJob(userId: string, jobId: string): Promise<void> {
    const member = await this.getMemberForJob(userId, jobId);
    if (member !== 'owner') {
      throw new ForbiddenException('Only the account owner can delete job postings.');
    }
    await this.jobsRepo.softDelete(jobId);
  }

  async listMyJobs(userId: string) {
    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    const jobList = await this.jobsRepo.listByEmployer(employer.id);
    return Promise.all(jobList.map((j) => this.jobsRepo.findWithSkills(j.id)));
  }

  async getJobStats(userId: string, jobId: string) {
    await this.assertOwnership(userId, jobId);
    const job = await this.jobsRepo.findById(jobId);
    if (!job) throw new NotFoundException('Job not found.');
    return {
      jobId,
      viewCount: job.viewCount,
      // Application counts come from the Applications module
      totalApplications: 0,
      shortlisted: 0,
      hired: 0,
    };
  }

  // ─── Public: browse ───────────────────────────────────────────────────────

  async searchJobs(dto: SearchJobsDto) {
    const result = await this.jobsRepo.search(dto);
    const page = Math.max(1, parseInt(dto.page ?? '1', 10));
    const limit = Math.min(50, parseInt(dto.limit ?? '20', 10));
    return {
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async getPublicJob(jobId: string) {
    const job = await this.jobsRepo.findWithSkills(jobId);
    if (!job || job.status !== 'active' || job.deletedAt) {
      throw new NotFoundException('Job not found.');
    }
    // Increment view count (fire-and-forget)
    void this.jobsRepo.incrementViewCount(jobId).catch(() => null);
    return job;
  }

  // ─── Scheduled: expire stale jobs ────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async expireStaleJobs(): Promise<void> {
    const count = await this.jobsRepo.expireStaleJobs();
    if (count > 0) {
      console.log(`[JobsService] Expired ${count} stale job(s).`);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async assertOwnership(userId: string, jobId: string) {
    const job = await this.jobsRepo.findById(jobId);
    if (!job) throw new NotFoundException('Job not found.');

    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);
    if (!employer || employer.id !== job.employerId) {
      throw new ForbiddenException('You do not have permission to manage this job.');
    }
    return job;
  }

  private async getMemberForJob(userId: string, jobId: string): Promise<string> {
    const job = await this.jobsRepo.findById(jobId);
    if (!job) throw new NotFoundException('Job not found.');

    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);
    if (!employer || employer.id !== job.employerId) {
      throw new ForbiddenException('You do not have permission to manage this job.');
    }

    const member = await this.employersRepo.findMember(employer.id, userId);
    return member?.role ?? 'owner';
  }
}
