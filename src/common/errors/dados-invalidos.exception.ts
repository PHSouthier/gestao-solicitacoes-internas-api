import { BadRequestException, type ValidationError } from '@nestjs/common';
import { CodigoErro } from './codigos-erro.js';
import type { DetalheErro } from './domain-error.js';

export class DadosInvalidosException extends BadRequestException {
  readonly details: DetalheErro[];

  constructor(erros: ValidationError[]) {
    super({ code: CodigoErro.DADOS_INVALIDOS, message: 'Dados inválidos.' });
    this.details = porCampo(erros);
  }
}

function porCampo(erros: ValidationError[], pai = ''): DetalheErro[] {
  return erros.flatMap((erro) => {
    const field = pai ? `${pai}.${erro.property}` : erro.property;
    const proprios = erro.constraints
      ? [{ field, messages: Object.values(erro.constraints) }]
      : [];
    return [...proprios, ...porCampo(erro.children ?? [], field)];
  });
}
