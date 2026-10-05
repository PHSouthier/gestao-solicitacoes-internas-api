import type { Request } from 'express';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';

export interface JwtPayload {
  sub: string;
  perfil: PerfilUsuario;
}

export interface UsuarioAutenticado {
  id: string;
  perfil: PerfilUsuario;
}

export type RequestAutenticada = Request & { usuario: UsuarioAutenticado };
