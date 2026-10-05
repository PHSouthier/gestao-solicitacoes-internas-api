import { ConflictException, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CriarUsuarioDto } from './dto/criar-usuario.dto.js';
import { UsuarioResponseDto } from './dto/usuario-response.dto.js';

export const BCRYPT_CUSTO = 12;

const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  criadoEm: true,
} satisfies Prisma.UsuarioSelect;

const MENSAGEM_EMAIL_EM_USO =
  'Já existe um usuário cadastrado com este e-mail.';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  buscarParaLogin(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: { ...CAMPOS_PUBLICOS, senhaHash: true, ativo: true },
    });
  }

  buscarAtivoPorId(id: string): Promise<UsuarioResponseDto | null> {
    return this.prisma.usuario.findFirst({
      where: { id, ativo: true },
      select: CAMPOS_PUBLICOS,
    });
  }

  async criar(dto: CriarUsuarioDto): Promise<UsuarioResponseDto> {
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existente) {
      throw new ConflictException(MENSAGEM_EMAIL_EM_USO);
    }

    const senhaHash = await hash(dto.senha, BCRYPT_CUSTO);

    try {
      return await this.prisma.usuario.create({
        data: { nome: dto.nome, email: dto.email, senhaHash },
        select: CAMPOS_PUBLICOS,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(MENSAGEM_EMAIL_EM_USO);
      }
      throw error;
    }
  }
}
