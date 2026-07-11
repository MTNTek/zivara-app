import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import {
  professionals,
  professionalExperience,
  professionalSkills,
} from '../database/schema/professionals';

type ProfessionalRow = typeof professionals.$inferSelect;
type ExperienceRow = typeof professionalExperience.$inferSelect;
type SkillRow = typeof professionalSkills.$inferSelect;

@Injectable()
export class ProfessionalsRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  // ─── Profile ──────────────────────────────────────────────────────────────

  async findByUserId(userId: string): Promise<ProfessionalRow | null> {
    const result = await this.db
      .select()
      .from(professionals)
      .where(and(eq(professionals.userId, userId), isNull(professionals.deletedAt)))
      .limit(1);
    return result[0] ?? null;
  }

  async findById(id: string): Promise<ProfessionalRow | null> {
    const result = await this.db
      .select()
      .from(professionals)
      .where(and(eq(professionals.id, id), isNull(professionals.deletedAt)))
      .limit(1);
    return result[0] ?? null;
  }

  async updateProfile(
    id: string,
    data: Partial<typeof professionals.$inferInsert>,
  ): Promise<ProfessionalRow> {
    const result = await this.db
      .update(professionals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(professionals.id, id))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to update professional profile');
    return row;
  }

  // ─── Experience ───────────────────────────────────────────────────────────

  async listExperience(professionalId: string): Promise<ExperienceRow[]> {
    return this.db
      .select()
      .from(professionalExperience)
      .where(eq(professionalExperience.professionalId, professionalId))
      .orderBy(professionalExperience.startDate);
  }

  async addExperience(
    data: typeof professionalExperience.$inferInsert,
  ): Promise<ExperienceRow> {
    const result = await this.db
      .insert(professionalExperience)
      .values(data)
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to add experience');
    return row;
  }

  async findExperienceById(id: string): Promise<ExperienceRow | null> {
    const result = await this.db
      .select()
      .from(professionalExperience)
      .where(eq(professionalExperience.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async updateExperience(
    id: string,
    data: Partial<typeof professionalExperience.$inferInsert>,
  ): Promise<ExperienceRow> {
    const result = await this.db
      .update(professionalExperience)
      .set(data)
      .where(eq(professionalExperience.id, id))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to update experience');
    return row;
  }

  async deleteExperience(id: string): Promise<void> {
    await this.db
      .delete(professionalExperience)
      .where(eq(professionalExperience.id, id));
  }

  // ─── Skills ───────────────────────────────────────────────────────────────

  async listSkills(professionalId: string): Promise<SkillRow[]> {
    return this.db
      .select()
      .from(professionalSkills)
      .where(eq(professionalSkills.professionalId, professionalId))
      .orderBy(professionalSkills.skillName);
  }

  async addSkill(
    data: typeof professionalSkills.$inferInsert,
  ): Promise<SkillRow> {
    const result = await this.db
      .insert(professionalSkills)
      .values(data)
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to add skill');
    return row;
  }

  async findSkillById(id: string): Promise<SkillRow | null> {
    const result = await this.db
      .select()
      .from(professionalSkills)
      .where(eq(professionalSkills.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async deleteSkill(id: string): Promise<void> {
    await this.db
      .delete(professionalSkills)
      .where(eq(professionalSkills.id, id));
  }

  async countSkills(professionalId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(professionalSkills)
      .where(eq(professionalSkills.professionalId, professionalId));
    return result.length;
  }

  async countExperience(professionalId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(professionalExperience)
      .where(eq(professionalExperience.professionalId, professionalId));
    return result.length;
  }
}
