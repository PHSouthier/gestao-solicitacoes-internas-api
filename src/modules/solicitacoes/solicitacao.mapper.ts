import { formatarData } from '../../common/validators/data.js';
import type {
  SolicitacaoDetalheDto,
  SolicitacaoResumoDto,
} from './dto/solicitacao-response.dto.js';
import type { LinhaDetalhe, LinhaResumo } from './solicitacoes.repository.js';

// Converte as linhas do banco no formato das respostas da API.

/** 42n → "SOL-000042" */
export function formatarCodigo(codigo: bigint): string {
  return `SOL-${codigo.toString().padStart(6, '0')}`;
}

export function paraResumo(linha: LinhaResumo): SolicitacaoResumoDto {
  return {
    id: linha.id,
    codigo: formatarCodigo(linha.codigo),
    titulo: linha.titulo,
    nomeSolicitante: linha.nomeSolicitante,
    area: linha.area,
    areaComplemento: linha.areaComplemento,
    prioridade: linha.prioridade,
    status: linha.status,
    dataSolicitacao: formatarData(linha.dataSolicitacao),
    criadoEm: linha.criadoEm,
    atualizadoEm: linha.atualizadoEm,
  };
}

export function paraDetalhe(linha: LinhaDetalhe): SolicitacaoDetalheDto {
  return {
    ...paraResumo(linha),
    descricao: linha.descricao,
    criadoPor: linha.criadoPor,
    historico: linha.historico,
  };
}
