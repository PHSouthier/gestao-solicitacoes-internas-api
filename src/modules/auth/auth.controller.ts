import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { UsuarioResponseDto } from '../usuarios/dto/usuario-response.dto.js';
import { COOKIE_SESSAO, opcoesCookieSessao } from './auth-cookie.js';
import { AuthService } from './auth.service.js';
import type { UsuarioAutenticado } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { UsuarioAtual } from './usuario-atual.decorator.js';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha inválidos' })
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

  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Usuário logado' })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiUnauthorizedResponse({ description: 'Não autenticado' })
  me(@UsuarioAtual() usuario: UsuarioAutenticado): Promise<UsuarioResponseDto> {
    return this.authService.usuarioLogado(usuario.id);
  }
}
