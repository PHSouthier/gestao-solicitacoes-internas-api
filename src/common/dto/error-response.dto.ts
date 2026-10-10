export class ErrorDetailDto {
  /** @example "titulo" */
  field: string;
  /** @example ["O título deve ter entre 3 e 150 caracteres."] */
  messages: string[];
}

export class ErrorResponseDto {
  /** @example 409 */
  statusCode: number;
  /** @example "Conflict" */
  error: string;
  /**
   * Código estável derivado do status: DADOS_INVALIDOS, NAO_AUTENTICADO, SEM_PERMISSAO,
   * NAO_ENCONTRADO, CONFLITO, ERRO_INTERNO ou SERVICO_INDISPONIVEL.
   * @example "CONFLITO"
   */
  code: string;
  /** @example "Só é possível excluir solicitações com status Aberta." */
  message: string;
  /** Erros por campo (preenchido quando a validação falha). */
  details: ErrorDetailDto[];
  /** @example "/api/v1/solicitacoes/3f9c…" */
  path: string;
  timestamp: string;
  /** Mesmo valor do header x-request-id. */
  requestId: string;
}
