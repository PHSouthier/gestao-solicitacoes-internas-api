export type MotivoErroGoogle =
  | 'cancelado'
  | 'estado_invalido'
  | 'email_nao_verificado'
  | 'email_vinculado_a_outra_conta'
  | 'usuario_inativo'
  | 'falhou';

export class ErroLoginGoogle extends Error {
  constructor(readonly motivo: MotivoErroGoogle) {
    super(`Login com Google falhou: ${motivo}`);
  }
}
