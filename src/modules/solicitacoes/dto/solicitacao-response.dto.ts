import type {
  PrioridadeSolicitacao,
  StatusSolicitacao,
} from '../../../generated/prisma/enums.js';

export class AreaResumoDto {
  id: number;
  nome: string;
}

export class UsuarioResumoDto {
  id: string;
  nome: string;
}

export class SolicitacaoResumoDto {
  id: string;
  /** @example "SOL-000042" */
  codigo: string;
  titulo: string;
  nomeSolicitante: string;
  area: AreaResumoDto;
  areaComplemento: string | null;
  prioridade: PrioridadeSolicitacao;
  status: StatusSolicitacao;
  /** AAAA-MM-DD */
  dataSolicitacao: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class HistoricoStatusDto {
  id: string;
  /** null no registro da criação. */
  statusAnterior: StatusSolicitacao | null;
  statusNovo: StatusSolicitacao;
  comentario: string | null;
  alteradoPor: UsuarioResumoDto | null;
  alteradoEm: Date;
}

export class SolicitacaoDetalheDto extends SolicitacaoResumoDto {
  descricao: string;
  criadoPor: UsuarioResumoDto | null;
  historico: HistoricoStatusDto[];
}

export class PaginacaoDto {
  pagina: number;
  tamanhoPagina: number;
  total: number;
  totalPaginas: number;
}

export class PaginaSolicitacoesDto {
  data: SolicitacaoResumoDto[];
  meta: PaginacaoDto;
}
