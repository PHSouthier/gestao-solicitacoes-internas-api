import { ApiProperty } from '@nestjs/swagger';

export class AreaResponseDto {
  @ApiProperty({ example: 9 })
  id: number;

  @ApiProperty({ example: 'Tecnologia da Informação' })
  nome: string;

  @ApiProperty({
    example: false,
    description:
      'Quando true (área "Outras"), a solicitação deve informar o nome da área em `areaComplemento`.',
  })
  exigeComplemento: boolean;
}
