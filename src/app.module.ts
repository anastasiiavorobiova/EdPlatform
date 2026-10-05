import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from '@/app.controller.js';
import { AppService } from '@/app.service.js';
import { validateEnv } from '@/config/env.validation.js';
import { DatabaseModule } from '@/database/database.module.js';
import { HealthModule } from '@/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Registered here rather than with app.useGlobalPipes() in main.ts so it
    // also applies to e2e tests, which build the app without main.ts
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
