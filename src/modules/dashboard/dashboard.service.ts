import { Injectable } from '@nestjs/common';
import {
  type ContagensDashboard,
  DashboardRepository,
} from './dashboard.repository.js';
import type { ResumoDashboardDto } from './dto/resumo-dashboard.dto.js';

@Injectable()
export class DashboardService {
  constructor(private readonly repositorio: DashboardRepository) {}

  async resumo(): Promise<ResumoDashboardDto> {
    return montarResumo(await this.repositorio.contar());
  }
}

export function montarResumo(dados: ContagensDashboard): ResumoDashboardDto {
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
