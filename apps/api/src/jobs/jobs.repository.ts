import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, isNull, lte, sql, desc } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { jobs, jobRequiredSkills } from '../database/schema/jobs';
import type { SearchJobsDto } from './dto/search-jobs.dto';

type JobRow = typeof jobs.$inferSelect;
type SkillRow = typeof jobRequiredSkills.$inferSelect;

export interface JobWithSkills extends JobRow {
  skills: SkillRow[];
}

const DEFAULT_EXPIRY_DAYS = 60;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

@Injectable()
export class JobsRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  async findById(id: string): Promise<JobRow | null> {
    const result = await this.db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), isNull(jobs.deletedAt)))
      .limit(1);
    return result[0] ?? null;
  }

  async findWithSkills(id: string): Promise<JobWithSkills | null> {
    const job = await this.findById(id);
    if (!job) return null;
    const skills = await this.listSkills(id);
    return { ...job, skills };
  }

  async listByEmployer(employerId: string): Promise<JobRow[]> {
    return this.db
      .select()
      .from(jobs)
      .where(and(eq(jobs.employerId, employerId), isNull(jobs.deletedAt)))
      .orderBy(desc(jobs.createdAt));
  }

  async create(
    data: Omit<typeof jobs.$inferInsert, 'expiresAt'> & { expiresAt?: Date },
  ): Promise<JobRow> {
    const expiresAt =
      data.expiresAt ?? new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 86_400_000);
    const result = await this.db
      .insert(jobs)
      .values({ ...data, expiresAt })
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create job');
    return row;
  }

  async update(
    id: string,
    data: Partial<typeof jobs.$inferInsert>,
  ): Promise<JobRow> {
    const result = await this.db
      .update(jobs)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(jobs.id, id), isNull(jobs.deletedAt)))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to update job');
    return row;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(jobs)
      .set({ deletedAt: new Date(), status: 'closed', updatedAt: new Date() })
      .where(eq(jobs.id, id));
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.db
      .update(jobs)
      .set({ viewCount: sql`${jobs.viewCount} + 1` })
      .where(eq(jobs.id, id));
  }

  // ─── Skills ───────────────────────────────────────────────────────────────

  async listSkills(jobId: string): Promise<SkillRow[]> {
    return this.db
      .select()
      .from(jobRequiredSkills)
      .where(eq(jobRequiredSkills.jobId, jobId));
  }

  async replaceSkills(jobId: string, skillNames: string[]): Promise<void> {
    await this.db
      .delete(jobRequiredSkills)
      .where(eq(jobRequiredSkills.jobId, jobId));

    if (skillNames.length > 0) {
      await this.db.insert(jobRequiredSkills).values(
        skillNames.map((s) => ({ jobId, skillName: s })),
      );
    }
  }

  // ─── Search ───────────────────────────────────────────────────────────────

  async search(dto: SearchJobsDto): Promise<{ data: JobWithSkills[]; total: number }> {
    const page = Math.max(1, parseInt(dto.page ?? '1', 10));
    const limit = Math.min(MAX_PAGE_LIMIT, parseInt(dto.limit ?? String(DEFAULT_PAGE_LIMIT), 10));
    const offset = (page - 1) * limit;

    const conditions = [
      eq(jobs.status, 'active'),
      isNull(jobs.deletedAt),
      gte(jobs.expiresAt, new Date()),
    ];

    if (dto.industry) conditions.push(eq(jobs.industry, dto.industry));
    if (dto.city) conditions.push(eq(jobs.city, dto.city));
    if (dto.country) conditions.push(eq(jobs.country, dto.country));
    if (dto.employmentType) {
      conditions.push(
        eq(jobs.employmentType, dto.employmentType as typeof jobs.$inferSelect['employmentType']),
      );
    }
    if (dto.salaryMin) {
      conditions.push(gte(jobs.salaryMax, dto.salaryMin));
    }
    if (dto.salaryMax) {
      conditions.push(lte(jobs.salaryMin, dto.salaryMax));
    }

    const where = and(...conditions);

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(jobs)
        .where(where)
        .orderBy(desc(jobs.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(where),
    ]);

    // Attach skills to each job
    const jobsWithSkills: JobWithSkills[] = await Promise.all(
      rows.map(async (row) => {
        const skills = await this.listSkills(row.id);
        return { ...row, skills };
      }),
    );

    return {
      data: jobsWithSkills,
      total: countResult[0]?.count ?? 0,
    };
  }

  /** Expire all active jobs whose expiresAt has passed — called by scheduler */
  async expireStaleJobs(): Promise<number> {
    const result = await this.db
      .update(jobs)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(jobs.status, 'active'),
          lte(jobs.expiresAt, new Date()),
          isNull(jobs.deletedAt),
        ),
      )
      .returning({ id: jobs.id });
    return result.length;
  }
}
