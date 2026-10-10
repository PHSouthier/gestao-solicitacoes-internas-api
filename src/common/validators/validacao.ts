import {
  BadRequestException,
  type ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import type { DetalheErro } from '../filters/all-exceptions.filter.js';

const DADOS_INVALIDOS = 'Dados inválidos.';

/** Valida o corpo e a query de todas as rotas pelos DTOs (class-validator). */
export const validacaoGlobal = new ValidationPipe({
  whitelist: true, // descarta campos que não estão no DTO
  forbidNonWhitelisted: true, // e responde 400 se vierem campos extras
  transform: true, // aplica os @Transform e converte para a classe do DTO
  exceptionFactory: (erros) =>
    new BadRequestException({
      message: DADOS_INVALIDOS,
      details: errosPorCampo(erros),
    }),
});

/** Para usar com `@Transform`: tira os espaços do começo e do fim dos textos. */
export function aparar({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Erro 400 apontando um campo, para validações que dependem do banco. */
export function campoInvalido(
  field: string,
  mensagem: string,
): BadRequestException {
  return new BadRequestException({
    message: DADOS_INVALIDOS,
    details: [{ field, messages: [mensagem] }],
  });
}

function errosPorCampo(erros: ValidationError[], pai = ''): DetalheErro[] {
  return erros.flatMap((erro) => {
    const field = pai ? `${pai}.${erro.property}` : erro.property;
    const proprios = erro.constraints
      ? [{ field, messages: Object.values(erro.constraints) }]
      : [];
    return [...proprios, ...errosPorCampo(erro.children ?? [], field)];
  });
}
