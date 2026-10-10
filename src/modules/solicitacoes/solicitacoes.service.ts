import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paraData } from '../../common/validators/data.js';
import { campoInvalido } from '../../common/validators/validacao.js';
import type { StatusSolicitacao } from '../../generated/prisma/enums.js';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import type { AtualizarSolicitacaoDto } from './dto/atualizar-solicitacao.dto.js';
import type { CriarSolicitacaoDto } from './dto/criar-solicitacao.dto.js';
import type { DecisaoDto } from './dto/decisao.dto.js';
import type { ListarSolicitacoesQuery } from './dto/listar-solicitacoes.dto.js';
import type {
  PaginaSolicitacoesDto,
  SolicitacaoDetalheDto,
} from './dto/solicitacao-response.dto.js';
import { paraDetalhe, paraResumo } from './solicitacao.mapper.js';
import {
  type LinhaDetalhe,
  SolicitacoesRepository,
} from './solicitacoes.repository.js';
import { estaFinalizada, garantirTransicao } from './domain/status.policy.js';

/** Regras de negócio das solicitações. O acesso ao banco fica no repository. */
@Injectable()
export class SolicitacoesService {
  constructor(private readonly repositorio: SolicitacoesRepository) {}

  async listar(query: ListarSolicitacoesQuery): Promise<PaginaSolicitacoesDto> {
    const { linhas, total } = await this.repositorio.listar(query);
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

  async detalhar(id: string): Promise<SolicitacaoDetalheDto> {
    return paraDetalhe(await this.buscar(id));
  }

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

  /** Edita os dados cadastrais (o status muda só pela análise e decisão). */
  async atualizar(
    id: string,
    dto: AtualizarSolicitacaoDto,
    usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    const atual = await this.buscar(id);
    if (estaFinalizada(atual.status)) {
      throw new ConflictException(
        'Solicitações aprovadas ou rejeitadas não podem ser editadas.',
      );
    }
    garantirAutor(atual, usuario, 'editar');

    const mudouArea =
      dto.areaId !== undefined || dto.areaComplemento !== undefined;
    const areaId = dto.areaId ?? atual.area.id;
    const area = mudouArea
      ? {
          areaId,
          areaComplemento: await this.validarArea(
            areaId,
            dto.areaComplemento ?? atual.areaComplemento ?? undefined,
          ),
        }
      : {};

    const gravou = await this.repositorio.atualizar(id, atual.status, {
      titulo: dto.titulo,
      descricao: dto.descricao,
      nomeSolicitante: dto.nomeSolicitante,
      prioridade: dto.prioridade,
      dataSolicitacao: dto.dataSolicitacao
        ? paraData(dto.dataSolicitacao)
        : undefined,
      ...area,
    });
    garantirQueGravou(gravou);

    return this.detalhar(id);
  }

  /** Exclusão lógica: só com status Aberta. */
  async excluir(id: string, usuario: UsuarioAutenticado): Promise<void> {
    const atual = await this.buscar(id);
    garantirAutor(atual, usuario, 'excluir');
    if (atual.status !== 'ABERTA') {
      throw new ConflictException(
        'Só é possível excluir solicitações com status Aberta.',
      );
    }

    garantirQueGravou(await this.repositorio.excluir(id, atual.status));
  }

  iniciarAnalise(
    id: string,
    usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.mudarStatus(id, 'EM_ANALISE', usuario);
  }

  decidir(
    id: string,
    { decisao, comentario }: DecisaoDto,
    usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.mudarStatus(id, decisao, usuario, comentario);
  }

  /** Muda o status e registra no histórico quem mudou, quando e o comentário. */
  private async mudarStatus(
    id: string,
    para: StatusSolicitacao,
    usuario: UsuarioAutenticado,
    comentario?: string,
  ): Promise<SolicitacaoDetalheDto> {
    const atual = await this.buscar(id);
    garantirTransicao(atual.status, para);

    const mudou = await this.repositorio.mudarStatus({
      id,
      de: atual.status,
      para,
      comentario,
      usuarioId: usuario.id,
    });
    garantirQueGravou(mudou);

    return this.detalhar(id);
  }

  private async buscar(id: string): Promise<LinhaDetalhe> {
    const solicitacao = await this.repositorio.buscarDetalhe(id);
    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada.');
    }
    return solicitacao;
  }

  /** A área precisa estar ativa. O complemento só é gravado (e exigido) na área "Outras". */
  private async validarArea(
    areaId: number,
    complemento?: string,
  ): Promise<string | null> {
    const area = await this.repositorio.buscarAreaAtiva(areaId);
    if (!area) {
      throw campoInvalido('areaId', 'Selecione uma área válida.');
    }
    if (!area.exigeComplemento) {
      return null;
    }
    if (!complemento) {
      throw campoInvalido(
        'areaComplemento',
        'Informe o nome da área quando escolher "Outras".',
      );
    }
    return complemento;
  }
}

/** O solicitante só edita e exclui as solicitações que ele mesmo cadastrou. */
function garantirAutor(
  solicitacao: LinhaDetalhe,
  usuario: UsuarioAutenticado,
  acao: 'editar' | 'excluir',
): void {
  if (
    usuario.perfil === 'SOLICITANTE' &&
    solicitacao.criadoPorId !== usuario.id
  ) {
    throw new ForbiddenException(
      `Você só pode ${acao} as solicitações que cadastrou.`,
    );
  }
}

/** O repository devolve false quando outra pessoa mudou o status entre a leitura e a gravação. */
function garantirQueGravou(gravou: boolean): void {
  if (!gravou) {
    throw new ConflictException(
      'A solicitação foi alterada por outra pessoa. Recarregue a página e tente novamente.',
    );
  }
}
