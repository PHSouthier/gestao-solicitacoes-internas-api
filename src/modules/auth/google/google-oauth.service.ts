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

export interface InicioLoginGoogle {
  url: string;
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

  async iniciar(): Promise<InicioLoginGoogle> {
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

    return { url, state, codeVerifier };
  }

  async concluir(code: string, codeVerifier: string): Promise<PerfilGoogle> {
    const cliente = this.exigirCliente();

    const { tokens } = await cliente.getToken({ code, codeVerifier });
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
