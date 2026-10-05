import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { NaoFutura } from '../../../common/validators/data.js';
import { PrioridadeSolicitacao } from '../../../generated/prisma/enums.js';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CriarSolicitacaoDto {
  @ApiProperty({ example: 'Compra de notebooks', minLength: 3, maxLength: 150 })
  @Transform(aparar)
  @IsString({ message: 'O título deve ser um texto.' })
  @Length(3, 150, { message: 'O título deve ter entre 3 e 150 caracteres.' })
  titulo: string;

  @ApiProperty({
    example: 'Precisamos de 5 notebooks para os novos vendedores.',
    minLength: 10,
    maxLength: 5000,
  })
  @Transform(aparar)
  @IsString({ message: 'A descrição deve ser um texto.' })
  @Length(10, 5000, {
    message: 'A descrição deve ter entre 10 e 5000 caracteres.',
  })
  descricao: string;

  @ApiProperty({
    example: 'Maria Souza',
    maxLength: 120,
    description:
      'Quem está pedindo (pode ser outra pessoa além de quem cadastra).',
  })
  @Transform(aparar)
  @IsString({ message: 'O solicitante deve ser um texto.' })
  @Length(2, 120, {
    message: 'O solicitante deve ter entre 2 e 120 caracteres.',
  })
  nomeSolicitante: string;

  @ApiProperty({
    example: 9,
    description: 'Id de uma área ativa (GET /areas).',
  })
  @Type(() => Number)
  @IsInt({ message: 'Informe a área.' })
  @Min(1, { message: 'Informe a área.' })
  areaId: number;

  @ApiPropertyOptional({
    example: 'Comitê de Eventos',
    maxLength: 100,
    description: 'Obrigatório quando a área exige complemento ("Outras").',
  })
  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'O complemento da área deve ser um texto.' })
  @MaxLength(100, {
    message: 'O complemento da área deve ter no máximo 100 caracteres.',
  })
  areaComplemento?: string;

  @ApiProperty({
    enum: PrioridadeSolicitacao,
    enumName: 'PrioridadeSolicitacao',
  })
  @IsEnum(PrioridadeSolicitacao, {
    message: 'Prioridade inválida. Use BAIXA, MEDIA ou ALTA.',
  })
  prioridade: PrioridadeSolicitacao;

  @ApiPropertyOptional({
    example: '2026-10-05',
    format: 'date',
    description: 'Padrão: hoje. Não pode ser uma data futura.',
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'Data inválida. Use o formato AAAA-MM-DD.' },
  )
  @NaoFutura({ message: 'A data da solicitação não pode ser futura.' })
  dataSolicitacao?: string;
}
