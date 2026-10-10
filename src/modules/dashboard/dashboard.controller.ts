import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiErros } from '../../common/decorators/api-erros.decorator.js';
import { DashboardService } from './dashboard.service.js';
import { ResumoDashboardDto } from './dto/resumo-dashboard.dto.js';

@ApiTags('Dashboard')
@ApiErros(401)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** Indicadores: total, por status, por prioridade e por área. */
  @Get('resumo')
  resumo(): Promise<ResumoDashboardDto> {
    return this.dashboardService.resumo();
  }
}
