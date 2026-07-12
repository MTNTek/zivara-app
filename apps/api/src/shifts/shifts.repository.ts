import { Inject, Injectable } from '@nestjs/common';
import { and, eq, desc, gte } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { shifts } from '../database/schema/shifts';

type ShiftRow = typeof shifts.$inferSelect;

@Injectable()
export class ShiftsRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  async findById(id: string): Promise<ShiftRow | null> {
    const result = await this.db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async create(data: typeof shifts.$inferInsert): Promise<ShiftRow> {
    const result = await this.db.insert(shifts).values(data).returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create shift');
    return row;
  }

  async update(
    id: string,
    data: Partial<typeof shifts.$inferInsert>,
  ): Promise<ShiftRow> {
    const result = await this.db
      .update(shifts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shifts.id, id))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to update shift');
    return row;
  }

  async listByProfessional(professionalId: string): Promise<ShiftRow[]> {
    return this.db
      .select()
      .from(shifts)
      .where(eq(shifts.professionalId, professionalId))
      .orderBy(desc(shifts.shiftDate));
  }

  async listByEmployer(employerId: string): Promise<ShiftRow[]> {
    return this.db
      .select()
      .from(shifts)
      .where(eq(shifts.employerId, employerId))
      .orderBy(desc(shifts.shiftDate));
  }

  /** Find shifts where both parties confirmed completion but not yet marked completed */
  async findPendingCompletion(): Promise<ShiftRow[]> {
    return this.db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.status, 'scheduled'),
          eq(shifts.employerConfirmedCompletion, true),
          eq(shifts.professionalConfirmedCompletion, true),
        ),
      );
  }

  async findUpcoming(professionalId: string): Promise<ShiftRow[]> {
    const today = new Date().toISOString().split('T')[0]!;
    return this.db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.professionalId, professionalId),
          gte(shifts.shiftDate, today),
          eq(shifts.status, 'scheduled'),
        ),
      )
      .orderBy(shifts.shiftDate);
  }
}
