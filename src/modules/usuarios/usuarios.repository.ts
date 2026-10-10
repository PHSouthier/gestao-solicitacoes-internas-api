import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { UsuarioResponseDto } from './dto/usuario-response.dto.js';

/** Campos que podem sair na resposta (nunca a senha). */
const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  criadoEm: true,
} satisfies Prisma.UsuarioSelect;

/** Campos usados pelo login com Google. */
const CAMPOS_CONTA = {
  ...CAMPOS_PUBLICOS,
  ativo: true,
  googleId: true,
} satisfies Prisma.UsuarioSelect;

export type ContaUsuario = Prisma.UsuarioGetPayload<{
  select: typeof CAMPOS_CONTA;
}>;

/** Acesso ao banco dos usuários. Usado pelo módulo de usuários e pela autenticação. */
@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Devolve null se o e-mail já estiver cadastrado. */
  async criar(dados: {
    nome: string;
    email: string;
    senhaHash: string;
  }): Promise<UsuarioResponseDto | null> {
    try {
      return await this.prisma.usuario.create({
        data: dados,
        select: CAMPOS_PUBLICOS,
      });
    } catch (erro) {
      if (violouCampoUnico(erro)) {
        return null;
      }
      throw erro;
    }
  }

  listarAtivos(): Promise<UsuarioResponseDto[]> {
    return this.prisma.usuario.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: CAMPOS_PUBLICOS,
    });
  }

  async existe(id: string): Promise<boolean> {
    return (await this.prisma.usuario.count({ where: { id } })) > 0;
  }

  alterarPerfil(
    id: string,
    perfil: PerfilUsuario,
  ): Promise<UsuarioResponseDto> {
    return this.prisma.usuario.update({
      where: { id },
      data: { perfil },
      select: CAMPOS_PUBLICOS,
    });
  }

  buscarAtivoPorId(id: string): Promise<UsuarioResponseDto | null> {
    return this.prisma.usuario.findFirst({
      where: { id, ativo: true },
      select: CAMPOS_PUBLICOS,
    });
  }

  buscarParaLogin(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: { ...CAMPOS_PUBLICOS, senhaHash: true, ativo: true },
    });
  }

  buscarContaPorGoogleId(googleId: string): Promise<ContaUsuario | null> {
    return this.prisma.usuario.findUnique({
      where: { googleId },
      select: CAMPOS_CONTA,
    });
  }

  buscarContaPorEmail(email: string): Promise<ContaUsuario | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: CAMPOS_CONTA,
    });
  }

  vincularGoogle(id: string, googleId: string): Promise<ContaUsuario> {
    return this.prisma.usuario.update({
      where: { id },
      data: { googleId },
      select: CAMPOS_CONTA,
    });
  }

  criarComGoogle(dados: {
    nome: string;
    email: string;
    googleId: string;
  }): Promise<ContaUsuario> {
    return this.prisma.usuario.create({ data: dados, select: CAMPOS_CONTA });
  }
}

/** O e-mail é único no banco: violar a constraint gera o erro P2002 do Prisma. */
function violouCampoUnico(erro: unknown): boolean {
  return (
    erro instanceof Prisma.PrismaClientKnownRequestError &&
    erro.code === 'P2002'
  );
}
