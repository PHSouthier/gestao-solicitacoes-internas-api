import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { Prisma } from '../../generated/prisma/client.js';
import { CodigoErro } from '../errors/codigos-erro.js';
import { DadosInvalidosException } from '../errors/dados-invalidos.exception.js';
import { type DetalheErro, DomainError } from '../errors/domain-error.js';
import type { RequestComId } from '../middleware/request-id.middleware.js';

export interface ErroResolvido {
  statusCode: number;
  code: string;
  message: string;
  details: DetalheErro[];
  inesperado: boolean;
}

const CODIGO_POR_STATUS: Partial<Record<number, CodigoErro>> = {
  [HttpStatus.BAD_REQUEST]: CodigoErro.REQUISICAO_INVALIDA,
  [HttpStatus.UNAUTHORIZED]: CodigoErro.NAO_AUTENTICADO,
  [HttpStatus.FORBIDDEN]: CodigoErro.SEM_PERMISSAO,
  [HttpStatus.NOT_FOUND]: CodigoErro.NAO_ENCONTRADO,
  [HttpStatus.CONFLICT]: CodigoErro.CONFLITO,
  [HttpStatus.TOO_MANY_REQUESTS]: CodigoErro.MUITAS_REQUISICOES,
  [HttpStatus.SERVICE_UNAVAILABLE]: CodigoErro.SERVICO_INDISPONIVEL,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestComId>();
    const res = ctx.getResponse<Response>();
    const erro = resolverErro(exception);

    if (erro.inesperado) {
      this.logger.error(
        `${req.method} ${req.originalUrl} [requestId=${req.id}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(erro.statusCode).json({
      statusCode: erro.statusCode,
      error: STATUS_CODES[erro.statusCode] ?? 'Error',
      code: erro.code,
      message: erro.message,
      details: erro.details,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }
}

export function resolverErro(exception: unknown): ErroResolvido {
  if (exception instanceof DadosInvalidosException) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: CodigoErro.DADOS_INVALIDOS,
      message: 'Dados inválidos.',
      details: exception.details,
      inesperado: false,
    };
  }

  if (exception instanceof HttpException) {
    return deHttpException(exception);
  }

  if (exception instanceof DomainError) {
    return {
      statusCode: exception.httpStatus,
      code: exception.code,
      message: exception.message,
      details: exception.details,
      inesperado: false,
    };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    const convertido = deErroPrisma(exception);
    if (convertido) return convertido;
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: CodigoErro.ERRO_INTERNO,
    message: 'Erro interno do servidor.',
    details: [],
    inesperado: true,
  };
}

function deHttpException(exception: HttpException): ErroResolvido {
  const statusCode = exception.getStatus();
  const corpo = exception.getResponse();

  let code: string = CODIGO_POR_STATUS[statusCode] ?? HttpStatus[statusCode];
  let message = exception.message;

  if (typeof corpo === 'object' && corpo !== null) {
    const { code: codigo, message: mensagem } = corpo as {
      code?: unknown;
      message?: unknown;
    };
    if (typeof codigo === 'string') code = codigo;
    if (typeof mensagem === 'string') message = mensagem;
    if (Array.isArray(mensagem)) message = mensagem.join(' ');
  }

  return {
    statusCode,
    code,
    message,
    details: [],
    inesperado: statusCode >= 500 && statusCode !== 503,
  };
}

function deErroPrisma(
  erro: Prisma.PrismaClientKnownRequestError,
): ErroResolvido | undefined {
  const base = { details: [], inesperado: false };

  switch (erro.code) {
    case 'P2025':
      return {
        ...base,
        statusCode: HttpStatus.NOT_FOUND,
        code: CodigoErro.REGISTRO_NAO_ENCONTRADO,
        message: 'Registro não encontrado.',
      };
    case 'P2002':
      return {
        ...base,
        statusCode: HttpStatus.CONFLICT,
        code: CodigoErro.REGISTRO_DUPLICADO,
        message: 'Já existe um registro com esses dados.',
      };
    case 'P2003':
      return {
        ...base,
        statusCode: HttpStatus.BAD_REQUEST,
        code: CodigoErro.REFERENCIA_INVALIDA,
        message: 'Registro relacionado não encontrado.',
      };
    case 'P1001':
    case 'P1002':
    case 'P1017':
      return {
        ...base,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: CodigoErro.BANCO_INDISPONIVEL,
        message: 'Banco de dados indisponível.',
      };
    default:
      return undefined;
  }
}
