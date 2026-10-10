import type { Request } from 'express';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';

/** Conteúdo do JWT guardado no cookie de sessão. */
export interface JwtPayload {
  sub: string;
  perfil: PerfilUsuario;
}

/** Usuário logado, recebido nas rotas pelo decorator `@UsuarioAtual()`. */
export interface UsuarioAutenticado {
  id: string;
  perfil: PerfilUsuario;
}

export type RequestAutenticada = Request & { usuario?: UsuarioAutenticado };
