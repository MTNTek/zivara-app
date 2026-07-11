import { z } from 'zod';

const configSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRY: z.string().min(1, 'JWT_ACCESS_EXPIRY is required'),
  JWT_REFRESH_EXPIRY: z.string().min(1, 'JWT_REFRESH_EXPIRY is required'),

  // SMTP
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z
    .string()
    .min(1, 'SMTP_PORT is required')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive('SMTP_PORT must be a positive integer')),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),

  // AWS S3
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),

  // Application
  NODE_ENV: z.enum(['development', 'test', 'production'], {
    errorMap: () => ({
      message: 'NODE_ENV must be one of: development, test, production',
    }),
  }),
  API_PORT: z
    .string()
    .min(1, 'API_PORT is required')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive('API_PORT must be a positive integer')),
  WEB_PORT: z
    .string()
    .min(1, 'WEB_PORT is required')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive('WEB_PORT must be a positive integer')),
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_API_URL is required')
    .url('NEXT_PUBLIC_API_URL must be a valid URL'),

  // Frontend URL for email links (verification, password reset)
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').default('http://localhost:3000'),

  // Email sender address
  SMTP_FROM: z.string().min(1).default('noreply@zivara.com'),

  // Dev mode bypass — set to 'true' to skip email verification sending
  // JWT, RBAC, password hashing, lockout, and rate limiting remain active
  SKIP_EMAIL_VERIFICATION: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type AppConfig = z.infer<typeof configSchema>;

/**
 * Validates all required environment variables at startup.
 * Throws a descriptive error listing every missing or invalid variable.
 */
export function validateConfig(config: Record<string, unknown>): AppConfig {
  const result = configSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `\n[Config] Application startup failed — invalid environment variables:\n${errors}\n\nPlease copy .env.example to .env and fill in all required values.`,
    );
  }

  return result.data;
}
