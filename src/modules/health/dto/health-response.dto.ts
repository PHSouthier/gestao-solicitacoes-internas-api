import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status: 'ok';

  @ApiProperty({ format: 'date-time', example: '2026-10-01T22:00:00.000Z' })
  timestamp: string;
}
