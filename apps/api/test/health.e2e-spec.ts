import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import type { Server } from 'http';
import { HealthModule } from '../src/health/health.module';

describe('GET /health (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    app = moduleFixture.createNestApplication<INestApplication<Server>>();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 with status ok', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String) as string,
      version: expect.any(String) as string,
    });
  });

  it('should return a valid ISO timestamp', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    const timestamp = response.body.timestamp as string;
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });
});
