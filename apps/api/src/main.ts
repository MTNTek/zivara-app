import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as () => unknown;
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { validateConfig } from './config/config.schema';

async function bootstrap(): Promise<void> {
  // Validate config before anything else so failures are early and descriptive.
  const config = validateConfig(process.env as Record<string, unknown>);

  const app = await NestFactory.create(AppModule, {
    // Suppress NestJS default logger for bootstrap; our interceptor handles request logs.
    bufferLogs: false,
  });

  // Global exception filter — strips stack traces from responses, logs full context server-side
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging interceptor — logs method, path, status code, and response time
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Cookie parser — required for reading HTTP-only refresh token cookie
  app.use(cookieParser());

  const port = config.API_PORT;
  await app.listen(port);

  console.log(`[Bootstrap] NestJS API listening on port ${port} (${config.NODE_ENV})`);
}

bootstrap().catch((err: unknown) => {
  // Print the full error (including descriptive config errors) and exit with failure
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
