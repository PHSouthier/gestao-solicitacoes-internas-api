export type MotivoErroGoogle =
  | 'cancelado'
  | 'estado_invalido'
  | 'email_nao_verificado'
  | 'email_vinculado_a_outra_conta'
  | 'usuario_inativo'
  | 'falhou';

/** Falha esperada do login com Google; o motivo vai para o front na URL de retorno. */
export class ErroLoginGoogle extends Error {
  constructor(readonly motivo: MotivoErroGoogle) {
    super(`Login com Google falhou: ${motivo}`);
  }
}
