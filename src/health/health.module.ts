import { Module } from '@nestjs/common';
import { HealthController } from '@/health/health.controller.js';

/** Liveness and readiness endpoints. */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
