import { ApiProperty } from '@nestjs/swagger';
import { PerfilUsuario } from '../../../generated/prisma/enums.js';

export class UsuarioResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '7b0c2f9e-3c1a-4d2b-9f1e-2a6b8c4d5e6f',
  })
  id: string;

  @ApiProperty({ example: 'Maria Souza' })
  nome: string;

  @ApiProperty({ example: 'maria@empresa.com' })
  email: string;

  @ApiProperty({
    enum: PerfilUsuario,
    enumName: 'PerfilUsuario',
    example: 'SOLICITANTE',
  })
  perfil: PerfilUsuario;

  @ApiProperty({ format: 'date-time', example: '2026-10-01T22:00:00.000Z' })
  criadoEm: Date;
}
