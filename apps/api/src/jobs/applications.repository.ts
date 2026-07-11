import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, lte, sql } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { applications } from '../database/schema/applications';
import { jobs } from '../database/schema/jobs';
import { professionals } from '../database/schema/professionals';
import { employers } from '../database/schema/employers';

type ApplicationRow = typeof applications.$inferSelect;

export interface ApplicationWithContext extends ApplicationRow {
  job: {
    id: string;
    title: Record<string, string>;
    industry: string;
    city: string;
    country: string;
    employmentType: string;
    status: string;
  };
  employer?: {
    id: string;
    companyName: string;
  };
  professional?: {
    id: string;
    fullName: string;
  };
}

@Injectable()
export class ApplicationsRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  async findById(id: string): Promise<ApplicationRow | null> {
    const result = await this.db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), isNull(applications.deletedAt)))
      .limit(1);
    return result[0] ?? null;
  }

  async findByJobAndProfessional(
    jobId: string,
    professionalId: string,
  ): Promise<ApplicationRow | null> {
    const result = await this.db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.jobId, jobId),
          eq(applications.professionalId, professionalId),
          isNull(applications.deletedAt),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async create(data: typeof applications.$inferInsert): Promise<ApplicationRow> {
    const result = await this.db.insert(applications).values(data).returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create application');
    return row;
  }

  async updateStatus(
    id: string,
    status: ApplicationRow['status'],
    rejectionReason?: string,
  ): Promise<ApplicationRow> {
    const updates: Partial<typeof applications.$inferInsert> = {
      status,
      lastReviewedAt: new Date(),
      updatedAt: new Date(),
    };
    if (rejectionReason !== undefined) updates.rejectionReason = rejectionReason;

    const result = await this.db
      .update(applications)
      .set(updates)
      .where(eq(applications.id, id))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to update application status');
    return row;
  }

  async withdraw(id: string): Promise<void> {
    await this.db
      .update(applications)
      .set({ status: 'withdrawn', updatedAt: new Date() })
      .where(eq(applications.id, id));
  }

  /** Professional's application list with job context */
  async listByProfessional(professionalId: string): Promise<ApplicationWithContext[]> {
    const rows = await this.db
      .select({
        app: applications,
        job: {
          id: jobs.id,
          title: jobs.title,
          industry: jobs.industry,
          city: jobs.city,
          country: jobs.country,
          employmentType: jobs.employmentType,
          status: jobs.status,
        },
        employer: {
          id: employers.id,
          companyName: employers.companyName,
        },
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(employers, eq(jobs.employerId, employers.id))
      .where(
        and(
          eq(applications.professionalId, professionalId),
          isNull(applications.deletedAt),
        ),
      )
      .orderBy(applications.createdAt);

    return rows.map((r) => ({
      ...r.app,
      job: r.job as ApplicationWithContext['job'],
      employer: r.employer,
    }));
  }

  /** Employer's applications for a specific job */
  async listByJob(jobId: string): Promise<ApplicationWithContext[]> {
    const rows = await this.db
      .select({
        app: applications,
        job: {
          id: jobs.id,
          title: jobs.title,
          industry: jobs.industry,
          city: jobs.city,
          country: jobs.country,
          employmentType: jobs.employmentType,
          status: jobs.status,
        },
        professional: {
          id: professionals.id,
          fullName: professionals.fullName,
        },
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(professionals, eq(applications.professionalId, professionals.id))
      .where(
        and(
          eq(applications.jobId, jobId),
          isNull(applications.deletedAt),
        ),
      )
      .orderBy(applications.createdAt);

    return rows.map((r) => ({
      ...r.app,
      job: r.job as ApplicationWithContext['job'],
      professional: r.professional,
    }));
  }

  /** Find stale applications (not reviewed for > 14 days) for reminder notifications */
  async findStaleApplications(): Promise<ApplicationRow[]> {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000);
    return this.db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.status, 'received'),
          lte(applications.createdAt, fourteenDaysAgo),
          isNull(applications.deletedAt),
        ),
      );
  }

  async countByJobAndStatus(
    jobId: string,
  ): Promise<Record<string, number>> {
    const rows = await this.db
      .select({
        status: applications.status,
        count: sql<number>`count(*)::int`,
      })
      .from(applications)
      .where(and(eq(applications.jobId, jobId), isNull(applications.deletedAt)))
      .groupBy(applications.status);

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = row.count;
    }
    return result;
  }
}
