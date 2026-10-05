import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@/app.module.js';
import { setupApp } from '@/app.setup.js';
import type { EnvironmentVariables } from '@/config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
