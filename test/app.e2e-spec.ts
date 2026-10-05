import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '@/app.module.js';
import { setupApp } from '@/app.setup.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('requires a version for versioned routes', () => {
    return request(app.getHttpServer()).get('/api').expect(404);
  });

  it('/api/health (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('/api/health/db (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health/db')
      .expect(200)
      .expect({ status: 'ok', db: 'up' });
  });

  it('serves routes only under the /api prefix', () => {
    return request(app.getHttpServer()).get('/health').expect(404);
  });

  it('keeps health checks version-neutral', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(404);
  });

  it('/api/docs-json (GET) describes versioned and neutral routes', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining(['/api/v1', '/api/health', '/api/health/db']),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
