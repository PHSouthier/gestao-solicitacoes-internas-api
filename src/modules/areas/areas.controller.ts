import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { AreasService } from './areas.service.js';
import { AreaResponseDto } from './dto/area-response.dto.js';

@ApiTags('Áreas')
@ApiCookieAuth()
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as áreas ativas (combo do formulário)' })
  @ApiOkResponse({ type: [AreaResponseDto] })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Não autenticado',
  })
  listar(): Promise<AreaResponseDto[]> {
    return this.areasService.listarAtivas();
  }
}
