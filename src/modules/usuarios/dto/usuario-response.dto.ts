import type { PerfilUsuario } from '../../../generated/prisma/enums.js';

export class UsuarioResponseDto {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  criadoEm: Date;
}
