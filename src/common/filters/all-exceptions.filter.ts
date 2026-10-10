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
import type { ErrorDetailDto } from '../dto/error-response.dto.js';
import type { RequestComId } from '../middleware/request-id.middleware.js';

export const CODIGO_POR_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'DADOS_INVALIDOS',
  [HttpStatus.UNAUTHORIZED]: 'NAO_AUTENTICADO',
  [HttpStatus.FORBIDDEN]: 'SEM_PERMISSAO',
  [HttpStatus.NOT_FOUND]: 'NAO_ENCONTRADO',
  [HttpStatus.CONFLICT]: 'CONFLITO',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'ERRO_INTERNO',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICO_INDISPONIVEL',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const req = host.switchToHttp().getRequest<RequestComId>();
    const res = host.switchToHttp().getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `${req.method} ${req.originalUrl} [requestId=${req.id}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const { statusCode, message, details } = lerErro(exception);

    res.status(statusCode).json({
      statusCode,
      error: STATUS_CODES[statusCode] ?? 'Error',
      code: CODIGO_POR_STATUS[statusCode] ?? HttpStatus[statusCode],
      message,
      details,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }
}

function lerErro(exception: unknown) {
  if (!(exception instanceof HttpException)) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor.',
      details: [],
    };
  }

  const corpo = exception.getResponse();
  const { message, details = [] } =
    typeof corpo === 'string'
      ? { message: corpo }
      : (corpo as { message: string | string[]; details?: ErrorDetailDto[] });

  return {
    statusCode: exception.getStatus(),
    message: Array.isArray(message) ? message.join(' ') : message,
    details,
  };
}
