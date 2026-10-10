import { IsEnum } from 'class-validator';
import { PerfilUsuario } from '../../../generated/prisma/enums.js';

export class AlterarPerfilDto {
  @IsEnum(PerfilUsuario, {
    message: 'Perfil inválido. Use SOLICITANTE, ANALISTA ou ADMINISTRADOR.',
  })
  perfil: PerfilUsuario;
}
