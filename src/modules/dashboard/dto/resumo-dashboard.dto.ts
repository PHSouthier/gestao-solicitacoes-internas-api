import { ApiProperty } from '@nestjs/swagger';

export class ContagemPorStatusDto {
  @ApiProperty({ example: 9 })
  ABERTA: number;

  @ApiProperty({ example: 6 })
  EM_ANALISE: number;

  @ApiProperty({ example: 9 })
  APROVADA: number;

  @ApiProperty({ example: 6 })
  REJEITADA: number;
}

export class ContagemPorPrioridadeDto {
  @ApiProperty({ example: 10 })
  BAIXA: number;

  @ApiProperty({ example: 11 })
  MEDIA: number;

  @ApiProperty({ example: 9 })
  ALTA: number;
}

export class ContagemPorAreaDto {
  @ApiProperty({ example: 9 })
  areaId: number;

  @ApiProperty({ example: 'Tecnologia da Informação' })
  nome: string;

  @ApiProperty({ example: 5 })
  total: number;
}

export class ResumoDashboardDto {
  @ApiProperty({
    example: 30,
    description: 'Total de solicitações (sem as excluídas).',
  })
  total: number;

  @ApiProperty({ type: ContagemPorStatusDto })
  porStatus: ContagemPorStatusDto;

  @ApiProperty({ type: ContagemPorPrioridadeDto })
  porPrioridade: ContagemPorPrioridadeDto;

  @ApiProperty({
    type: [ContagemPorAreaDto],
    description: 'Áreas com pelo menos uma solicitação, da maior para a menor.',
  })
  porArea: ContagemPorAreaDto[];

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 0.6,
    description:
      'Aprovadas ÷ (aprovadas + rejeitadas). null se nenhuma foi decidida.',
  })
  taxaAprovacao: number | null;
}
