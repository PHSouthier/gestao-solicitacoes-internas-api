import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import { SolicitacoesRepository } from './solicitacoes.repository.js';
import { SolicitacoesService } from './solicitacoes.service.js';

describe('SolicitacoesService', () => {
  const repositorio = {
    buscarDetalhe: vi.fn(),
    buscarAreaAtiva: vi.fn(),
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
    mudarStatus: vi.fn(),
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

  const nova = {
    titulo: 'Compra de notebooks',
    descricao: 'Cinco notebooks para vendas.',
    nomeSolicitante: 'Maria',
    areaId: 9,
    prioridade: 'ALTA' as const,
  };

  async function camposComErro(promessa: Promise<unknown>) {
    const erro = await promessa.catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(BadRequestException);
    const { details } = (erro as BadRequestException).getResponse() as {
      details: { field: string }[];
    };
    return details.map((d) => d.field);
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
        exigeComplemento: false,
      });
      repositorio.criar.mockResolvedValue('s-1');
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao());

      const criada = await service.criar(
        { ...nova, areaComplemento: 'ignorado' },
        solicitante,
      );

      expect(criada.codigo).toBe('SOL-000042');
      expect(criada.dataSolicitacao).toBe('2026-10-05');
      const [dados, usuarioId] = repositorio.criar.mock.calls[0];
      expect(usuarioId).toBe('u-solicitante');
      expect(dados.areaComplemento).toBeNull();
    });

    it('área inexistente ou inativa: 400 no campo areaId', async () => {
      repositorio.buscarAreaAtiva.mockResolvedValue(null);

      expect(await camposComErro(service.criar(nova, solicitante))).toEqual([
        'areaId',
      ]);
      expect(repositorio.criar).not.toHaveBeenCalled();
    });

    it('área "Outras" sem complemento: 400 no campo areaComplemento', async () => {
      repositorio.buscarAreaAtiva.mockResolvedValue({ exigeComplemento: true });

      expect(
        await camposComErro(
          service.criar({ ...nova, areaId: 10 }, solicitante),
        ),
      ).toEqual(['areaComplemento']);
    });
  });

  describe('atualizar', () => {
    it('solicitação finalizada não pode ser editada: 409', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('APROVADA'));

      await expect(
        service.atualizar('s-1', { titulo: 'Novo' }, analista),
      ).rejects.toThrow('não podem ser editadas');
    });

    it('solicitante não edita solicitação de outra pessoa: 403', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao());

      await expect(
        service.atualizar('s-1', { titulo: 'Novo' }, outroSolicitante),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('analista edita qualquer uma, informando o status que leu', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('EM_ANALISE'));
      repositorio.atualizar.mockResolvedValue(true);

      await service.atualizar('s-1', { titulo: 'Novo título' }, analista);

      expect(repositorio.atualizar).toHaveBeenCalledWith(
        's-1',
        'EM_ANALISE',
        expect.objectContaining({ titulo: 'Novo título' }),
      );
    });

    it('status mudou durante a edição: 409 alterada por outra pessoa', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('EM_ANALISE'));
      repositorio.atualizar.mockResolvedValue(false);

      await expect(
        service.atualizar('s-1', { titulo: 'Novo' }, analista),
      ).rejects.toThrow('alterada por outra pessoa');
    });
  });

  describe('excluir', () => {
    it('só exclui com status Aberta: 409', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('EM_ANALISE'));

      await expect(service.excluir('s-1', solicitante)).rejects.toThrow(
        'status Aberta',
      );
      expect(repositorio.excluir).not.toHaveBeenCalled();
    });

    it('solicitante não exclui solicitação de outra pessoa: 403', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao());

      await expect(
        service.excluir('s-1', outroSolicitante),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('solicitante exclui a própria solicitação aberta', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao());
      repositorio.excluir.mockResolvedValue(true);

      await service.excluir('s-1', solicitante);

      expect(repositorio.excluir).toHaveBeenCalledWith('s-1', 'ABERTA');
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

    it('já finalizada: 409 sem gravar nada', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('REJEITADA'));

      await expect(service.decidir('s-1', decisao, analista)).rejects.toThrow(
        'não pode mais mudar de status',
      );
      expect(repositorio.mudarStatus).not.toHaveBeenCalled();
    });

    it('outro analista decidiu antes: 409', async () => {
      repositorio.buscarDetalhe.mockResolvedValue(solicitacao('EM_ANALISE'));
      repositorio.mudarStatus.mockResolvedValue(false);

      await expect(
        service.decidir('s-1', decisao, analista),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  it('solicitação inexistente ou excluída: 404', async () => {
    repositorio.buscarDetalhe.mockResolvedValue(null);

    await expect(service.detalhar('s-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
