import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
  version: string;
}

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '0.1.0',
    };
  }
}
