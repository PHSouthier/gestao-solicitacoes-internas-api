import {
  BadRequestException,
  type ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import type { ErrorDetailDto } from '../dto/error-response.dto.js';

const DADOS_INVALIDOS = 'Dados inválidos.';

export const validacaoGlobal = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (erros) =>
    new BadRequestException({
      message: DADOS_INVALIDOS,
      details: errosPorCampo(erros),
    }),
});

export function aparar({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function campoInvalido(
  field: string,
  mensagem: string,
): BadRequestException {
  return new BadRequestException({
    message: DADOS_INVALIDOS,
    details: [{ field, messages: [mensagem] }],
  });
}

function errosPorCampo(erros: ValidationError[], pai = ''): ErrorDetailDto[] {
  return erros.flatMap((erro) => {
    const field = pai ? `${pai}.${erro.property}` : erro.property;
    const proprios = erro.constraints
      ? [{ field, messages: Object.values(erro.constraints) }]
      : [];
    return [...proprios, ...errosPorCampo(erro.children ?? [], field)];
  });
}
