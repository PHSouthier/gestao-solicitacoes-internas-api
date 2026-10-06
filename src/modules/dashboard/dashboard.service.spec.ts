import { montarResumo } from './dashboard.service.js';

describe('montarResumo', () => {
  it('soma o total, preenche zeros e calcula a taxa de aprovação', () => {
    const resumo = montarResumo({
      porStatus: [
        { status: 'ABERTA', total: 4 },
        { status: 'APROVADA', total: 3 },
        { status: 'REJEITADA', total: 1 },
      ],
      porPrioridade: [{ prioridade: 'ALTA', total: 8 }],
      porArea: [
        { areaId: 1, nome: 'Compras', total: 2 },
        { areaId: 9, nome: 'TI', total: 6 },
      ],
    });

    expect(resumo).toEqual({
      total: 8,
      porStatus: { ABERTA: 4, EM_ANALISE: 0, APROVADA: 3, REJEITADA: 1 },
      porPrioridade: { BAIXA: 0, MEDIA: 0, ALTA: 8 },
      porArea: [
        { areaId: 9, nome: 'TI', total: 6 },
        { areaId: 1, nome: 'Compras', total: 2 },
      ],
      taxaAprovacao: 0.75,
    });
  });

  it('sem nenhuma solicitação: tudo zero e taxa null', () => {
    expect(
      montarResumo({ porStatus: [], porPrioridade: [], porArea: [] }),
    ).toEqual({
      total: 0,
      porStatus: { ABERTA: 0, EM_ANALISE: 0, APROVADA: 0, REJEITADA: 0 },
      porPrioridade: { BAIXA: 0, MEDIA: 0, ALTA: 0 },
      porArea: [],
      taxaAprovacao: null,
    });
  });
});
