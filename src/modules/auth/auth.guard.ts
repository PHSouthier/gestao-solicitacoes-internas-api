import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';
import { COOKIE_SESSAO } from './auth-cookie.js';
import { PERFIS_PERMITIDOS, ROTA_PUBLICA } from './auth.decorators.js';
import type {
  JwtPayload,
  RequestAutenticada,
  UsuarioAutenticado,
} from './auth.types.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.lerMetadado<boolean>(context, ROTA_PUBLICA)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestAutenticada>();
    const usuario = await this.autenticar(request);
    request.usuario = usuario;

    const perfis = this.lerMetadado<PerfilUsuario[]>(
      context,
      PERFIS_PERMITIDOS,
    );
    if (perfis && !perfis.includes(usuario.perfil)) {
      throw new ForbiddenException(
        'Seu perfil não tem permissão para esta ação.',
      );
    }
    return true;
  }

  private async autenticar(
    request: RequestAutenticada,
  ): Promise<UsuarioAutenticado> {
    const token: unknown = request.cookies?.[COOKIE_SESSAO];
    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Faça login para continuar.');
    }

    try {
      const { sub, perfil } = await this.jwt.verifyAsync<JwtPayload>(token);
      return { id: sub, perfil };
    } catch {
      throw new UnauthorizedException(
        'Sessão inválida ou expirada. Faça login novamente.',
      );
    }
  }

  private lerMetadado<T>(context: ExecutionContext, chave: string) {
    return this.reflector.getAllAndOverride<T | undefined>(chave, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
}
