import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DomainError } from '../../common/errors/domain-error.js';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import { SolicitacoesRepository } from './solicitacoes.repository.js';
import { SolicitacoesService } from './solicitacoes.service.js';

describe('SolicitacoesService', () => {
  const repositorio = {
    buscarDetalhe: vi.fn(),
    buscarAreaAtiva: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
    mudarStatus: vi.fn(),
    listar: vi.fn(),
    historico: vi.fn(),
  };
  let service: SolicitacoesService;

  const solicitante: UsuarioAutenticado = {
    id: 'u-solicitante',
    perfil: 'SOLICITANTE',
  };
  const outroSolicitante: UsuarioAutenticado = {
    id: 'u-outro',
    perfil: 'SOLICITANTE',
  };
  const analista: UsuarioAutenticado = { id: 'u-analista', perfil: 'ANALISTA' };

  function solicitacao(status = 'ABERTA', criadoPorId = 'u-solicitante') {
    return {
      id: 's-1',
      codigo: 42n,
      titulo: 'Compra de notebooks',
      descricao: 'Cinco notebooks para vendas.',
      nomeSolicitante: 'Maria',
      areaComplemento: null,
      prioridade: 'ALTA',
      status,
      dataSolicitacao: new Date('2026-10-05T00:00:00.000Z'),
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      criadoPorId,
      area: { id: 9, nome: 'TI' },
      criadoPor: { id: criadoPorId, nome: 'Maria' },
      historico: [],
    };
  }

  const novo = {
    titulo: 'Compra de notebooks',
    descricao: 'Cinco notebooks para vendas.',
    nomeSolicitante: 'Maria',
    areaId: 9,
    prioridade: 'ALTA' as const,
  };

  async function codigoDoErro(promessa: Promise<unknown>) {
    const erro = await promessa.catch((e: unknown) => e);
    return (erro as DomainError).code;
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SolicitacoesService,
        { provide: SolicitacoesRepository, useValue: repositorio },
      ],
    }).compile();
    service = moduleRef.get(SolicitacoesService);
  });

  describe('criar', () => {
    it('cria com o usuário logado e devolve o código formatado', async () => {
      repositorio.buscarAreaAtiva.mockResolvedValue({
        id: 9,
        exigeComplemento: false,
      });
      repositorio.criar.mockResolvedValue('s-1');
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao());

      const criada = await service.criar(
        { ...novo, areaComplemento: 'ignorado' },
        solicitante,
      );

      expect(criada.codigo).toBe('SOL-000042');
      expect(criada.dataSolicitacao).toBe('2026-10-05');
      const [dados, usuarioId] = repositorio.criar.mock.calls[0];
      expect(usuarioId).toBe('u-solicitante');
      expect(dados.areaComplemento).toBeNull();
    });

    it('área inexistente ou inativa: 400 AREA_INVALIDA', async () => {
      repositorio.buscarAreaAtiva.mockResolvedValue(null);

      expect(await codigoDoErro(service.criar(novo, solicitante))).toBe(
        'AREA_INVALIDA',
      );
      expect(repositorio.criar).not.toHaveBeenCalled();
    });

    it('área "Outras" sem complemento: 400 com o campo areaComplemento', async () => {
      repositorio.buscarAreaAtiva.mockResolvedValue({
        id: 10,
        exigeComplemento: true,
      });

      const erro = (await service
        .criar({ ...novo, areaId: 10 }, solicitante)
        .catch((e: unknown) => e)) as DomainError;

      expect(erro.httpStatus).toBe(400);
      expect(erro.details[0].field).toBe('areaComplemento');
    });
  });

  describe('atualizar', () => {
    it('solicitação finalizada não pode ser editada: 409', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('APROVADA'));

      expect(
        await codigoDoErro(
          service.atualizar('s-1', { titulo: 'Novo' }, analista),
        ),
      ).toBe('SOLICITACAO_FINALIZADA');
    });

    it('solicitante não edita solicitação de outra pessoa: 403', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(
        solicitacao('ABERTA', 'u-solicitante'),
      );

      await expect(
        service.atualizar('s-1', { titulo: 'Novo' }, outroSolicitante),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('analista edita qualquer uma', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('EM_ANALISE'));
      repositorio.atualizar.mockResolvedValue(true);

      await service.atualizar('s-1', { titulo: 'Novo título' }, analista);

      expect(repositorio.atualizar).toHaveBeenCalledWith(
        's-1',
        expect.objectContaining({ titulo: 'Novo título' }),
      );
    });

    it('finalizada por outra pessoa durante a edição: 409 SOLICITACAO_ALTERADA', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('EM_ANALISE'));
      repositorio.atualizar.mockResolvedValue(false);

      expect(
        await codigoDoErro(
          service.atualizar('s-1', { titulo: 'Novo' }, analista),
        ),
      ).toBe('SOLICITACAO_ALTERADA');
    });
  });

  describe('excluir', () => {
    it('só exclui com status Aberta: 409', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('EM_ANALISE'));

      expect(await codigoDoErro(service.excluir('s-1', solicitante))).toBe(
        'EXCLUSAO_NAO_PERMITIDA',
      );
    });

    it('solicitante não exclui solicitação de outra pessoa: 403', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(
        solicitacao('ABERTA', 'u-solicitante'),
      );

      await expect(
        service.excluir('s-1', outroSolicitante),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('solicitante exclui a própria solicitação aberta', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(
        solicitacao('ABERTA', 'u-solicitante'),
      );
      repositorio.excluir.mockResolvedValue(true);

      await service.excluir('s-1', solicitante);

      expect(repositorio.excluir).toHaveBeenCalledWith('s-1');
    });
  });

  describe('decidir', () => {
    const decisao = {
      decisao: 'APROVADA' as const,
      comentario: 'Aprovado no orçamento.',
    };

    it('grava a mudança com comentário e autor', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('EM_ANALISE'));
      repositorio.mudarStatus.mockResolvedValue(true);

      await service.decidir('s-1', decisao, analista);

      expect(repositorio.mudarStatus).toHaveBeenCalledWith({
        id: 's-1',
        de: 'EM_ANALISE',
        para: 'APROVADA',
        comentario: 'Aprovado no orçamento.',
        usuarioId: 'u-analista',
      });
    });

    it('já finalizada: 409 SOLICITACAO_FINALIZADA', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('REJEITADA'));

      expect(
        await codigoDoErro(service.decidir('s-1', decisao, analista)),
      ).toBe('SOLICITACAO_FINALIZADA');
      expect(repositorio.mudarStatus).not.toHaveBeenCalled();
    });

    it('outro analista decidiu antes: 409 SOLICITACAO_ALTERADA', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('EM_ANALISE'));
      repositorio.mudarStatus.mockResolvedValue(false);

      expect(
        await codigoDoErro(service.decidir('s-1', decisao, analista)),
      ).toBe('SOLICITACAO_ALTERADA');
    });
  });

  it('solicitação inexistente ou excluída: 404', async () => {
    repositorio.buscarDetalhe.mockResolvedValue(null);

    await expect(service.detalhar('s-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
