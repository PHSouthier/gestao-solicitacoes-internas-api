import type { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export const COOKIE_SESSAO = 'access_token';

export const COOKIE_LOGIN_GOOGLE = 'login_google';
export const VALIDADE_LOGIN_GOOGLE_MS = 10 * 60 * 1000;

export function opcoesCookie(config: ConfigService): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.get('COOKIE_SECURE') === 'true',
    path: '/',
  };
}
