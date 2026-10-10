import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AreasService } from './areas.service.js';
import { AreaResponseDto } from './dto/area-response.dto.js';

@ApiTags('Áreas')
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  /** Lista as áreas ativas (combo do formulário). */
  @Get()
  listar(): Promise<AreaResponseDto[]> {
    return this.areasService.listarAtivas();
  }
}
