export class AreaResponseDto {
  id: number;
  nome: string;
  /** Quando true (área "Outras"), a solicitação precisa informar `areaComplemento`. */
  exigeComplemento: boolean;
}
