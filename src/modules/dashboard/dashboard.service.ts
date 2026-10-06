import { Injectable } from '@nestjs/common';
import type {
  PrioridadeSolicitacao,
  StatusSolicitacao,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ResumoDashboardDto } from './dto/resumo-dashboard.dto.js';

export interface DadosDashboard {
  porStatus: { status: StatusSolicitacao; total: number }[];
  porPrioridade: { prioridade: PrioridadeSolicitacao; total: number }[];
  porArea: { areaId: number; nome: string; total: number }[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(): Promise<ResumoDashboardDto> {
    const naoExcluidas = { excluidoEm: null };

    const [porStatus, porPrioridade, porArea, areas] =
      await this.prisma.$transaction([
        this.prisma.solicitacao.groupBy({
          by: ['status'],
          where: naoExcluidas,
          orderBy: { status: 'asc' },
          _count: { _all: true },
        }),
        this.prisma.solicitacao.groupBy({
          by: ['prioridade'],
          where: naoExcluidas,
          orderBy: { prioridade: 'asc' },
          _count: { _all: true },
        }),
        this.prisma.solicitacao.groupBy({
          by: ['areaId'],
          where: naoExcluidas,
          orderBy: { areaId: 'asc' },
          _count: { _all: true },
        }),
        this.prisma.area.findMany({ select: { id: true, nome: true } }),
      ]);

    const nomeDaArea = new Map(areas.map((area) => [area.id, area.nome]));

    return montarResumo({
      porStatus: porStatus.map((g) => ({
        status: g.status,
        total: totalDoGrupo(g._count),
      })),
      porPrioridade: porPrioridade.map((g) => ({
        prioridade: g.prioridade,
        total: totalDoGrupo(g._count),
      })),
      porArea: porArea.map((g) => ({
        areaId: g.areaId,
        nome: nomeDaArea.get(g.areaId) ?? `Área ${g.areaId}`,
        total: totalDoGrupo(g._count),
      })),
    });
  }
}

function totalDoGrupo(contagem: true | { _all?: number } | undefined): number {
  return typeof contagem === 'object' ? (contagem._all ?? 0) : 0;
}

export function montarResumo(dados: DadosDashboard): ResumoDashboardDto {
  const porStatus = { ABERTA: 0, EM_ANALISE: 0, APROVADA: 0, REJEITADA: 0 };
  for (const { status, total } of dados.porStatus) porStatus[status] = total;

  const porPrioridade = { BAIXA: 0, MEDIA: 0, ALTA: 0 };
  for (const { prioridade, total } of dados.porPrioridade) {
    porPrioridade[prioridade] = total;
  }

  const total = Object.values(porStatus).reduce((soma, n) => soma + n, 0);
  const decididas = porStatus.APROVADA + porStatus.REJEITADA;

  return {
    total,
    porStatus,
    porPrioridade,
    porArea: [...dados.porArea].sort(
      (a, b) => b.total - a.total || a.nome.localeCompare(b.nome),
    ),
    taxaAprovacao:
      decididas === 0
        ? null
        : Math.round((porStatus.APROVADA / decididas) * 100) / 100,
  };
}
