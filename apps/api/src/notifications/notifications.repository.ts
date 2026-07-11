import { Inject, Injectable } from '@nestjs/common';
import { and, eq, desc, sql } from 'drizzle-orm';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { notifications } from '../database/schema/notifications';

type NotificationRow = typeof notifications.$inferSelect;

@Injectable()
export class NotificationsRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  async create(data: typeof notifications.$inferInsert): Promise<NotificationRow> {
    const result = await this.db.insert(notifications).values(data).returning();
    const row = result[0];
    if (!row) throw new Error('Failed to create notification');
    return row;
  }

  async listByUser(
    userId: string,
    limit = 30,
    offset = 0,
  ): Promise<NotificationRow[]> {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countUnread(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count ?? 0;
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }
}
