import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PrioridadeSolicitacao,
  StatusSolicitacao,
} from '../../../generated/prisma/enums.js';

export const CAMPOS_ORDENACAO = [
  'dataSolicitacao',
  'criadoEm',
  'prioridade',
  'titulo',
] as const;
export type CampoOrdenacao = (typeof CAMPOS_ORDENACAO)[number];

const lista = ({ value }: { value: unknown }) =>
  value === undefined
    ? undefined
    : (Array.isArray(value) ? value : [value])
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);

export class ListarSolicitacoesQuery {
  @ApiPropertyOptional({
    description:
      'Busca no título, descrição, solicitante e código (ex.: SOL-000012).',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100, { message: 'A busca deve ter no máximo 100 caracteres.' })
  busca?: string;

  @ApiPropertyOptional({
    enum: StatusSolicitacao,
    enumName: 'StatusSolicitacao',
    isArray: true,
    description: 'Um ou mais, separados por vírgula.',
  })
  @IsOptional()
  @Transform(lista)
  @IsEnum(StatusSolicitacao, { each: true, message: 'Status inválido.' })
  status?: StatusSolicitacao[];

  @ApiPropertyOptional({
    enum: PrioridadeSolicitacao,
    enumName: 'PrioridadeSolicitacao',
    isArray: true,
    description: 'Uma ou mais, separadas por vírgula.',
  })
  @IsOptional()
  @Transform(lista)
  @IsEnum(PrioridadeSolicitacao, {
    each: true,
    message: 'Prioridade inválida.',
  })
  prioridade?: PrioridadeSolicitacao[];

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Área inválida.' })
  areaId?: number;

  @ApiPropertyOptional({ format: 'date', example: '2026-01-01' })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'Data inicial inválida (AAAA-MM-DD).' },
  )
  dataInicio?: string;

  @ApiPropertyOptional({ format: 'date', example: '2026-12-31' })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'Data final inválida (AAAA-MM-DD).' },
  )
  dataFim?: string;

  @ApiPropertyOptional({ enum: CAMPOS_ORDENACAO, default: 'dataSolicitacao' })
  @IsOptional()
  @IsIn(CAMPOS_ORDENACAO, { message: 'Campo de ordenação inválido.' })
  ordenarPor: CampoOrdenacao = 'dataSolicitacao';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'A ordem deve ser asc ou desc.' })
  ordem: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'A página começa em 1.' })
  pagina = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'O tamanho da página deve ser no máximo 100.' })
  tamanhoPagina = 10;
}
