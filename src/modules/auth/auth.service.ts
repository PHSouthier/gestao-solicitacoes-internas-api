import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import type { UsuarioResponseDto } from '../usuarios/dto/usuario-response.dto.js';
import {
  type ContaUsuario,
  UsuariosRepository,
} from '../usuarios/usuarios.repository.js';
import type { JwtPayload } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import { ErroLoginGoogle } from './google/erro-login-google.js';
import type { PerfilGoogle } from './google/google-oauth.service.js';

const HASH_FALSO =
  '$2b$12$cEb3aS1Ue8KmMof1ijEfHuQyjSn24OHjQ9KwPwvx/kTQ4gNet3Juu';

export interface Sessao {
  usuario: UsuarioResponseDto;
  token: string;
  expiraEm: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly jwt: JwtService,
  ) {}

  async login({ email, senha }: LoginDto): Promise<Sessao> {
    const conta = await this.usuarios.buscarParaLogin(email);
    const senhaConfere = await compare(senha, conta?.senhaHash ?? HASH_FALSO);

    if (!conta || !senhaConfere || !conta.ativo) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const { senhaHash: _senhaHash, ativo: _ativo, ...usuario } = conta;
    return this.criarSessao(usuario);
  }

  async entrarComGoogle(perfil: PerfilGoogle): Promise<Sessao> {
    const conta =
      (await this.usuarios.buscarContaPorGoogleId(perfil.googleId)) ??
      (await this.vincularOuCriarComGoogle(perfil));

    if (!conta.ativo) {
      throw new ErroLoginGoogle('usuario_inativo');
    }

    const { ativo: _ativo, googleId: _googleId, ...usuario } = conta;
    return this.criarSessao(usuario);
  }

  async usuarioLogado(id: string): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarios.buscarAtivoPorId(id);
    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
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

    if (existente?.googleId) {
      throw new ErroLoginGoogle('email_vinculado_a_outra_conta');
    }
    if (existente) {
      return this.usuarios.vincularGoogle(existente.id, perfil.googleId);
    }

    const nome = perfil.nome.trim().slice(0, 120) || email.split('@')[0];
    return this.usuarios.criarComGoogle({
      nome,
      email,
      googleId: perfil.googleId,
    });
  }

  private async criarSessao(usuario: UsuarioResponseDto): Promise<Sessao> {
    const payload: JwtPayload = { sub: usuario.id, perfil: usuario.perfil };
    const token = await this.jwt.signAsync(payload);
    const { exp } = this.jwt.decode<{ exp: number }>(token);

    return { usuario, token, expiraEm: new Date(exp * 1000) };
  }
}
