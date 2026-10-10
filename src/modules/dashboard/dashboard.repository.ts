import { Injectable } from '@nestjs/common';
import type {
  PrioridadeSolicitacao,
  StatusSolicitacao,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface ContagensDashboard {
  porStatus: { status: StatusSolicitacao; total: number }[];
  porPrioridade: { prioridade: PrioridadeSolicitacao; total: number }[];
  porArea: { areaId: number; nome: string; total: number }[];
}

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async contar(): Promise<ContagensDashboard> {
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

    return {
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
    };
  }
}

function totalDoGrupo(contagem: true | { _all?: number } | undefined): number {
  return typeof contagem === 'object' ? (contagem._all ?? 0) : 0;
}
