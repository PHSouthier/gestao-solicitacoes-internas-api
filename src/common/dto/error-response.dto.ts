import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailDto {
  @ApiProperty({ example: 'email' })
  field: string;

  @ApiProperty({ type: [String], example: ['Informe um e-mail válido.'] })
  messages: string[];
}

export class ErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Conflict' })
  error: string;

  @ApiProperty({
    example: 'EMAIL_JA_CADASTRADO',
    description: 'Código estável do erro. Use-o para tratar casos específicos.',
  })
  code: string;

  @ApiProperty({ example: 'Já existe um usuário cadastrado com este e-mail.' })
  message: string;

  @ApiProperty({
    type: [ErrorDetailDto],
    description: 'Erros por campo (preenchido em erros de validação).',
  })
  details: ErrorDetailDto[];

  @ApiProperty({ example: '/api/v1/usuarios' })
  path: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-04T22:00:00.000Z' })
  timestamp: string;

  @ApiProperty({
    example: '3f934837-4180-43f5-97b0-26796b7f5b70',
    description: 'Mesmo valor do header x-request-id.',
  })
  requestId: string;
}
