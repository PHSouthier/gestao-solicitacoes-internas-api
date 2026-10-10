import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configurarApp } from './app.setup.js';
import { COOKIE_SESSAO } from './modules/auth/auth-cookie.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('Gestão de Solicitações Internas — API')
    .setDescription(
      'API REST para cadastro, consulta, análise e decisão de solicitações internas.\n\n' +
        'Todo erro responde no formato `{ statusCode, error, code, message, details, path, timestamp, requestId }`. ' +
        '`details` traz os erros por campo quando a validação falha.',
    )
    .setVersion('1.0')
    .addCookieAuth(COOKIE_SESSAO)
    .addSecurityRequirements('cookie')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swagger),
  );

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
