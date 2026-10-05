import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UsuarioResponseDto } from '../usuarios/dto/usuario-response.dto.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import type { JwtPayload } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';

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
      throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
    }

    const { senhaHash: _senhaHash, ativo: _ativo, ...usuario } = encontrado;
    const payload: JwtPayload = { sub: usuario.id, perfil: usuario.perfil };
    const token = await this.jwt.signAsync(payload);
    const { exp } = this.jwt.decode<{ exp: number }>(token);

    return { usuario, token, expiraEm: new Date(exp * 1000) };
  }

  async usuarioLogado(id: string): Promise<UsuarioResponseDto> {
    const usuario = await this.usuarios.buscarAtivoPorId(id);
    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
    }
    return usuario;
  }
}
