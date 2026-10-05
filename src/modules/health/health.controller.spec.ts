import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const prisma = { $queryRaw: vi.fn() };
  let controller: HealthController;

  beforeEach(async () => {
    prisma.$queryRaw.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('com o banco respondendo, retorna ok', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const resposta = await controller.check();

    expect(resposta).toMatchObject({ status: 'ok', database: 'up' });
    expect(new Date(resposta.timestamp).toISOString()).toBe(resposta.timestamp);
  });

  it('com o banco fora do ar, responde 503 BANCO_INDISPONIVEL', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const erro = await controller.check().catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ServiceUnavailableException);
    expect((erro as ServiceUnavailableException).getResponse()).toMatchObject({
      code: 'BANCO_INDISPONIVEL',
    });
  });
});
