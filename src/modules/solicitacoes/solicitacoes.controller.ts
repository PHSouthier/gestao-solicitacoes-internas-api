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
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
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
@Controller('solicitacoes')
export class SolicitacoesController {
  constructor(private readonly service: SolicitacoesService) {}

  /** Lista com busca, filtros, ordenação e paginação. */
  @Get()
  listar(
    @Query() query: ListarSolicitacoesQuery,
  ): Promise<PaginaSolicitacoesDto> {
    return this.service.listar(query);
  }

  /** Detalhe com o histórico de status. */
  @Get(':id')
  detalhar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.detalhar(id);
  }

  /** Cadastra uma solicitação (nasce com status Aberta). */
  @Post()
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
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarSolicitacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.atualizar(id, dto, usuario);
  }

  /** Exclusão lógica, só com status Aberta. Solicitante exclui as que cadastrou; administrador, qualquer uma. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Perfis('SOLICITANTE', 'ADMINISTRADOR')
  excluir(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<void> {
    return this.service.excluir(id, usuario);
  }

  /** Inicia a análise (Aberta → Em Análise). */
  @Post(':id/analise')
  @HttpCode(HttpStatus.OK)
  @Perfis('ANALISTA', 'ADMINISTRADOR')
  iniciarAnalise(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.iniciarAnalise(id, usuario);
  }

  /** Aprova ou rejeita, com comentário obrigatório (fica no histórico com autor e data). */
  @Post(':id/decisao')
  @HttpCode(HttpStatus.OK)
  @Perfis('ANALISTA', 'ADMINISTRADOR')
  decidir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<SolicitacaoDetalheDto> {
    return this.service.decidir(id, dto, usuario);
  }
}
