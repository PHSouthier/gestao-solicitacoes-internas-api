import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator.js';
import { COOKIE_SESSAO } from './auth-cookie.js';
import type { JwtPayload, RequestAutenticada } from './auth.types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publica) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestAutenticada>();
    const token: unknown = request.cookies?.[COOKIE_SESSAO];
    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Faça login para continuar.');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.usuario = { id: payload.sub, perfil: payload.perfil };
    } catch {
      throw new UnauthorizedException(
        'Sessão inválida ou expirada. Faça login novamente.',
      );
    }

    return true;
  }
}
