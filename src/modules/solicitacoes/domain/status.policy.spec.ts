import { ConflictException } from '@nestjs/common';
import type { StatusSolicitacao } from '../../../generated/prisma/enums.js';
import { estaFinalizada, garantirTransicao } from './status.policy.js';

describe('status.policy', () => {
  it.each<[StatusSolicitacao, StatusSolicitacao]>([
    ['ABERTA', 'EM_ANALISE'],
    ['ABERTA', 'APROVADA'],
    ['ABERTA', 'REJEITADA'],
    ['EM_ANALISE', 'APROVADA'],
    ['EM_ANALISE', 'REJEITADA'],
  ])('permite %s → %s', (de, para) => {
    expect(() => garantirTransicao(de, para)).not.toThrow();
  });

  it.each<[StatusSolicitacao, StatusSolicitacao]>([
    ['ABERTA', 'ABERTA'],
    ['EM_ANALISE', 'EM_ANALISE'],
    ['EM_ANALISE', 'ABERTA'],
  ])('não permite %s → %s', (de, para) => {
    expect(() => garantirTransicao(de, para)).toThrow(
      'Não é possível passar de',
    );
  });

  it.each<StatusSolicitacao>(['APROVADA', 'REJEITADA'])(
    'solicitação %s não muda mais de status',
    (de) => {
      expect(() => garantirTransicao(de, 'EM_ANALISE')).toThrow(
        ConflictException,
      );
      expect(() => garantirTransicao(de, 'EM_ANALISE')).toThrow(
        'não pode mais mudar de status',
      );
    },
  );

  it('só Aprovada e Rejeitada são finais', () => {
    expect(estaFinalizada('ABERTA')).toBe(false);
    expect(estaFinalizada('EM_ANALISE')).toBe(false);
    expect(estaFinalizada('APROVADA')).toBe(true);
    expect(estaFinalizada('REJEITADA')).toBe(true);
  });
});
