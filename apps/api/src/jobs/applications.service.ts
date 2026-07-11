import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApplicationsRepository } from './applications.repository';
import { JobsRepository } from './jobs.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { EmployersRepository } from '../employers/employers.repository';
import type { ApplyJobDto } from './dto/apply-job.dto';
import type { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly appRepo: ApplicationsRepository,
    private readonly jobsRepo: JobsRepository,
    private readonly profRepo: ProfessionalsRepository,
    private readonly employerRepo: EmployersRepository,
  ) {}

  // ─── Professional actions ─────────────────────────────────────────────────

  async apply(userId: string, jobId: string, dto: ApplyJobDto) {
    const professional = await this.profRepo.findByUserId(userId);
    if (!professional) throw new NotFoundException('Professional profile not found.');

    const job = await this.jobsRepo.findById(jobId);
    if (!job || job.status !== 'active' || job.deletedAt) {
      throw new NotFoundException('This job posting is no longer accepting applications.');
    }

    // Prevent duplicate applications
    const existing = await this.appRepo.findByJobAndProfessional(
      jobId,
      professional.id,
    );
    if (existing) {
      throw new ConflictException(
        'You have already applied to this job.',
      );
    }

    return this.appRepo.create({
      jobId,
      professionalId: professional.id,
      status: 'received',
      coverNote: dto.coverNote ?? null,
    });
  }

  async getMyApplications(userId: string) {
    const professional = await this.profRepo.findByUserId(userId);
    if (!professional) throw new NotFoundException('Professional profile not found.');
    return this.appRepo.listByProfessional(professional.id);
  }

  async withdrawApplication(userId: string, applicationId: string): Promise<void> {
    const professional = await this.profRepo.findByUserId(userId);
    if (!professional) throw new NotFoundException('Professional profile not found.');

    const app = await this.appRepo.findById(applicationId);
    if (!app) throw new NotFoundException('Application not found.');
    if (app.professionalId !== professional.id) {
      throw new ForbiddenException(
        'You do not have permission to withdraw this application.',
      );
    }
    if (app.status === 'hired') {
      throw new BadRequestException(
        'You cannot withdraw an application that has been accepted.',
      );
    }
    if (app.status === 'withdrawn') {
      throw new BadRequestException('This application has already been withdrawn.');
    }

    await this.appRepo.withdraw(applicationId);
  }

  // ─── Employer actions ─────────────────────────────────────────────────────

  async getJobApplications(userId: string, jobId: string) {
    const employer = await this.employerRepo.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    const job = await this.jobsRepo.findById(jobId);
    if (!job || job.employerId !== employer.id) {
      throw new NotFoundException('Job not found.');
    }

    return this.appRepo.listByJob(jobId);
  }

  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const employer = await this.employerRepo.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    const app = await this.appRepo.findById(applicationId);
    if (!app) throw new NotFoundException('Application not found.');

    // Verify the application belongs to one of this employer's jobs
    const job = await this.jobsRepo.findById(app.jobId);
    if (!job || job.employerId !== employer.id) {
      throw new ForbiddenException(
        'You do not have permission to update this application.',
      );
    }

    if (app.status === 'withdrawn') {
      throw new BadRequestException(
        'Cannot update a withdrawn application.',
      );
    }

    return this.appRepo.updateStatus(
      applicationId,
      dto.status,
      dto.rejectionReason,
    );
  }

  // ─── Scheduled jobs ───────────────────────────────────────────────────────

  /** Remind employers of applications not reviewed in 14 days */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendStaleApplicationReminders(): Promise<void> {
    const stale = await this.appRepo.findStaleApplications();
    if (stale.length > 0) {
      console.log(
        `[ApplicationsService] ${stale.length} stale application(s) need employer review.`,
      );
      // Notification dispatch handled by NotificationsModule in the next sprint
    }
  }
}
