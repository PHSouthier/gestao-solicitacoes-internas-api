import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';
import type { CriarUsuarioDto } from './dto/criar-usuario.dto.js';
import type { UsuarioResponseDto } from './dto/usuario-response.dto.js';
import { UsuariosRepository } from './usuarios.repository.js';

export const BCRYPT_CUSTO = 12;

@Injectable()
export class UsuariosService {
  constructor(private readonly repositorio: UsuariosRepository) {}

  async criar(dto: CriarUsuarioDto): Promise<UsuarioResponseDto> {
    const usuario = await this.repositorio.criar({
      nome: dto.nome,
      email: dto.email,
      senhaHash: await hash(dto.senha, BCRYPT_CUSTO),
    });
    if (!usuario) {
      throw new ConflictException(
        'Já existe um usuário cadastrado com este e-mail.',
      );
    }
    return usuario;
  }

  listar(): Promise<UsuarioResponseDto[]> {
    return this.repositorio.listarAtivos();
  }

  async alterarPerfil(
    id: string,
    perfil: PerfilUsuario,
    idQuemAltera: string,
  ): Promise<UsuarioResponseDto> {
    if (id === idQuemAltera) {
      throw new ConflictException(
        'Você não pode alterar o seu próprio perfil.',
      );
    }
    if (!(await this.repositorio.existe(id))) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return this.repositorio.alterarPerfil(id, perfil);
  }
}
