import { ApiProperty } from '@nestjs/swagger';

/** Response of the liveness check. */
export class LivenessResponseDto {
  /** Always `ok` when the process responds. */
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status: 'ok';

  /** Process uptime in seconds. */
  @ApiProperty({ example: 12.34 })
  uptime: number;
}
