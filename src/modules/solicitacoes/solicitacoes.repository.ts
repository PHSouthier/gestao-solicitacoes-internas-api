import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import type {
  PrioridadeSolicitacao,
  StatusSolicitacao,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const USUARIO_RESUMO = { select: { id: true, nome: true } } as const;

export const SELECT_HISTORICO = {
  id: true,
  statusAnterior: true,
  statusNovo: true,
  comentario: true,
  alteradoEm: true,
  alteradoPor: USUARIO_RESUMO,
} satisfies Prisma.HistoricoStatusSolicitacaoSelect;

export const SELECT_RESUMO = {
  id: true,
  codigo: true,
  titulo: true,
  nomeSolicitante: true,
  areaComplemento: true,
  prioridade: true,
  status: true,
  dataSolicitacao: true,
  criadoEm: true,
  atualizadoEm: true,
  criadoPorId: true,
  area: { select: { id: true, nome: true } },
} satisfies Prisma.SolicitacaoSelect;

export const SELECT_DETALHE = {
  ...SELECT_RESUMO,
  descricao: true,
  criadoPor: USUARIO_RESUMO,
  historico: { select: SELECT_HISTORICO, orderBy: { alteradoEm: 'asc' } },
} satisfies Prisma.SolicitacaoSelect;

export type LinhaResumo = Prisma.SolicitacaoGetPayload<{
  select: typeof SELECT_RESUMO;
}>;
export type LinhaDetalhe = Prisma.SolicitacaoGetPayload<{
  select: typeof SELECT_DETALHE;
}>;
export type LinhaHistorico = Prisma.HistoricoStatusSolicitacaoGetPayload<{
  select: typeof SELECT_HISTORICO;
}>;

export interface DadosNovaSolicitacao {
  titulo: string;
  descricao: string;
  nomeSolicitante: string;
  areaId: number;
  areaComplemento: string | null;
  prioridade: PrioridadeSolicitacao;
  dataSolicitacao?: Date;
}

export interface MudancaDeStatus {
  id: string;
  de: StatusSolicitacao;
  para: StatusSolicitacao;
  comentario?: string;
  usuarioId: string;
}

@Injectable()
export class SolicitacoesRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarDetalhe(id: string): Promise<LinhaDetalhe | null> {
    return this.prisma.solicitacao.findFirst({
      where: { id, excluidoEm: null },
      select: SELECT_DETALHE,
    });
  }

  async listar(
    where: Prisma.SolicitacaoWhereInput,
    orderBy: Prisma.SolicitacaoOrderByWithRelationInput[],
    pular: number,
    pegar: number,
  ): Promise<{ linhas: LinhaResumo[]; total: number }> {
    const filtro = { ...where, excluidoEm: null };
    const [linhas, total] = await this.prisma.$transaction([
      this.prisma.solicitacao.findMany({
        where: filtro,
        orderBy,
        skip: pular,
        take: pegar,
        select: SELECT_RESUMO,
      }),
      this.prisma.solicitacao.count({ where: filtro }),
    ]);
    return { linhas, total };
  }

  criar(dados: DadosNovaSolicitacao, usuarioId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const { id } = await tx.solicitacao.create({
        data: { ...dados, criadoPorId: usuarioId },
        select: { id: true },
      });
      await tx.historicoStatusSolicitacao.create({
        data: {
          solicitacaoId: id,
          statusAnterior: null,
          statusNovo: 'ABERTA',
          alteradoPorId: usuarioId,
        },
      });
      return id;
    });
  }

  async atualizar(
    id: string,
    dados: Prisma.SolicitacaoUncheckedUpdateManyInput,
  ): Promise<boolean> {
    const { count } = await this.prisma.solicitacao.updateMany({
      where: { id, excluidoEm: null, status: { in: ['ABERTA', 'EM_ANALISE'] } },
      data: dados,
    });
    return count === 1;
  }

  async excluir(id: string): Promise<boolean> {
    const { count } = await this.prisma.solicitacao.updateMany({
      where: { id, excluidoEm: null, status: 'ABERTA' },
      data: { excluidoEm: new Date() },
    });
    return count === 1;
  }

  mudarStatus(m: MudancaDeStatus): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.solicitacao.updateMany({
        where: { id: m.id, status: m.de, excluidoEm: null },
        data: { status: m.para },
      });
      if (count !== 1) {
        return false;
      }
      await tx.historicoStatusSolicitacao.create({
        data: {
          solicitacaoId: m.id,
          statusAnterior: m.de,
          statusNovo: m.para,
          comentario: m.comentario ?? null,
          alteradoPorId: m.usuarioId,
        },
      });
      return true;
    });
  }

  historico(id: string): Promise<LinhaHistorico[]> {
    return this.prisma.historicoStatusSolicitacao.findMany({
      where: { solicitacaoId: id },
      orderBy: { alteradoEm: 'asc' },
      select: SELECT_HISTORICO,
    });
  }

  buscarAreaAtiva(id: number) {
    return this.prisma.area.findFirst({
      where: { id, ativo: true },
      select: { id: true, exigeComplemento: true },
    });
  }
}
