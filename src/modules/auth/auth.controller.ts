import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiServiceUnavailableResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { UsuarioResponseDto } from '../usuarios/dto/usuario-response.dto.js';
import {
  COOKIE_LOGIN_GOOGLE,
  COOKIE_SESSAO,
  opcoesCookieSessao,
  VALIDADE_LOGIN_GOOGLE_MS,
} from './auth-cookie.js';
import { AuthService } from './auth.service.js';
import type { UsuarioAutenticado } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { ErroLoginGoogle } from './google/erro-login-google.js';
import { GoogleOAuthService } from './google/google-oauth.service.js';
import { UsuarioAtual } from './usuario-atual.decorator.js';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly google: GoogleOAuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login com e-mail e senha',
    description: 'Em caso de sucesso, grava o JWT no cookie `access_token`.',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Dados inválidos',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'E-mail ou senha inválidos',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UsuarioResponseDto> {
    const { usuario, token, expiraEm } = await this.authService.login(dto);
    res.cookie(COOKIE_SESSAO, token, {
      ...opcoesCookieSessao(this.config),
      expires: expiraEm,
    });
    return usuario;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Encerra a sessão (apaga o cookie)' })
  @ApiNoContentResponse()
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(COOKIE_SESSAO, opcoesCookieSessao(this.config));
  }

  @Public()
  @Get('google')
  @ApiOperation({
    summary: 'Login com Google (abra no navegador, não pelo "Try it out")',
    description:
      'Redireciona para o Google. Na volta, cria a sessão (cookie `access_token`) e redireciona para o front.',
  })
  @ApiFoundResponse({
    description: 'Redireciona para a tela de login do Google',
  })
  @ApiServiceUnavailableResponse({
    type: ErrorResponseDto,
    description: 'Login com Google não configurado',
  })
  async loginGoogle(@Res() res: Response): Promise<void> {
    const { url, state, codeVerifier } = await this.google.iniciar();
    res.cookie(COOKIE_LOGIN_GOOGLE, JSON.stringify({ state, codeVerifier }), {
      ...opcoesCookieSessao(this.config),
      maxAge: VALIDADE_LOGIN_GOOGLE_MS,
    });
    res.redirect(url);
  }

  @Public()
  @Get('google/callback')
  @ApiExcludeEndpoint()
  async callbackGoogle(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') erroGoogle: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const opcoes = opcoesCookieSessao(this.config);
    const salvo: unknown = req.cookies?.[COOKIE_LOGIN_GOOGLE];
    res.clearCookie(COOKIE_LOGIN_GOOGLE, opcoes);

    try {
      if (erroGoogle) {
        throw new ErroLoginGoogle('cancelado');
      }
      const inicio = lerInicioLoginGoogle(salvo);
      if (!inicio || !code || !state || state !== inicio.state) {
        throw new ErroLoginGoogle('estado_invalido');
      }

      const perfil = await this.google.concluir(code, inicio.codeVerifier);
      const { token, expiraEm } =
        await this.authService.entrarComGoogle(perfil);

      res.cookie(COOKIE_SESSAO, token, { ...opcoes, expires: expiraEm });
      res.redirect(this.urlFront('/'));
    } catch (erro) {
      const motivo = erro instanceof ErroLoginGoogle ? erro.motivo : 'falhou';
      if (motivo === 'falhou') {
        this.logger.error(
          'Falha no login com Google',
          erro instanceof Error ? erro.stack : String(erro),
        );
      }
      res.redirect(this.urlFront(`/login?erro=google_${motivo}`));
    }
  }

  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Usuário logado' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Não autenticado',
  })
  me(@UsuarioAtual() usuario: UsuarioAutenticado): Promise<UsuarioResponseDto> {
    return this.authService.usuarioLogado(usuario.id);
  }

  private urlFront(caminho: string): string {
    const base = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return new URL(caminho, base).toString();
  }
}

function lerInicioLoginGoogle(
  valor: unknown,
): { state: string; codeVerifier: string } | null {
  if (typeof valor !== 'string') return null;
  try {
    const dados: unknown = JSON.parse(valor);
    if (
      typeof dados === 'object' &&
      dados !== null &&
      'state' in dados &&
      'codeVerifier' in dados &&
      typeof dados.state === 'string' &&
      typeof dados.codeVerifier === 'string'
    ) {
      return { state: dados.state, codeVerifier: dados.codeVerifier };
    }
  } catch {
    // cookie adulterado: tratado como ausente
  }
  return null;
}
