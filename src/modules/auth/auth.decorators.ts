import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';
import type { RequestAutenticada } from './auth.types.js';

export const ROTA_PUBLICA = 'rotaPublica';
export const PERFIS_PERMITIDOS = 'perfisPermitidos';

/** Libera a rota sem login. */
export const Public = () => SetMetadata(ROTA_PUBLICA, true);

/** Restringe a rota aos perfis informados. */
export const Perfis = (...perfis: PerfilUsuario[]) =>
  SetMetadata(PERFIS_PERMITIDOS, perfis);

/** Injeta o usuário logado no parâmetro do método. */
export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<RequestAutenticada>().usuario,
);
