import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CriarUsuarioDto {
  @ApiProperty({ example: 'Maria Souza', minLength: 2, maxLength: 120 })
  @Transform(aparar)
  @IsString({ message: 'O nome deve ser um texto.' })
  @Length(2, 120, { message: 'O nome deve ter entre 2 e 120 caracteres.' })
  nome: string;

  @ApiProperty({ example: 'maria@empresa.com', maxLength: 254 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(254, { message: 'O e-mail deve ter no máximo 254 caracteres.' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    minLength: 8,
    maxLength: 72,
    format: 'password',
    description:
      'Mínimo de 8 caracteres, com pelo menos uma letra e um número.',
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  @Length(8, 72, { message: 'A senha deve ter entre 8 e 72 caracteres.' })
  @Matches(/[A-Za-z]/, { message: 'A senha deve ter pelo menos uma letra.' })
  @Matches(/\d/, { message: 'A senha deve ter pelo menos um número.' })
  senha: string;
}
