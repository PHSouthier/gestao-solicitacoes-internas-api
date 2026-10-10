import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';
import { ErroLoginGoogle } from './erro-login-google.js';

export interface PerfilGoogle {
  googleId: string;
  email: string;
  emailVerificado: boolean;
  nome: string;
}

export interface RetornoGoogle {
  code?: string;
  state?: string;
  erro?: string;
  inicio?: unknown;
}

interface InicioLogin {
  state: string;
  codeVerifier: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly cliente?: OAuth2Client;
  private readonly clientId?: string;

  constructor(config: ConfigService) {
    const clientId = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = config.get<string>('GOOGLE_CALLBACK_URL');

    if (clientId && clientSecret && redirectUri) {
      this.clientId = clientId;
      this.cliente = new OAuth2Client({ clientId, clientSecret, redirectUri });
    }
  }

  async iniciar(): Promise<{ url: string; inicio: string }> {
    const cliente = this.exigirCliente();
    const state = randomBytes(32).toString('base64url');
    const { codeVerifier, codeChallenge } =
      await cliente.generateCodeVerifierAsync();

    const url = cliente.generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      prompt: 'select_account',
    });

    const inicio: InicioLogin = { state, codeVerifier };
    return { url, inicio: JSON.stringify(inicio) };
  }

  async concluir({
    code,
    state,
    erro,
    inicio,
  }: RetornoGoogle): Promise<PerfilGoogle> {
    if (erro) {
      throw new ErroLoginGoogle('cancelado');
    }
    const salvo = lerInicio(inicio);
    if (!salvo || !code || state !== salvo.state) {
      throw new ErroLoginGoogle('estado_invalido');
    }

    const cliente = this.exigirCliente();
    const { tokens } = await cliente.getToken({
      code,
      codeVerifier: salvo.codeVerifier,
    });
    if (!tokens.id_token) {
      throw new ErroLoginGoogle('falhou');
    }

    const ticket = await cliente.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.clientId,
    });
    const dados = ticket.getPayload();
    if (!dados?.sub || !dados.email) {
      throw new ErroLoginGoogle('falhou');
    }

    return {
      googleId: dados.sub,
      email: dados.email,
      emailVerificado: dados.email_verified === true,
      nome: dados.name ?? '',
    };
  }

  private exigirCliente(): OAuth2Client {
    if (!this.cliente) {
      throw new ServiceUnavailableException(
        'Login com Google não está configurado.',
      );
    }
    return this.cliente;
  }
}

function lerInicio(valor: unknown): InicioLogin | null {
  try {
    const dados = JSON.parse(String(valor)) as Partial<InicioLogin>;
    return typeof dados.state === 'string' &&
      typeof dados.codeVerifier === 'string'
      ? { state: dados.state, codeVerifier: dados.codeVerifier }
      : null;
  } catch {
    return null;
  }
}
