import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { ratings } from '../database/schema/ratings';

type RatingRow = typeof ratings.$inferSelect;

@Injectable()
export class RatingsRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  async create(data: typeof ratings.$inferInsert): Promise<RatingRow> {
    const result = await this.db.insert(ratings).values(data).returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create rating');
    return row;
  }

  async findById(id: string): Promise<RatingRow | null> {
    const result = await this.db
      .select()
      .from(ratings)
      .where(eq(ratings.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByShiftAndReviewer(
    shiftId: string,
    reviewerId: string,
  ): Promise<RatingRow | null> {
    const result = await this.db
      .select()
      .from(ratings)
      .where(and(eq(ratings.shiftId, shiftId), eq(ratings.reviewerId, reviewerId)))
      .limit(1);
    return result[0] ?? null;
  }

  async listByReviewee(revieweeId: string): Promise<RatingRow[]> {
    return this.db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.revieweeId, revieweeId),
          eq(ratings.moderationStatus, 'approved'),
        ),
      );
  }

  async getAverageRating(revieweeId: string): Promise<{
    average: number;
    count: number;
  }> {
    const result = await this.db
      .select({
        average: sql<number>`ROUND(AVG(${ratings.stars})::numeric, 1)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(ratings)
      .where(
        and(
          eq(ratings.revieweeId, revieweeId),
          eq(ratings.moderationStatus, 'approved'),
        ),
      );

    return {
      average: result[0]?.average ?? 0,
      count: result[0]?.count ?? 0,
    };
  }

  /**
   * Ratings are immutable (Correctness Property 8).
   * Only moderationStatus can be updated, and only by admins.
   * This method is called only from the Admin module.
   */
  async updateModerationStatus(
    id: string,
    status: 'approved' | 'flagged' | 'removed',
    adminId: string,
    reason?: string,
  ): Promise<RatingRow> {
    const result = await this.db
      .update(ratings)
      .set({
        moderationStatus: status,
        flaggedReason: reason ?? null,
        reviewedByAdmin: adminId,
      })
      .where(eq(ratings.id, id))
      .returning();
    const row = result[0];
    if (!row) throw new Error('Failed to update rating moderation status');
    return row;
  }
}
