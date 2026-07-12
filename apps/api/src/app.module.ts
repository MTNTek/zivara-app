import { Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateConfig } from './config/config.schema';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { EmployersModule } from './employers/employers.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ShiftsModule } from './shifts/shifts.module';
import { RatingsModule } from './ratings/ratings.module';

/**
 * Root application module.
 *
 * - ConfigModule: global, validates env vars via Zod at startup
 * - ScheduleModule: enables @nestjs/schedule decorators across the app
 * - DatabaseModule: global placeholder (full Drizzle setup in Task 5)
 * - APP_PIPE: global ValidationPipe with strict settings
 *
 * Feature modules (auth, professionals, employers, etc.) are added in later tasks.
 */
@Module({
  imports: [
    // Validate all environment variables at startup using Zod.
    // validateConfig throws with a descriptive error on any missing/invalid var.
    {
      module: class ConfigModule {},
      providers: [
        {
          provide: 'APP_CONFIG',
          useFactory: () => validateConfig(process.env as Record<string, unknown>),
        },
      ],
      exports: ['APP_CONFIG'],
      global: true,
    },

    // Scheduler support — required for stale-application reminders, etc.
    ScheduleModule.forRoot(),

    // Rate limiting — 10 requests per minute per IP on throttled routes
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),

    // Database — global, provides DRIZZLE_CLIENT to all feature modules
    DatabaseModule,

    // Health check endpoint — GET /health
    HealthModule,

    // Authentication & Authorization
    AuthModule,

    // Professional profiles, experience, skills, documents
    ProfessionalsModule,

    // Employer company profiles, team members, verification
    EmployersModule,

    // Job postings — create, publish, search, expire
    JobsModule,

    // Applications — apply, status transitions, stale reminders
    ApplicationsModule,

    // Notifications — in-app notification center, accurate type-to-content mapping
    NotificationsModule,

    // Shifts — scheduling, confirmation, completion, disputes
    ShiftsModule,

    // Ratings — post-shift reviews, immutability, time-decay average, moderation
    RatingsModule,

    // Job postings, applications, status lifecycle
    JobsModule,
  ],
  providers: [
    // Global ValidationPipe: strips unknown fields, enforces DTO validation
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    // Global JWT guard — all routes require auth by default; use @Public() to opt out
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
