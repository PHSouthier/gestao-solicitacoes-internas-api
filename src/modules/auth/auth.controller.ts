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
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ApiErros } from '../../common/decorators/api-erros.decorator.js';
import { UsuarioResponseDto } from '../usuarios/dto/usuario-response.dto.js';
import {
  COOKIE_LOGIN_GOOGLE,
  COOKIE_SESSAO,
  opcoesCookie,
  VALIDADE_LOGIN_GOOGLE_MS,
} from './auth-cookie.js';
import { Public, UsuarioAtual } from './auth.decorators.js';
import { AuthService, type Sessao } from './auth.service.js';
import type { UsuarioAutenticado } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { ErroLoginGoogle } from './google/erro-login-google.js';
import { GoogleOAuthService } from './google/google-oauth.service.js';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly google: GoogleOAuthService,
    private readonly config: ConfigService,
  ) {}

  /** Login com e-mail e senha. Em caso de sucesso, grava o JWT no cookie `access_token`. */
  @Public()
  @Post('login')
  @ApiErros(400, { 401: 'E-mail ou senha inválidos' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UsuarioResponseDto> {
    const sessao = await this.authService.login(dto);
    this.gravarSessao(res, sessao);
    return sessao.usuario;
  }

  /** Encerra a sessão (apaga o cookie). */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(COOKIE_SESSAO, opcoesCookie(this.config));
  }

  /** Login com Google: redireciona para o Google (abra no navegador, não pelo "Try it out"). */
  @Public()
  @Get('google')
  @ApiResponse({
    status: 302,
    description: 'Redireciona para a tela de login do Google',
  })
  @ApiErros({ 503: 'Login com Google não configurado' })
  async loginGoogle(@Res() res: Response): Promise<void> {
    const { url, inicio } = await this.google.iniciar();
    res.cookie(COOKIE_LOGIN_GOOGLE, inicio, {
      ...opcoesCookie(this.config),
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
    @Query('error') erro: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const inicio: unknown = req.cookies?.[COOKIE_LOGIN_GOOGLE];
    res.clearCookie(COOKIE_LOGIN_GOOGLE, opcoesCookie(this.config));

    try {
      const perfil = await this.google.concluir({ code, state, erro, inicio });
      this.gravarSessao(res, await this.authService.entrarComGoogle(perfil));
      res.redirect(this.urlFront('/'));
    } catch (falha) {
      res.redirect(this.urlFront(`/login?erro=google_${this.motivo(falha)}`));
    }
  }

  /** Usuário logado. */
  @Get('me')
  @ApiErros(401)
  me(@UsuarioAtual() usuario: UsuarioAutenticado): Promise<UsuarioResponseDto> {
    return this.authService.usuarioLogado(usuario.id);
  }

  private gravarSessao(res: Response, { token, expiraEm }: Sessao): void {
    res.cookie(COOKIE_SESSAO, token, {
      ...opcoesCookie(this.config),
      expires: expiraEm,
    });
  }

  private motivo(falha: unknown): string {
    if (falha instanceof ErroLoginGoogle) {
      return falha.motivo;
    }
    this.logger.error(
      'Falha no login com Google',
      falha instanceof Error ? falha.stack : String(falha),
    );
    return 'falhou';
  }

  private urlFront(caminho: string): string {
    const base = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    return new URL(caminho, base).toString();
  }
}
