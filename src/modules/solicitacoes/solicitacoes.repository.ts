import { Injectable } from '@nestjs/common';
import { paraData } from '../../common/validators/data.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type {
  PrioridadeSolicitacao,
  StatusSolicitacao,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ListarSolicitacoesQuery } from './dto/listar-solicitacoes.dto.js';

const USUARIO = { select: { id: true, nome: true } } as const;

const CAMPOS_RESUMO = {
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

const CAMPOS_DETALHE = {
  ...CAMPOS_RESUMO,
  descricao: true,
  criadoPor: USUARIO,
  historico: {
    orderBy: { alteradoEm: 'asc' },
    select: {
      id: true,
      statusAnterior: true,
      statusNovo: true,
      comentario: true,
      alteradoEm: true,
      alteradoPor: USUARIO,
    },
  },
} satisfies Prisma.SolicitacaoSelect;

export type LinhaResumo = Prisma.SolicitacaoGetPayload<{
  select: typeof CAMPOS_RESUMO;
}>;
export type LinhaDetalhe = Prisma.SolicitacaoGetPayload<{
  select: typeof CAMPOS_DETALHE;
}>;

export interface DadosSolicitacao {
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

const NAO_EXCLUIDA = { excluidoEm: null };

@Injectable()
export class SolicitacoesRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarDetalhe(id: string): Promise<LinhaDetalhe | null> {
    return this.prisma.solicitacao.findFirst({
      where: { id, ...NAO_EXCLUIDA },
      select: CAMPOS_DETALHE,
    });
  }

  async listar(
    query: ListarSolicitacoesQuery,
  ): Promise<{ linhas: LinhaResumo[]; total: number }> {
    const where = { ...montarFiltro(query), ...NAO_EXCLUIDA };
    const [linhas, total] = await this.prisma.$transaction([
      this.prisma.solicitacao.findMany({
        where,
        orderBy: [{ [query.ordenarPor]: query.ordem }, { codigo: 'desc' }],
        skip: (query.pagina - 1) * query.tamanhoPagina,
        take: query.tamanhoPagina,
        select: CAMPOS_RESUMO,
      }),
      this.prisma.solicitacao.count({ where }),
    ]);
    return { linhas, total };
  }

  async criar(dados: DadosSolicitacao, usuarioId: string): Promise<string> {
    const { id } = await this.prisma.solicitacao.create({
      data: {
        ...dados,
        criadoPorId: usuarioId,
        historico: {
          create: { statusNovo: 'ABERTA', alteradoPorId: usuarioId },
        },
      },
      select: { id: true },
    });
    return id;
  }

  atualizar(
    id: string,
    statusLido: StatusSolicitacao,
    dados: Partial<DadosSolicitacao>,
  ): Promise<boolean> {
    return this.gravarSeNaoMudou(this.prisma, id, statusLido, dados);
  }

  excluir(id: string, statusLido: StatusSolicitacao): Promise<boolean> {
    return this.gravarSeNaoMudou(this.prisma, id, statusLido, {
      excluidoEm: new Date(),
    });
  }

  mudarStatus(m: MudancaDeStatus): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const mudou = await this.gravarSeNaoMudou(tx, m.id, m.de, {
        status: m.para,
      });
      if (mudou) {
        await tx.historicoStatusSolicitacao.create({
          data: {
            solicitacaoId: m.id,
            statusAnterior: m.de,
            statusNovo: m.para,
            comentario: m.comentario,
            alteradoPorId: m.usuarioId,
          },
        });
      }
      return mudou;
    });
  }

  buscarAreaAtiva(id: number) {
    return this.prisma.area.findFirst({
      where: { id, ativo: true },
      select: { exigeComplemento: true },
    });
  }

  private async gravarSeNaoMudou(
    db: Prisma.TransactionClient,
    id: string,
    statusLido: StatusSolicitacao,
    data: Prisma.SolicitacaoUncheckedUpdateManyInput,
  ): Promise<boolean> {
    const { count } = await db.solicitacao.updateMany({
      where: { id, status: statusLido, ...NAO_EXCLUIDA },
      data,
    });
    return count === 1;
  }
}

function montarFiltro(
  query: ListarSolicitacoesQuery,
): Prisma.SolicitacaoWhereInput {
  const { status, prioridade, areaId, dataInicio, dataFim, busca } = query;
  return {
    status: status?.length ? { in: status } : undefined,
    prioridade: prioridade?.length ? { in: prioridade } : undefined,
    areaId,
    dataSolicitacao: {
      gte: dataInicio ? paraData(dataInicio) : undefined,
      lte: dataFim ? paraData(dataFim) : undefined,
    },
    OR: busca ? filtroDeBusca(busca) : undefined,
  };
}

function filtroDeBusca(busca: string): Prisma.SolicitacaoWhereInput[] {
  const contem = { contains: busca, mode: 'insensitive' as const };
  const filtros: Prisma.SolicitacaoWhereInput[] = [
    { titulo: contem },
    { descricao: contem },
    { nomeSolicitante: contem },
  ];
  const codigo = /^(?:sol-?)?0*(\d{1,15})$/i.exec(busca);
  if (codigo) {
    filtros.push({ codigo: BigInt(codigo[1]) });
  }
  return filtros;
}
