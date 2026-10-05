import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import { Perfis } from '../auth/perfis.decorator.js';
import { UsuarioAtual } from '../auth/usuario-atual.decorator.js';
import { DecisaoDto } from './dto/acoes.dto.js';
import { AtualizarSolicitacaoDto } from './dto/atualizar-solicitacao.dto.js';
import { CriarSolicitacaoDto } from './dto/criar-solicitacao.dto.js';
import { ListarSolicitacoesQuery } from './dto/listar-solicitacoes.query.js';
import {
  HistoricoStatusDto,
  PaginaSolicitacoesDto,
  SolicitacaoDetalheDto,
} from './dto/solicitacao-response.dto.js';
import { SolicitacoesService } from './solicitacoes.service.js';

const ERRO = { type: ErrorResponseDto };

@ApiTags('Solicitações')
@ApiCookieAuth()
@ApiUnauthorizedResponse({ ...ERRO, description: 'Não autenticado' })
@Controller('solicitacoes')
export class SolicitacoesController {
  constructor(private readonly service: SolicitacoesService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra uma solicitação (nasce com status Aberta)',
  })
  @ApiCreatedResponse({ type: SolicitacaoDetalheDto })
  @ApiBadRequestResponse({
    ...ERRO,
    description: 'Dados inválidos ou área inválida',
  })
  async criar(
    @Body() dto: CriarSolicitacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SolicitacaoDetalheDto> {
    const solicitacao = await this.service.criar(dto, usuario);
    res.location(`/api/v1/solicitacoes/${solicitacao.id}`);
    return solicitacao;
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista com busca, filtros, ordenação e paginação (ignora as excluídas)',
  })
  @ApiOkResponse({ type: PaginaSolicitacoesDto })
  @ApiBadRequestResponse({ ...ERRO, description: 'Parâmetros inválidos' })
  listar(
    @Query() query: ListarSolicitacoesQuery,
  ): Promise<PaginaSolicitacoesDto> {
    return this.service.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe com histórico de status' })
  @ApiOkResponse({ type: SolicitacaoDetalheDto })
  @ApiNotFoundResponse({ ...ERRO, description: 'Solicitação não encontrada' })
  detalhar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.detalhar(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edita os dados cadastrais (não o status)',
    description:
      'Só enquanto Aberta ou Em Análise. Solicitante só edita as que cadastrou.',
  })
  @ApiOkResponse({ type: SolicitacaoDetalheDto })
  @ApiBadRequestResponse({ ...ERRO, description: 'Dados inválidos' })
  @ApiForbiddenResponse({ ...ERRO, description: 'Solicitação de outra pessoa' })
  @ApiNotFoundResponse({ ...ERRO, description: 'Solicitação não encontrada' })
  @ApiConflictResponse({
    ...ERRO,
    description: 'Finalizada ou alterada por outra pessoa',
  })
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarSolicitacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.atualizar(id, dto, usuario);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Perfis('SOLICITANTE', 'ADMINISTRADOR')
  @ApiOperation({
    summary: 'Exclusão lógica',
    description:
      'Só com status Aberta. Solicitante exclui as que cadastrou; administrador, qualquer uma.',
  })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ ...ERRO, description: 'Sem permissão' })
  @ApiNotFoundResponse({ ...ERRO, description: 'Solicitação não encontrada' })
  @ApiConflictResponse({ ...ERRO, description: 'Status diferente de Aberta' })
  excluir(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<void> {
    return this.service.excluir(id, usuario);
  }

  @Post(':id/analise')
  @HttpCode(HttpStatus.OK)
  @Perfis('ANALISTA', 'ADMINISTRADOR')
  @ApiOperation({ summary: 'Inicia a análise (Aberta → Em Análise)' })
  @ApiOkResponse({ type: SolicitacaoDetalheDto })
  @ApiForbiddenResponse({
    ...ERRO,
    description: 'Somente analista ou administrador',
  })
  @ApiNotFoundResponse({ ...ERRO, description: 'Solicitação não encontrada' })
  @ApiConflictResponse({
    ...ERRO,
    description: 'Transição inválida ou alterada por outra pessoa',
  })
  iniciarAnalise(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.iniciarAnalise(id, usuario);
  }

  @Post(':id/decisao')
  @HttpCode(HttpStatus.OK)
  @Perfis('ANALISTA', 'ADMINISTRADOR')
  @ApiOperation({
    summary: 'Aprova ou rejeita, com comentário obrigatório',
    description: 'Grava comentário, autor e data no histórico.',
  })
  @ApiOkResponse({ type: SolicitacaoDetalheDto })
  @ApiBadRequestResponse({
    ...ERRO,
    description: 'Comentário ausente ou dados inválidos',
  })
  @ApiForbiddenResponse({
    ...ERRO,
    description: 'Somente analista ou administrador',
  })
  @ApiNotFoundResponse({ ...ERRO, description: 'Solicitação não encontrada' })
  @ApiConflictResponse({
    ...ERRO,
    description: 'Já finalizada ou decidida por outra pessoa',
  })
  decidir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.decidir(id, dto, usuario);
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Histórico de mudanças de status' })
  @ApiOkResponse({ type: [HistoricoStatusDto] })
  @ApiNotFoundResponse({ ...ERRO, description: 'Solicitação não encontrada' })
  historico(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HistoricoStatusDto[]> {
    return this.service.historico(id);
  }
}
