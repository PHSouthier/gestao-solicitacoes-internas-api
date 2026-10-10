import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { validacaoGlobal } from './common/validators/validacao.js';
import { AreasModule } from './modules/areas/areas.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { SolicitacoesModule } from './modules/solicitacoes/solicitacoes.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    UsuariosModule,
    AuthModule,
    AreasModule,
    SolicitacoesModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: validacaoGlobal },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
