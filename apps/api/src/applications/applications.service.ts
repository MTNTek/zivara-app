import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApplicationsRepository } from './applications.repository';
import { JobsRepository } from '../jobs/jobs.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { EmployersRepository } from '../employers/employers.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@zivara/shared';
import type { ApplyDto } from './dto/apply.dto';
import type { UpdateStatusDto } from './dto/update-status.dto';

/**
 * Maps an application status transition to its EXACT notification type.
 *
 * Correctness Property 1: ApplicationShortlisted is the ONLY notification type
 * dispatched when status = 'shortlisted'. No other status triggers this type.
 */
const STATUS_TO_NOTIFICATION: Partial<Record<string, NotificationType>> = {
  shortlisted: NotificationType.ApplicationShortlisted,
  rejected: NotificationType.ApplicationRejected,
  hired: NotificationType.ApplicationHired,
  under_review: NotificationType.ApplicationUnderReview,
  withdrawn: NotificationType.ApplicationWithdrawn,
};

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsRepo: ApplicationsRepository,
    private readonly jobsRepo: JobsRepository,
    private readonly professionalsRepo: ProfessionalsRepository,
    private readonly employersRepo: EmployersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Professional: submit application ────────────────────────────────────

  async apply(userId: string, dto: ApplyDto) {
    const professional = await this.professionalsRepo.findByUserId(userId);
    if (!professional) throw new NotFoundException('Professional profile not found.');

    const job = await this.jobsRepo.findById(dto.jobId);
    if (!job) throw new NotFoundException('Job not found.');

    if (job.status !== 'active') {
      throw new BadRequestException(
        'This job posting is no longer accepting applications.',
      );
    }

    // Correctness Property 2: prevent duplicate applications
    const existing = await this.applicationsRepo.findByJobAndProfessional(
      dto.jobId,
      professional.id,
    );
    if (existing) {
      throw new ConflictException(
        'You have already applied to this job posting.',
      );
    }

    const application = await this.applicationsRepo.create({
      jobId: dto.jobId,
      professionalId: professional.id,
      status: 'received',
      coverNote: dto.coverNote ?? null,
    });

    // Notify professional: application received
    await this.sendNotification(
      userId,
      NotificationType.ApplicationReceived,
      application.id,
    );

    return application;
  }

  async withdrawApplication(userId: string, applicationId: string) {
    const professional = await this.professionalsRepo.findByUserId(userId);
    if (!professional) throw new NotFoundException('Professional profile not found.');

    const application = await this.applicationsRepo.findById(applicationId);
    if (!application) throw new NotFoundException('Application not found.');

    if (application.professionalId !== professional.id) {
      throw new ForbiddenException('You can only withdraw your own applications.');
    }

    if (application.status === 'withdrawn') {
      throw new BadRequestException('This application is already withdrawn.');
    }

    if (['hired', 'rejected'].includes(application.status)) {
      throw new BadRequestException(
        'This application cannot be withdrawn in its current state.',
      );
    }

    return this.applicationsRepo.withdraw(applicationId);
  }

  async getMyApplications(userId: string) {
    const professional = await this.professionalsRepo.findByUserId(userId);
    if (!professional) throw new NotFoundException('Professional profile not found.');

    const appList = await this.applicationsRepo.listByProfessional(professional.id);

    // Enrich with job title for display
    const enriched = await Promise.all(
      appList.map(async (app) => {
        const job = await this.jobsRepo.findById(app.jobId);
        return {
          ...app,
          jobTitle: job?.title ?? null,
          jobStatus: job?.status ?? null,
        };
      }),
    );

    return enriched;
  }

  // ─── Employer: manage applications ───────────────────────────────────────

  async getJobApplications(userId: string, jobId: string) {
    const job = await this.jobsRepo.findById(jobId);
    if (!job) throw new NotFoundException('Job not found.');

    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);
    if (!employer || employer.id !== job.employerId) {
      throw new ForbiddenException('You do not have permission to view these applications.');
    }

    return this.applicationsRepo.listByJob(jobId);
  }

  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    dto: UpdateStatusDto,
  ) {
    const application = await this.applicationsRepo.findById(applicationId);
    if (!application) throw new NotFoundException('Application not found.');

    // Verify the employer owns the job
    const job = await this.jobsRepo.findById(application.jobId);
    if (!job) throw new NotFoundException('Job not found.');

    const employer = await this.employersRepo.findEmployerByMemberUserId(userId);
    if (!employer || employer.id !== job.employerId) {
      throw new ForbiddenException('You do not have permission to manage this application.');
    }

    if (application.status === 'withdrawn') {
      throw new BadRequestException('Cannot update a withdrawn application.');
    }

    const updated = await this.applicationsRepo.updateStatus(
      applicationId,
      dto.status,
      dto.rejectionReason,
    );

    // Send notification that EXACTLY matches the new status.
    // Correctness Property 1: shortlisted notification ONLY sent when status === 'shortlisted'
    const professional = await this.professionalsRepo.findById(application.professionalId);
    if (professional) {
      const notificationType = STATUS_TO_NOTIFICATION[dto.status];
      if (notificationType) {
        await this.sendNotificationToUser(
          professional.userId,
          notificationType,
          applicationId,
        );
      }
    }

    return updated;
  }

  // ─── Scheduled: stale application reminders ──────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async sendStaleApplicationReminders(): Promise<void> {
    const stale = await this.applicationsRepo.findStale();
    console.log(`[ApplicationsService] ${stale.length} stale application(s) found.`);
    // Notification dispatch to employer is handled by NotificationsService
    // (wired in the Notifications sprint). Logged here for now.
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Dispatch a notification. Type determines the exact message content —
   * callers cannot override content, enforcing notification accuracy.
   */
  private async sendNotification(
    recipientUserId: string,
    type: NotificationType,
    referenceId: string,
  ): Promise<void> {
    try {
      await this.notificationsService.send(recipientUserId, type, {
        referenceType: 'application',
        referenceId,
      });
    } catch (err) {
      // Notification failure must never break the main flow
      console.error(`[ApplicationsService] Notification dispatch failed: ${String(err)}`);
    }
  }

  private async sendNotificationToUser(
    userId: string,
    type: NotificationType,
    referenceId: string,
  ): Promise<void> {
    return this.sendNotification(userId, type, referenceId);
  }
}
