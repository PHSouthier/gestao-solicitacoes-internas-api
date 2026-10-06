import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { DashboardService } from './dashboard.service.js';
import { ResumoDashboardDto } from './dto/resumo-dashboard.dto.js';

@ApiTags('Dashboard')
@ApiCookieAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumo')
  @ApiOperation({
    summary: 'Indicadores: total, por status, por prioridade e por área',
  })
  @ApiOkResponse({ type: ResumoDashboardDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Não autenticado',
  })
  resumo(): Promise<ResumoDashboardDto> {
    return this.dashboardService.resumo();
  }
}
