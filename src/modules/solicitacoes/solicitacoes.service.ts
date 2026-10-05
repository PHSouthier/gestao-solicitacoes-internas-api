import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CodigoErro } from '../../common/errors/codigos-erro.js';
import { DomainError } from '../../common/errors/domain-error.js';
import { paraData } from '../../common/validators/data.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import { estaFinalizada, garantirTransicao } from './domain/status.policy.js';
import type { DecisaoDto } from './dto/acoes.dto.js';
import type { AtualizarSolicitacaoDto } from './dto/atualizar-solicitacao.dto.js';
import type { CriarSolicitacaoDto } from './dto/criar-solicitacao.dto.js';
import type { ListarSolicitacoesQuery } from './dto/listar-solicitacoes.query.js';
import type {
  HistoricoStatusDto,
  PaginaSolicitacoesDto,
  SolicitacaoDetalheDto,
} from './dto/solicitacao-response.dto.js';
import {
  paraDetalhe,
  paraHistorico,
  paraResumo,
} from './solicitacao.mapper.js';
import {
  type LinhaDetalhe,
  SolicitacoesRepository,
} from './solicitacoes.repository.js';

const ALTERADA_POR_OUTRA_PESSOA = {
  code: CodigoErro.SOLICITACAO_ALTERADA,
  message:
    'A solicitação foi alterada por outra pessoa. Recarregue a página e tente novamente.',
};

@Injectable()
export class SolicitacoesService {
  constructor(private readonly repositorio: SolicitacoesRepository) {}

  async criar(
    dto: CriarSolicitacaoDto,
    usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    const areaComplemento = await this.validarArea(
      dto.areaId,
      dto.areaComplemento,
    );

    const id = await this.repositorio.criar(
      {
        titulo: dto.titulo,
        descricao: dto.descricao,
        nomeSolicitante: dto.nomeSolicitante,
        areaId: dto.areaId,
        areaComplemento,
        prioridade: dto.prioridade,
        dataSolicitacao: dto.dataSolicitacao
          ? paraData(dto.dataSolicitacao)
          : undefined,
      },
      usuario.id,
    );

    return this.detalhar(id);
  }

  async detalhar(id: string): Promise<SolicitacaoDetalheDto> {
    return paraDetalhe(await this.buscarOuFalhar(id));
  }

  async listar(query: ListarSolicitacoesQuery): Promise<PaginaSolicitacoesDto> {
    const where: Prisma.SolicitacaoWhereInput = {
      status: query.status?.length ? { in: query.status } : undefined,
      prioridade: query.prioridade?.length
        ? { in: query.prioridade }
        : undefined,
      areaId: query.areaId,
      dataSolicitacao:
        query.dataInicio || query.dataFim
          ? {
              gte: query.dataInicio ? paraData(query.dataInicio) : undefined,
              lte: query.dataFim ? paraData(query.dataFim) : undefined,
            }
          : undefined,
      OR: query.busca ? filtroDeBusca(query.busca) : undefined,
    };

    const { linhas, total } = await this.repositorio.listar(
      where,
      [{ [query.ordenarPor]: query.ordem }, { codigo: 'desc' }],
      (query.pagina - 1) * query.tamanhoPagina,
      query.tamanhoPagina,
    );

    return {
      data: linhas.map(paraResumo),
      meta: {
        pagina: query.pagina,
        tamanhoPagina: query.tamanhoPagina,
        total,
        totalPaginas: Math.ceil(total / query.tamanhoPagina),
      },
    };
  }

  async atualizar(
    id: string,
    dto: AtualizarSolicitacaoDto,
    usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    const atual = await this.buscarOuFalhar(id);

    if (estaFinalizada(atual.status)) {
      throw new DomainError({
        code: CodigoErro.SOLICITACAO_FINALIZADA,
        message: 'Solicitações aprovadas ou rejeitadas não podem ser editadas.',
      });
    }
    this.garantirDonoSeSolicitante(atual, usuario, 'editar');

    const dados: Prisma.SolicitacaoUncheckedUpdateManyInput = {
      titulo: dto.titulo,
      descricao: dto.descricao,
      nomeSolicitante: dto.nomeSolicitante,
      prioridade: dto.prioridade,
      dataSolicitacao: dto.dataSolicitacao
        ? paraData(dto.dataSolicitacao)
        : undefined,
    };

    if (dto.areaId !== undefined || dto.areaComplemento !== undefined) {
      const areaId = dto.areaId ?? atual.area.id;
      dados.areaId = areaId;
      dados.areaComplemento = await this.validarArea(
        areaId,
        dto.areaComplemento ?? atual.areaComplemento ?? undefined,
      );
    }

    if (!(await this.repositorio.atualizar(id, dados))) {
      throw new DomainError(ALTERADA_POR_OUTRA_PESSOA);
    }
    return this.detalhar(id);
  }

  async excluir(id: string, usuario: UsuarioAutenticado): Promise<void> {
    const atual = await this.buscarOuFalhar(id);

    this.garantirDonoSeSolicitante(atual, usuario, 'excluir');
    if (atual.status !== 'ABERTA') {
      throw new DomainError({
        code: CodigoErro.EXCLUSAO_NAO_PERMITIDA,
        message: 'Só é possível excluir solicitações com status Aberta.',
      });
    }

    if (!(await this.repositorio.excluir(id))) {
      throw new DomainError(ALTERADA_POR_OUTRA_PESSOA);
    }
  }

  async iniciarAnalise(
    id: string,
    usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    const atual = await this.buscarOuFalhar(id);

    garantirTransicao(atual.status, 'EM_ANALISE');

    const mudou = await this.repositorio.mudarStatus({
      id,
      de: atual.status,
      para: 'EM_ANALISE',
      usuarioId: usuario.id,
    });
    if (!mudou) {
      throw new DomainError(ALTERADA_POR_OUTRA_PESSOA);
    }
    return this.detalhar(id);
  }

  async decidir(
    id: string,
    dto: DecisaoDto,
    usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    const atual = await this.buscarOuFalhar(id);

    garantirTransicao(atual.status, dto.decisao);

    const mudou = await this.repositorio.mudarStatus({
      id,
      de: atual.status,
      para: dto.decisao,
      comentario: dto.comentario,
      usuarioId: usuario.id,
    });
    if (!mudou) {
      throw new DomainError(ALTERADA_POR_OUTRA_PESSOA);
    }
    return this.detalhar(id);
  }

  async historico(id: string): Promise<HistoricoStatusDto[]> {
    await this.buscarOuFalhar(id);
    const linhas = await this.repositorio.historico(id);
    return linhas.map(paraHistorico);
  }

  private async buscarOuFalhar(id: string): Promise<LinhaDetalhe> {
    const solicitacao = await this.repositorio.buscarDetalhe(id);
    if (!solicitacao) {
      throw new NotFoundException({
        code: CodigoErro.SOLICITACAO_NAO_ENCONTRADA,
        message: 'Solicitação não encontrada.',
      });
    }
    return solicitacao;
  }

  private async validarArea(
    areaId: number,
    complemento?: string,
  ): Promise<string | null> {
    const area = await this.repositorio.buscarAreaAtiva(areaId);
    if (!area) {
      throw new DomainError({
        code: CodigoErro.AREA_INVALIDA,
        message: 'Área não encontrada ou inativa.',
        httpStatus: HttpStatus.BAD_REQUEST,
        details: [
          { field: 'areaId', messages: ['Selecione uma área válida.'] },
        ],
      });
    }
    if (!area.exigeComplemento) {
      return null;
    }
    if (!complemento) {
      throw new DomainError({
        code: CodigoErro.DADOS_INVALIDOS,
        message: 'Dados inválidos.',
        httpStatus: HttpStatus.BAD_REQUEST,
        details: [
          {
            field: 'areaComplemento',
            messages: ['Informe o nome da área quando escolher "Outras".'],
          },
        ],
      });
    }
    return complemento;
  }

  private garantirDonoSeSolicitante(
    solicitacao: LinhaDetalhe,
    usuario: UsuarioAutenticado,
    acao: 'editar' | 'excluir',
  ): void {
    if (
      usuario.perfil === 'SOLICITANTE' &&
      solicitacao.criadoPorId !== usuario.id
    ) {
      throw new ForbiddenException({
        code: CodigoErro.SEM_PERMISSAO,
        message: `Você só pode ${acao} as solicitações que cadastrou.`,
      });
    }
  }
}

function filtroDeBusca(busca: string): Prisma.SolicitacaoWhereInput[] {
  const contem = { contains: busca, mode: 'insensitive' as const };
  const filtros: Prisma.SolicitacaoWhereInput[] = [
    { titulo: contem },
    { descricao: contem },
    { nomeSolicitante: contem },
  ];
  const codigo = /^(?:sol-?)?0*(\d{1,15})$/i.exec(busca);
  if (codigo) {
    filtros.push({ codigo: BigInt(codigo[1]) });
  }
  return filtros;
}
