import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health responde 200', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(resposta.body.status).toBe('ok');
  });

  it('rota inexistente responde no formato padrão, com o x-request-id', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/api/v1/nao-existe')
      .set('x-request-id', 'teste-e2e-1')
      .expect(404);

    expect(resposta.headers['x-request-id']).toBe('teste-e2e-1');
    expect(resposta.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      code: 'NAO_ENCONTRADO',
      details: [],
      path: '/api/v1/nao-existe',
      requestId: 'teste-e2e-1',
    });
  });

  it('dados inválidos respondem 400 com os erros por campo', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/api/v1/usuarios')
      .send({ nome: 'M', email: 'x', senha: '123' })
      .expect(400);

    expect(resposta.body.code).toBe('DADOS_INVALIDOS');
    expect(
      resposta.body.details.map((d: { field: string }) => d.field),
    ).toEqual(['nome', 'email', 'senha']);
  });
});
