import {
  applyDecorators,
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { DECORATORS } from '@nestjs/swagger';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';
import type { RequestAutenticada } from './auth.types.js';

export const ROTA_PUBLICA = 'rotaPublica';
export const PERFIS_PERMITIDOS = 'perfisPermitidos';

export const Public = () =>
  applyDecorators(
    SetMetadata(ROTA_PUBLICA, true),
    SetMetadata(DECORATORS.API_SECURITY, [{}]),
  );

export const Perfis = (...perfis: PerfilUsuario[]) =>
  SetMetadata(PERFIS_PERMITIDOS, perfis);

export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<RequestAutenticada>().usuario,
);
