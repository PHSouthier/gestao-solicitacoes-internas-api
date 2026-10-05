import { HttpStatus } from '@nestjs/common';
import { CodigoErro } from '../../../common/errors/codigos-erro.js';
import { DomainError } from '../../../common/errors/domain-error.js';
import type { StatusSolicitacao } from '../../../generated/prisma/enums.js';

const TRANSICOES: Record<StatusSolicitacao, readonly StatusSolicitacao[]> = {
  ABERTA: ['EM_ANALISE', 'APROVADA', 'REJEITADA'],
  EM_ANALISE: ['APROVADA', 'REJEITADA'],
  APROVADA: [],
  REJEITADA: [],
};

const ROTULOS: Record<StatusSolicitacao, string> = {
  ABERTA: 'Aberta',
  EM_ANALISE: 'Em Análise',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
};

export function estaFinalizada(status: StatusSolicitacao): boolean {
  return TRANSICOES[status].length === 0;
}

export function podeTransicionar(
  de: StatusSolicitacao,
  para: StatusSolicitacao,
): boolean {
  return TRANSICOES[de].includes(para);
}

export function garantirTransicao(
  de: StatusSolicitacao,
  para: StatusSolicitacao,
): void {
  if (estaFinalizada(de)) {
    throw new DomainError({
      code: CodigoErro.SOLICITACAO_FINALIZADA,
      message: `A solicitação já está ${ROTULOS[de].toLowerCase()} e não pode mais mudar de status.`,
    });
  }
  if (!podeTransicionar(de, para)) {
    throw new DomainError({
      code: CodigoErro.TRANSICAO_INVALIDA,
      message: `Não é possível passar de "${ROTULOS[de]}" para "${ROTULOS[para]}".`,
      httpStatus: HttpStatus.CONFLICT,
    });
  }
}
