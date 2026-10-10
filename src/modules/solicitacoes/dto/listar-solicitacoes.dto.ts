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
import { aparar } from '../../../common/validators/validacao.js';
import {
  PrioridadeSolicitacao,
  StatusSolicitacao,
} from '../../../generated/prisma/enums.js';

const CAMPOS_ORDENACAO = [
  'dataSolicitacao',
  'criadoEm',
  'prioridade',
  'titulo',
] as const;

/** Aceita `?status=A,B` e `?status=A&status=B`. */
const lista = ({ value }: { value: unknown }) =>
  value === undefined
    ? undefined
    : [value]
        .flat()
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);

export class ListarSolicitacoesQuery {
  /** Busca no título, descrição, solicitante e código (ex.: SOL-000012). */
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(100, { message: 'A busca deve ter no máximo 100 caracteres.' })
  busca?: string;

  /** Um ou mais, separados por vírgula. */
  @IsOptional()
  @Transform(lista)
  @IsEnum(StatusSolicitacao, { each: true, message: 'Status inválido.' })
  status?: StatusSolicitacao[];

  /** Uma ou mais, separadas por vírgula. */
  @IsOptional()
  @Transform(lista)
  @IsEnum(PrioridadeSolicitacao, {
    each: true,
    message: 'Prioridade inválida.',
  })
  prioridade?: PrioridadeSolicitacao[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Área inválida.' })
  areaId?: number;

  /** AAAA-MM-DD */
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'Data inicial inválida (AAAA-MM-DD).' },
  )
  dataInicio?: string;

  /** AAAA-MM-DD */
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'Data final inválida (AAAA-MM-DD).' },
  )
  dataFim?: string;

  @IsOptional()
  @IsIn(CAMPOS_ORDENACAO, { message: 'Campo de ordenação inválido.' })
  ordenarPor: (typeof CAMPOS_ORDENACAO)[number] = 'dataSolicitacao';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'A ordem deve ser asc ou desc.' })
  ordem: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'A página começa em 1.' })
  pagina = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'O tamanho da página deve ser no máximo 100.' })
  tamanhoPagina = 10;
}
