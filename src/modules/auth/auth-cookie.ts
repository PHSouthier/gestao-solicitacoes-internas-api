import type { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export const COOKIE_SESSAO = 'access_token';

export function opcoesCookieSessao(config: ConfigService): CookieOptions {
  return {
    httpOnly: true, 
    sameSite: 'lax', 
    secure: config.get('COOKIE_SECURE') === 'true', 
    path: '/',
  };
}
