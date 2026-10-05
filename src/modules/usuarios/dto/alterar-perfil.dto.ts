import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PerfilUsuario } from '../../../generated/prisma/enums.js';

export class AlterarPerfilDto {
  @ApiProperty({
    enum: PerfilUsuario,
    enumName: 'PerfilUsuario',
    example: 'ANALISTA',
  })
  @IsEnum(PerfilUsuario, {
    message: 'Perfil inválido. Use SOLICITANTE, ANALISTA ou ADMINISTRADOR.',
  })
  perfil: PerfilUsuario;
}
