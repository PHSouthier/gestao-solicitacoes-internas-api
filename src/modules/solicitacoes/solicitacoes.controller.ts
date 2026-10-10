import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiErros } from '../../common/decorators/api-erros.decorator.js';
import { IdParamDto } from '../../common/dto/id-param.dto.js';
import { Perfis, UsuarioAtual } from '../auth/auth.decorators.js';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import { AtualizarSolicitacaoDto } from './dto/atualizar-solicitacao.dto.js';
import { CriarSolicitacaoDto } from './dto/criar-solicitacao.dto.js';
import { DecisaoDto } from './dto/decisao.dto.js';
import { ListarSolicitacoesQuery } from './dto/listar-solicitacoes.dto.js';
import {
  PaginaSolicitacoesDto,
  SolicitacaoDetalheDto,
} from './dto/solicitacao-response.dto.js';
import { SolicitacoesService } from './solicitacoes.service.js';

@ApiTags('Solicitações')
@ApiErros(401)
@Controller('solicitacoes')
export class SolicitacoesController {
  constructor(private readonly service: SolicitacoesService) {}

  /** Lista com busca, filtros, ordenação e paginação. */
  @Get()
  @ApiErros({ 400: 'Parâmetros de busca inválidos' })
  listar(
    @Query() query: ListarSolicitacoesQuery,
  ): Promise<PaginaSolicitacoesDto> {
    return this.service.listar(query);
  }

  /** Detalhe com o histórico de status. */
  @Get(':id')
  @ApiErros(400, 404)
  detalhar(@Param() { id }: IdParamDto): Promise<SolicitacaoDetalheDto> {
    return this.service.detalhar(id);
  }

  /** Cadastra uma solicitação (nasce com status Aberta). */
  @Post()
  @ApiErros({ 400: 'Dados inválidos ou área inativa' })
  async criar(
    @Body() dto: CriarSolicitacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SolicitacaoDetalheDto> {
    const solicitacao = await this.service.criar(dto, usuario);
    res.location(`/api/v1/solicitacoes/${solicitacao.id}`);
    return solicitacao;
  }

  /** Edita os dados enquanto Aberta ou Em Análise. Solicitante só edita as que cadastrou. */
  @Patch(':id')
  @ApiErros(400, 404, {
    403: 'Solicitação de outra pessoa',
    409: 'Finalizada ou alterada por outra pessoa',
  })
  atualizar(
    @Param() { id }: IdParamDto,
    @Body() dto: AtualizarSolicitacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.atualizar(id, dto, usuario);
  }

  /** Exclusão lógica, só com status Aberta. Solicitante exclui as que cadastrou; administrador, qualquer uma. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Perfis('SOLICITANTE', 'ADMINISTRADOR')
  @ApiErros(400, 404, {
    403: 'Perfil sem permissão ou solicitação de outra pessoa',
    409: 'Status diferente de Aberta',
  })
  excluir(
    @Param() { id }: IdParamDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<void> {
    return this.service.excluir(id, usuario);
  }

  /** Inicia a análise (Aberta → Em Análise). */
  @Post(':id/analise')
  @HttpCode(HttpStatus.OK)
  @Perfis('ANALISTA', 'ADMINISTRADOR')
  @ApiErros(400, 404, {
    403: 'Somente analista ou administrador',
    409: 'Transição inválida ou alterada por outra pessoa',
  })
  iniciarAnalise(
    @Param() { id }: IdParamDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.iniciarAnalise(id, usuario);
  }

  /** Aprova ou rejeita, com comentário obrigatório (fica no histórico com autor e data). */
  @Post(':id/decisao')
  @HttpCode(HttpStatus.OK)
  @Perfis('ANALISTA', 'ADMINISTRADOR')
  @ApiErros(404, {
    400: 'Comentário ausente ou dados inválidos',
    403: 'Somente analista ou administrador',
    409: 'Já finalizada ou decidida por outra pessoa',
  })
  decidir(
    @Param() { id }: IdParamDto,
    @Body() dto: DecisaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.decidir(id, dto, usuario);
  }
}
