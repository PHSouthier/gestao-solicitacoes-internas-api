import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que não estão no DTO
      forbidNonWhitelisted: true, // e responde 400 se vierem campos extras
      transform: true, // aplica os @Transform e converte para a classe do DTO
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gestão de Solicitações Internas — API')
    .setDescription(
      'API REST para cadastro, consulta, análise e decisão de solicitações internas.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
