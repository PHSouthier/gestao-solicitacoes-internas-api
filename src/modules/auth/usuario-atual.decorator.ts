import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestAutenticada, UsuarioAutenticado } from './auth.types.js';

export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext): UsuarioAutenticado =>
    ctx.switchToHttp().getRequest<RequestAutenticada>().usuario,
);
