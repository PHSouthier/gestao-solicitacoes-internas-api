import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { CodigoErro } from '../../common/errors/codigos-erro.js';
import { UsuarioResponseDto } from '../usuarios/dto/usuario-response.dto.js';
import {
  type ContaUsuario,
  UsuariosService,
} from '../usuarios/usuarios.service.js';
import type { JwtPayload } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { ErroLoginGoogle } from './google/erro-login-google.js';
import type { PerfilGoogle } from './google/google-oauth.service.js';

const HASH_FALSO =
  '$2b$12$cEb3aS1Ue8KmMof1ijEfHuQyjSn24OHjQ9KwPwvx/kTQ4gNet3Juu';

const CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos.';

export interface ResultadoLogin {
  usuario: UsuarioResponseDto;
  token: string;
  expiraEm: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<ResultadoLogin> {
    const encontrado = await this.usuarios.buscarParaLogin(dto.email);
    const senhaConfere = await compare(
      dto.senha,
      encontrado?.senhaHash ?? HASH_FALSO,
    );

    if (!encontrado || !senhaConfere || !encontrado.ativo) {
      throw new UnauthorizedException({
        code: CodigoErro.CREDENCIAIS_INVALIDAS,
        message: CREDENCIAIS_INVALIDAS,
      });
    }

    const { senhaHash: _senhaHash, ativo: _ativo, ...usuario } = encontrado;
    return this.emitirSessao(usuario);
  }

  async entrarComGoogle(perfil: PerfilGoogle): Promise<ResultadoLogin> {
    const conta =
      (await this.usuarios.buscarContaPorGoogleId(perfil.googleId)) ??
      (await this.vincularOuCriarComGoogle(perfil));

    if (!conta.ativo) {
      throw new ErroLoginGoogle('usuario_inativo');
    }

    const { ativo: _ativo, googleId: _googleId, ...usuario } = conta;
    return this.emitirSessao(usuario);
  }

  async usuarioLogado(id: string): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarios.buscarAtivoPorId(id);
    if (!usuario) {
      throw new UnauthorizedException({
        code: CodigoErro.SESSAO_INVALIDA,
        message: 'Sessão inválida. Faça login novamente.',
      });
    }
    return usuario;
  }

  private async vincularOuCriarComGoogle(
    perfil: PerfilGoogle,
  ): Promise<ContaUsuario> {
    if (!perfil.emailVerificado) {
      throw new ErroLoginGoogle('email_nao_verificado');
    }

    const email = perfil.email.trim().toLowerCase();
    const existente = await this.usuarios.buscarContaPorEmail(email);

    if (existente) {
      if (existente.googleId) {
        throw new ErroLoginGoogle('email_vinculado_a_outra_conta');
      }
      return this.usuarios.vincularGoogle(existente.id, perfil.googleId);
    }

    const nome = perfil.nome.trim().slice(0, 120) || email.split('@')[0];
    return this.usuarios.criarComGoogle({
      nome,
      email,
      googleId: perfil.googleId,
    });
  }

  private async emitirSessao(
    usuario: UsuarioResponseDto,
  ): Promise<ResultadoLogin> {
    const payload: JwtPayload = { sub: usuario.id, perfil: usuario.perfil };
    const token = await this.jwt.signAsync(payload);
    const { exp } = this.jwt.decode<{ exp: number }>(token);

    return { usuario, token, expiraEm: new Date(exp * 1000) };
  }
}
