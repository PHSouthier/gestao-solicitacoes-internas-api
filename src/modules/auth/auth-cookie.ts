import type { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

/** Cookie com o JWT da sessão. */
export const COOKIE_SESSAO = 'access_token';

/** Cookie temporário do login com Google (state e PKCE), válido por 10 minutos. */
export const COOKIE_LOGIN_GOOGLE = 'login_google';
export const VALIDADE_LOGIN_GOOGLE_MS = 10 * 60 * 1000;

/** httpOnly: o JavaScript do navegador não lê o cookie, o que protege contra XSS. */
export function opcoesCookie(config: ConfigService): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.get('COOKIE_SECURE') === 'true',
    path: '/',
  };
}
