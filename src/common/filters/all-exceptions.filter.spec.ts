import {
  type ArgumentsHost,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

describe('AllExceptionsFilter', () => {
  const filtro = new AllExceptionsFilter();

  function responder(exception: unknown) {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          originalUrl: '/api/v1/solicitacoes',
          id: 'req-1',
        }),
        getResponse: () => res,
      }),
    } as unknown as ArgumentsHost;

    filtro.catch(exception, host);
    return {
      status: res.status.mock.calls[0][0],
      corpo: res.json.mock.calls[0][0],
    };
  }

  it('responde no formato padrão, com o código derivado do status', () => {
    const { status, corpo } = responder(
      new ConflictException('Status diferente de Aberta.'),
    );

    expect(status).toBe(409);
    expect(corpo).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      code: 'CONFLITO',
      message: 'Status diferente de Aberta.',
      details: [],
      path: '/api/v1/solicitacoes',
      requestId: 'req-1',
    });
    expect(new Date(corpo.timestamp).toISOString()).toBe(corpo.timestamp);
  });

  it('repassa os erros por campo', () => {
    const details = [{ field: 'titulo', messages: ['Muito curto.'] }];

    const { corpo } = responder(
      new BadRequestException({ message: 'Dados inválidos.', details }),
    );

    expect(corpo).toMatchObject({
      code: 'DADOS_INVALIDOS',
      message: 'Dados inválidos.',
      details,
    });
  });

  it('junta mensagens que vêm em lista', () => {
    const { corpo } = responder(
      new BadRequestException(['Erro A.', 'Erro B.']),
    );

    expect(corpo.message).toBe('Erro A. Erro B.');
  });

  it('rota inexistente: 404 NAO_ENCONTRADO', () => {
    const { status, corpo } = responder(
      new NotFoundException('Cannot GET /api/v1/x'),
    );

    expect(status).toBe(404);
    expect(corpo.code).toBe('NAO_ENCONTRADO');
  });

  it('erro inesperado: 500 sem expor a mensagem interna, e registra no log', () => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const { status, corpo } = responder(
      new Error('senha do banco: 123 (detalhe interno)'),
    );

    expect(status).toBe(500);
    expect(corpo).toMatchObject({
      code: 'ERRO_INTERNO',
      message: 'Erro interno do servidor.',
    });
    expect(JSON.stringify(corpo)).not.toContain('senha do banco');
    expect(log).toHaveBeenCalled();
  });
});
