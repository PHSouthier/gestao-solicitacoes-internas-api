export class ContagemPorStatusDto {
  ABERTA: number;
  EM_ANALISE: number;
  APROVADA: number;
  REJEITADA: number;
}

export class ContagemPorPrioridadeDto {
  BAIXA: number;
  MEDIA: number;
  ALTA: number;
}

export class ContagemPorAreaDto {
  areaId: number;
  nome: string;
  total: number;
}

export class ResumoDashboardDto {
  /** Total de solicitações (sem as excluídas). */
  total: number;
  porStatus: ContagemPorStatusDto;
  porPrioridade: ContagemPorPrioridadeDto;
  /** Áreas com pelo menos uma solicitação, da maior para a menor. */
  porArea: ContagemPorAreaDto[];
  /** Aprovadas ÷ (aprovadas + rejeitadas). null se nenhuma foi decidida. */
  taxaAprovacao: number | null;
}
