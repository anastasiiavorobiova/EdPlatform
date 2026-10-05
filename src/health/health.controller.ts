import {
  Controller,
  Get,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { LivenessResponseDto } from '@/health/dto/liveness-response.dto.js';
import { ReadinessResponseDto } from '@/health/dto/readiness-response.dto.js';

/**
 * Liveness and readiness probes.
 * Version-neutral, so their URLs stay stable for Docker HEALTHCHECK and monitoring.
 */
@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  /** Reports that the process is up without touching the database. */
  @Get()
  @ApiOperation({ summary: 'Liveness: the process is up' })
  @ApiOkResponse({ type: LivenessResponseDto })
  check(): LivenessResponseDto {
    return { status: 'ok', uptime: process.uptime() };
  }

  /** Runs `SELECT 1` and responds with 503 when the database is unreachable. */
  @Get('db')
  @ApiOperation({ summary: 'Readiness: the database responds' })
  @ApiOkResponse({ type: ReadinessResponseDto })
  @ApiServiceUnavailableResponse({ description: 'Database is unreachable' })
  async checkDb(): Promise<ReadinessResponseDto> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', db: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
  }
}
