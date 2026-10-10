import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';
import { aparar } from '../../../common/validators/validacao.js';

const DECISOES = ['APROVADA', 'REJEITADA'] as const;

export class DecisaoDto {
  @IsIn(DECISOES, { message: 'A decisão deve ser APROVADA ou REJEITADA.' })
  decisao: (typeof DECISOES)[number];

  /** @example "Aprovado dentro do orçamento do trimestre." */
  @Transform(aparar)
  @IsString({ message: 'O comentário deve ser um texto.' })
  @Length(5, 1000, {
    message: 'O comentário é obrigatório e deve ter entre 5 e 1000 caracteres.',
  })
  comentario: string;
}
