import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { DadosInvalidosException } from './common/errors/dados-invalidos.exception.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    UsuariosModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // descarta campos que não estão no DTO
        forbidNonWhitelisted: true, // e responde 400 se vierem campos extras
        transform: true, // aplica os @Transform e converte para a classe do DTO
        exceptionFactory: (erros) => new DadosInvalidosException(erros),
      }),
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
