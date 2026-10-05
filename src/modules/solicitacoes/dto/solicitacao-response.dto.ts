import { ApiProperty } from '@nestjs/swagger';
import {
  PrioridadeSolicitacao,
  StatusSolicitacao,
} from '../../../generated/prisma/enums.js';

export class AreaResumoDto {
  @ApiProperty({ example: 9 })
  id: number;

  @ApiProperty({ example: 'Tecnologia da Informação' })
  nome: string;
}

export class UsuarioResumoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Ana Analista' })
  nome: string;
}

export class SolicitacaoResumoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'SOL-000042' })
  codigo: string;

  @ApiProperty({ example: 'Compra de notebooks' })
  titulo: string;

  @ApiProperty({ example: 'Maria Souza' })
  nomeSolicitante: string;

  @ApiProperty({ type: AreaResumoDto })
  area: AreaResumoDto;

  @ApiProperty({ type: String, nullable: true, example: null })
  areaComplemento: string | null;

  @ApiProperty({
    enum: PrioridadeSolicitacao,
    enumName: 'PrioridadeSolicitacao',
  })
  prioridade: PrioridadeSolicitacao;

  @ApiProperty({ enum: StatusSolicitacao, enumName: 'StatusSolicitacao' })
  status: StatusSolicitacao;

  @ApiProperty({ format: 'date', example: '2026-10-05' })
  dataSolicitacao: string;

  @ApiProperty({ format: 'date-time' })
  criadoEm: Date;

  @ApiProperty({ format: 'date-time' })
  atualizadoEm: Date;
}

export class HistoricoStatusDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    enum: StatusSolicitacao,
    enumName: 'StatusSolicitacao',
    nullable: true,
    description: 'null no registro da criação.',
  })
  statusAnterior: StatusSolicitacao | null;

  @ApiProperty({ enum: StatusSolicitacao, enumName: 'StatusSolicitacao' })
  statusNovo: StatusSolicitacao;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Aprovado pela diretoria.',
  })
  comentario: string | null;

  @ApiProperty({ type: UsuarioResumoDto, nullable: true })
  alteradoPor: UsuarioResumoDto | null;

  @ApiProperty({ format: 'date-time' })
  alteradoEm: Date;
}

export class SolicitacaoDetalheDto extends SolicitacaoResumoDto {
  @ApiProperty({
    example: 'Precisamos de 5 notebooks para os novos vendedores.',
  })
  descricao: string;

  @ApiProperty({ type: UsuarioResumoDto, nullable: true })
  criadoPor: UsuarioResumoDto | null;

  @ApiProperty({ type: [HistoricoStatusDto] })
  historico: HistoricoStatusDto[];
}

export class PaginacaoDto {
  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  tamanhoPagina: number;

  @ApiProperty({ example: 57 })
  total: number;

  @ApiProperty({ example: 6 })
  totalPaginas: number;
}

export class PaginaSolicitacoesDto {
  @ApiProperty({ type: [SolicitacaoResumoDto] })
  data: SolicitacaoResumoDto[];

  @ApiProperty({ type: PaginacaoDto })
  meta: PaginacaoDto;
}
