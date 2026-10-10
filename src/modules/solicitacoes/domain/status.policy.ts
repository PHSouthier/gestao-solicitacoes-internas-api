import { ConflictException } from '@nestjs/common';
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

export function garantirTransicao(
  de: StatusSolicitacao,
  para: StatusSolicitacao,
): void {
  if (estaFinalizada(de)) {
    throw new ConflictException(
      `A solicitação já está ${ROTULOS[de].toLowerCase()} e não pode mais mudar de status.`,
    );
  }
  if (!TRANSICOES[de].includes(para)) {
    throw new ConflictException(
      `Não é possível passar de "${ROTULOS[de]}" para "${ROTULOS[para]}".`,
    );
  }
}
