import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { STATUS_CODES } from 'node:http';
import { ErrorResponseDto } from '../dto/error-response.dto.js';
import { CODIGO_POR_STATUS } from '../filters/all-exceptions.filter.js';

type StatusErro = 400 | 401 | 403 | 404 | 409 | 503;

const DESCRICAO_PADRAO: Record<StatusErro, string> = {
  400: 'Dados inválidos',
  401: 'Não autenticado',
  403: 'Sem permissão',
  404: 'Não encontrado',
  409: 'Conflito com o estado atual',
  503: 'Serviço indisponível',
};

export function ApiErros(
  ...erros: (StatusErro | Partial<Record<StatusErro, string>>)[]
) {
  const descricoes = erros.flatMap((erro) =>
    typeof erro === 'number'
      ? [[erro, DESCRICAO_PADRAO[erro]] as const]
      : Object.entries(erro).map(
          ([status, texto]) => [Number(status), texto] as const,
        ),
  );

  return applyDecorators(
    ...descricoes.map(([status, description]) =>
      ApiResponse({
        status,
        description,
        type: ErrorResponseDto,
        example: exemplo(status, description),
      }),
    ),
  );
}

function exemplo(status: number, mensagem: string) {
  return {
    statusCode: status,
    error: STATUS_CODES[status],
    code: CODIGO_POR_STATUS[status],
    message: `${mensagem}.`,
    details:
      status === 400
        ? [
            {
              field: 'titulo',
              messages: ['O título deve ter entre 3 e 150 caracteres.'],
            },
          ]
        : [],
    path: '/api/v1/...',
    timestamp: '2026-10-09T22:00:00.000Z',
    requestId: '3f934837-4180-43f5-97b0-26796b7f5b70',
  };
}
