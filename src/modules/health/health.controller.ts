import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { CodigoErro } from '../../common/errors/codigos-erro.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HealthResponseDto } from './dto/health-response.dto.js';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica se a API está no ar e alcança o banco' })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({
    type: ErrorResponseDto,
    description: 'Banco de dados indisponível',
  })
  async check(): Promise<HealthResponseDto> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (erro) {
      this.logger.error(
        `Banco indisponível: ${(erro instanceof Error ? erro.message : String(erro)).replace(/\s+/g, ' ').trim()}`,
      );
      throw new ServiceUnavailableException({
        code: CodigoErro.BANCO_INDISPONIVEL,
        message: 'Banco de dados indisponível.',
      });
    }

    return {
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
