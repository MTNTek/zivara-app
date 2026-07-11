import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { employers, employerMembers } from '../database/schema/employers';
import { users } from '../database/schema/users';

type EmployerRow = typeof employers.$inferSelect;
type MemberRow = typeof employerMembers.$inferSelect;

export interface MemberWithUser extends MemberRow {
  user: {
    id: string;
    email: string;
  };
}

@Injectable()
export class EmployersRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  // ─── Employer ─────────────────────────────────────────────────────────────

  async findById(id: string): Promise<EmployerRow | null> {
    const result = await this.db
      .select()
      .from(employers)
      .where(and(eq(employers.id, id), isNull(employers.deletedAt)))
      .limit(1);
    return result[0] ?? null;
  }

  async findByOwnerUserId(userId: string): Promise<EmployerRow | null> {
    const result = await this.db
      .select()
      .from(employers)
      .where(and(eq(employers.ownerUserId, userId), isNull(employers.deletedAt)))
      .limit(1);
    return result[0] ?? null;
  }

  /** Find the employer that a user belongs to (as any role including owner) */
  async findEmployerByMemberUserId(userId: string): Promise<EmployerRow | null> {
    const result = await this.db
      .select({ employer: employers })
      .from(employerMembers)
      .innerJoin(employers, eq(employerMembers.employerId, employers.id))
      .where(
        and(
          eq(employerMembers.userId, userId),
          isNull(employers.deletedAt),
        ),
      )
      .limit(1);
    return result[0]?.employer ?? null;
  }

  async updateEmployer(
    id: string,
    data: Partial<typeof employers.$inferInsert>,
  ): Promise<EmployerRow> {
    const result = await this.db
      .update(employers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to update employer');
    return row;
  }

  async recomputeBadgeVisibility(id: string): Promise<void> {
    const employer = await this.findById(id);
    if (!employer) return;

    const isVisible =
      employer.verificationStatus === 'verified' &&
      !employer.complianceFlag &&
      !employer.deletedAt;

    await this.db
      .update(employers)
      .set({ isBadgeVisible: isVisible, updatedAt: new Date() })
      .where(eq(employers.id, id));
  }

  // ─── Members ──────────────────────────────────────────────────────────────

  async listMembers(employerId: string): Promise<MemberWithUser[]> {
    const rows = await this.db
      .select({
        id: employerMembers.id,
        employerId: employerMembers.employerId,
        userId: employerMembers.userId,
        role: employerMembers.role,
        createdAt: employerMembers.createdAt,
        userEmail: users.email,
      })
      .from(employerMembers)
      .innerJoin(users, eq(employerMembers.userId, users.id))
      .where(eq(employerMembers.employerId, employerId));

    return rows.map((r) => ({
      id: r.id,
      employerId: r.employerId,
      userId: r.userId,
      role: r.role,
      createdAt: r.createdAt,
      user: { id: r.userId, email: r.userEmail },
    }));
  }

  async findMember(employerId: string, userId: string): Promise<MemberRow | null> {
    const result = await this.db
      .select()
      .from(employerMembers)
      .where(
        and(
          eq(employerMembers.employerId, employerId),
          eq(employerMembers.userId, userId),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async findMemberById(memberId: string): Promise<MemberRow | null> {
    const result = await this.db
      .select()
      .from(employerMembers)
      .where(eq(employerMembers.id, memberId))
      .limit(1);
    return result[0] ?? null;
  }

  async addMember(data: typeof employerMembers.$inferInsert): Promise<MemberRow> {
    const result = await this.db
      .insert(employerMembers)
      .values(data)
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to add team member');
    return row;
  }

  async updateMemberRole(
    memberId: string,
    role: 'manager' | 'recruiter',
  ): Promise<MemberRow> {
    const result = await this.db
      .update(employerMembers)
      .set({ role })
      .where(eq(employerMembers.id, memberId))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to update member role');
    return row;
  }

  async removeMember(memberId: string): Promise<void> {
    await this.db
      .delete(employerMembers)
      .where(eq(employerMembers.id, memberId));
  }

  async countMembers(employerId: string): Promise<number> {
    const rows = await this.db
      .select()
      .from(employerMembers)
      .where(eq(employerMembers.employerId, employerId));
    return rows.length;
  }
}
