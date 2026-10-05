import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CodigoErro } from '../../common/errors/codigos-erro.js';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';
import type { RequestAutenticada } from './auth.types.js';
import { PERFIS_KEY } from './perfis.decorator.js';

@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<
      PerfilUsuario[] | undefined
    >(PERFIS_KEY, [context.getHandler(), context.getClass()]);
    if (!permitidos?.length) {
      return true;
    }

    const { usuario } = context.switchToHttp().getRequest<RequestAutenticada>();
    if (!usuario || !permitidos.includes(usuario.perfil)) {
      throw new ForbiddenException({
        code: CodigoErro.SEM_PERMISSAO,
        message: 'Seu perfil não tem permissão para esta ação.',
      });
    }
    return true;
  }
}
