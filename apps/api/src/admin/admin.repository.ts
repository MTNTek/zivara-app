import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, isNull, sql, desc, count } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { users } from '../database/schema/users';
import { professionals } from '../database/schema/professionals';
import { employers } from '../database/schema/employers';
import { jobs } from '../database/schema/jobs';
import { shifts } from '../database/schema/shifts';
import { ratings } from '../database/schema/ratings';
import { auditLogs } from '../database/schema/audit-logs';

@Injectable()
export class AdminRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  // ─── Dashboard stats ──────────────────────────────────────────────────────

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newToday,
      totalProfessionals,
      totalEmployers,
      pendingProfessionalVerifications,
      pendingEmployerVerifications,
      activeJobs,
      activeShifts,
      flaggedRatings,
      disputedShifts,
    ] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)::int` }).from(users).where(isNull(users.deletedAt)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(users).where(and(isNull(users.deletedAt), gte(users.createdAt, today))),
      this.db.select({ count: sql<number>`count(*)::int` }).from(professionals).where(isNull(professionals.deletedAt)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(employers).where(isNull(employers.deletedAt)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(professionals).where(and(eq(professionals.verificationStatus, 'pending'), isNull(professionals.deletedAt))),
      this.db.select({ count: sql<number>`count(*)::int` }).from(employers).where(and(eq(employers.verificationStatus, 'pending'), isNull(employers.deletedAt))),
      this.db.select({ count: sql<number>`count(*)::int` }).from(jobs).where(and(eq(jobs.status, 'active'), isNull(jobs.deletedAt))),
      this.db.select({ count: sql<number>`count(*)::int` }).from(shifts).where(eq(shifts.status, 'scheduled')),
      this.db.select({ count: sql<number>`count(*)::int` }).from(ratings).where(eq(ratings.moderationStatus, 'flagged')),
      this.db.select({ count: sql<number>`count(*)::int` }).from(shifts).where(eq(shifts.status, 'disputed')),
    ]);

    return {
      totalUsers: totalUsers[0]?.count ?? 0,
      newUsersToday: newToday[0]?.count ?? 0,
      totalProfessionals: totalProfessionals[0]?.count ?? 0,
      totalEmployers: totalEmployers[0]?.count ?? 0,
      pendingProfessionalVerifications: pendingProfessionalVerifications[0]?.count ?? 0,
      pendingEmployerVerifications: pendingEmployerVerifications[0]?.count ?? 0,
      activeJobs: activeJobs[0]?.count ?? 0,
      activeShifts: activeShifts[0]?.count ?? 0,
      flaggedRatings: flaggedRatings[0]?.count ?? 0,
      disputedShifts: disputedShifts[0]?.count ?? 0,
    };
  }

  // ─── Verification queues ──────────────────────────────────────────────────

  async getPendingProfessionalVerifications() {
    return this.db
      .select()
      .from(professionals)
      .where(and(eq(professionals.verificationStatus, 'pending'), isNull(professionals.deletedAt)))
      .orderBy(professionals.updatedAt);
  }

  async getPendingEmployerVerifications() {
    return this.db
      .select()
      .from(employers)
      .where(and(eq(employers.verificationStatus, 'pending'), isNull(employers.deletedAt)))
      .orderBy(employers.updatedAt);
  }

  // ─── User management ──────────────────────────────────────────────────────

  async findUserById(id: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    await this.db
      .update(users)
      .set({ suspendedAt: new Date(), suspensionReason: reason, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async unsuspendUser(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ suspendedAt: null, suspensionReason: null, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateProfessionalVerification(
    id: string,
    status: 'verified' | 'rejected' | 'pending' | 'unverified',
  ): Promise<void> {
    await this.db
      .update(professionals)
      .set({ verificationStatus: status, updatedAt: new Date() })
      .where(eq(professionals.id, id));
  }

  async updateEmployerVerification(
    id: string,
    status: 'verified' | 'rejected' | 'suspended',
  ): Promise<void> {
    await this.db
      .update(employers)
      .set({ verificationStatus: status, updatedAt: new Date() })
      .where(eq(employers.id, id));
  }

  async recomputeEmployerBadge(employerId: string): Promise<void> {
    const [emp] = await this.db.select().from(employers).where(eq(employers.id, employerId)).limit(1);
    if (!emp) return;
    const isVisible = emp.verificationStatus === 'verified' && !emp.complianceFlag && !emp.deletedAt;
    await this.db.update(employers).set({ isBadgeVisible: isVisible, updatedAt: new Date() }).where(eq(employers.id, employerId));
  }

  // ─── Flagged ratings ──────────────────────────────────────────────────────

  async getFlaggedRatings() {
    return this.db
      .select()
      .from(ratings)
      .where(eq(ratings.moderationStatus, 'flagged'))
      .orderBy(ratings.createdAt);
  }

  // ─── Disputes ─────────────────────────────────────────────────────────────

  async getDisputedShifts() {
    return this.db
      .select()
      .from(shifts)
      .where(eq(shifts.status, 'disputed'))
      .orderBy(desc(shifts.updatedAt));
  }

  async resolveDispute(shiftId: string, resolution: 'completed' | 'cancelled'): Promise<void> {
    await this.db
      .update(shifts)
      .set({ status: resolution, updatedAt: new Date() })
      .where(eq(shifts.id, shiftId));
  }

  // ─── Audit logs ───────────────────────────────────────────────────────────

  async writeAuditLog(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.db.insert(auditLogs).values({
      adminId,
      action,
      targetType,
      targetId,
      reason,
      metadata: metadata ?? null,
    });
  }

  async getAuditLogs(limit = 50) {
    return this.db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  async getAnalytics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

    const [jobsByIndustry, recentRegistrations] = await Promise.all([
      this.db
        .select({ industry: jobs.industry, count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(and(eq(jobs.status, 'active'), isNull(jobs.deletedAt)))
        .groupBy(jobs.industry)
        .orderBy(desc(count())),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(isNull(users.deletedAt), gte(users.createdAt, thirtyDaysAgo))),
    ]);

    return {
      jobsByIndustry,
      registrationsLast30Days: recentRegistrations[0]?.count ?? 0,
    };
  }
}
