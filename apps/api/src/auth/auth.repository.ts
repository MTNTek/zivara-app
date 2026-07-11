import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { users, refreshTokens } from '../database/schema/users';
import { emailTokens } from '../database/schema/email-tokens';
import { employers, employerMembers } from '../database/schema/employers';
import { professionals } from '../database/schema/professionals';
import { auditLogs } from '../database/schema/audit-logs';

/** Raw DB row types inferred from schema */
type UserRow = typeof users.$inferSelect;
type RefreshTokenRow = typeof refreshTokens.$inferSelect;
type EmailTokenRow = typeof emailTokens.$inferSelect;
type ProfessionalRow = typeof professionals.$inferSelect;

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  // ─── Users ────────────────────────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<UserRow | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);
    return result[0] ?? null;
  }

  async findUserById(id: string): Promise<UserRow | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return result[0] ?? null;
  }

  async createUser(data: typeof users.$inferInsert): Promise<UserRow> {
    const result = await this.db.insert(users).values(data).returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create user');
    return row;
  }

  async updateUser(id: string, data: Partial<typeof users.$inferInsert>): Promise<void> {
    await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async incrementLoginAttempts(userId: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user) return;
    await this.db
      .update(users)
      .set({ loginAttempts: (user.loginAttempts ?? 0) + 1, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async lockAccount(userId: string, until: Date): Promise<void> {
    await this.db
      .update(users)
      .set({ lockoutUntil: until, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ loginAttempts: 0, lockoutUntil: null, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // ─── Refresh Tokens ───────────────────────────────────────────────────────

  async createRefreshToken(data: typeof refreshTokens.$inferInsert): Promise<RefreshTokenRow> {
    const result = await this.db.insert(refreshTokens).values(data).returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create refresh token');
    return row;
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
    const result = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    return result[0] ?? null;
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }

  // ─── Email Tokens ─────────────────────────────────────────────────────────

  async invalidatePreviousTokens(
    userId: string,
    type: 'email_verification' | 'password_reset',
  ): Promise<void> {
    await this.db
      .update(emailTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(emailTokens.userId, userId),
          eq(emailTokens.type, type),
          isNull(emailTokens.usedAt),
        ),
      );
  }

  async createEmailToken(data: typeof emailTokens.$inferInsert): Promise<void> {
    await this.db.insert(emailTokens).values(data);
  }

  async findEmailToken(
    tokenHash: string,
    type: 'email_verification' | 'password_reset',
  ): Promise<EmailTokenRow | null> {
    const result = await this.db
      .select()
      .from(emailTokens)
      .where(and(eq(emailTokens.tokenHash, tokenHash), eq(emailTokens.type, type)))
      .limit(1);
    return result[0] ?? null;
  }

  async markEmailTokenUsed(id: string): Promise<void> {
    await this.db
      .update(emailTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailTokens.id, id));
  }

  // ─── Professionals ────────────────────────────────────────────────────────

  async createProfessional(data: typeof professionals.$inferInsert): Promise<ProfessionalRow> {
    const result = await this.db.insert(professionals).values(data).returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create professional profile');
    return row;
  }

  // ─── Employers ────────────────────────────────────────────────────────────

  async findEmployerByTradeLicense(tradeLicenseNumber: string): Promise<typeof employers.$inferSelect | null> {
    const result = await this.db
      .select()
      .from(employers)
      .where(
        and(
          eq(employers.tradeLicenseNumber, tradeLicenseNumber),
          isNull(employers.deletedAt),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  }

  async createEmployer(data: typeof employers.$inferInsert): Promise<typeof employers.$inferSelect> {
    const result = await this.db.insert(employers).values(data).returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create employer');
    return row;
  }

  async createEmployerMember(data: typeof employerMembers.$inferInsert): Promise<void> {
    await this.db.insert(employerMembers).values(data);
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────

  async writeAuditLog(
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.db.insert(auditLogs).values({
      adminId: actorId, // for auth events, the actor is the user themselves
      action,
      targetType,
      targetId,
      reason,
      metadata: metadata ?? null,
    });
  }
}
