import { ApiProperty } from '@nestjs/swagger';

/** Response of the readiness check. */
export class ReadinessResponseDto {
  /** Always `ok` when the database responds. */
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status: 'ok';

  /** Database state; `up` when `SELECT 1` succeeds. */
  @ApiProperty({ example: 'up', enum: ['up'] })
  db: 'up';
}
