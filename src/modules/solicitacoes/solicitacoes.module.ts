import { Module } from '@nestjs/common';
import { SolicitacoesController } from './solicitacoes.controller.js';
import { SolicitacoesRepository } from './solicitacoes.repository.js';
import { SolicitacoesService } from './solicitacoes.service.js';

@Module({
  controllers: [SolicitacoesController],
  providers: [SolicitacoesService, SolicitacoesRepository],
})
export class SolicitacoesModule {}
