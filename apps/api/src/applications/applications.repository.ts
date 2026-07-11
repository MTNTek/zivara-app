import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, lte, sql, desc } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { applications } from '../database/schema/applications';

type ApplicationRow = typeof applications.$inferSelect;

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
    const result = await this.db
      .insert(applications)
      .values(data)
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create application');
    return row;
  }

  async updateStatus(
    id: string,
    status: ApplicationRow['status'],
    rejectionReason?: string,
  ): Promise<ApplicationRow> {
    const updateData: Partial<typeof applications.$inferInsert> = {
      status,
      lastReviewedAt: new Date(),
      updatedAt: new Date(),
    };
    if (rejectionReason !== undefined) {
      updateData['rejectionReason'] = rejectionReason;
    }

    const result = await this.db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to update application status');
    return row;
  }

  async withdraw(id: string): Promise<ApplicationRow> {
    const result = await this.db
      .update(applications)
      .set({ status: 'withdrawn', updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to withdraw application');
    return row;
  }

  async listByProfessional(professionalId: string): Promise<ApplicationRow[]> {
    return this.db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.professionalId, professionalId),
          isNull(applications.deletedAt),
        ),
      )
      .orderBy(desc(applications.createdAt));
  }

  async listByJob(jobId: string): Promise<ApplicationRow[]> {
    return this.db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.jobId, jobId),
          isNull(applications.deletedAt),
        ),
      )
      .orderBy(desc(applications.createdAt));
  }

  async countByJob(jobId: string): Promise<{
    total: number;
    shortlisted: number;
    hired: number;
  }> {
    const rows = await this.db
      .select({ status: applications.status, count: sql<number>`count(*)::int` })
      .from(applications)
      .where(and(eq(applications.jobId, jobId), isNull(applications.deletedAt)))
      .groupBy(applications.status);

    let total = 0;
    let shortlisted = 0;
    let hired = 0;
    for (const r of rows) {
      total += r.count;
      if (r.status === 'shortlisted') shortlisted = r.count;
      if (r.status === 'hired') hired = r.count;
    }
    return { total, shortlisted, hired };
  }

  /** Find applications not reviewed in more than 14 days — for stale reminders */
  async findStale(): Promise<ApplicationRow[]> {
    const cutoff = new Date(Date.now() - 14 * 86_400_000);
    return this.db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.status, 'received'),
          isNull(applications.deletedAt),
          lte(applications.createdAt, cutoff),
        ),
      );
  }
}
