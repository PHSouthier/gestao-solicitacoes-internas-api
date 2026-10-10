import { Module } from '@nestjs/common';
import { AreasController } from './areas.controller.js';
import { AreasRepository } from './areas.repository.js';
import { AreasService } from './areas.service.js';

@Module({
  controllers: [AreasController],
  providers: [AreasService, AreasRepository],
})
export class AreasModule {}
