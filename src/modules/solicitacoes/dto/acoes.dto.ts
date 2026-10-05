import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';

export const DECISOES = ['APROVADA', 'REJEITADA'] as const;
export type Decisao = (typeof DECISOES)[number];

export class DecisaoDto {
  @ApiProperty({ enum: DECISOES, example: 'APROVADA' })
  @IsIn(DECISOES, { message: 'A decisão deve ser APROVADA ou REJEITADA.' })
  decisao: Decisao;

  @ApiProperty({
    example: 'Aprovado dentro do orçamento do trimestre.',
    minLength: 5,
    maxLength: 1000,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'O comentário deve ser um texto.' })
  @Length(5, 1000, {
    message: 'O comentário é obrigatório e deve ter entre 5 e 1000 caracteres.',
  })
  comentario: string;
}
