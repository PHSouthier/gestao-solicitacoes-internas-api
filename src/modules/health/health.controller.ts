import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiErros } from '../../common/decorators/api-erros.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Public } from '../auth/auth.decorators.js';
import { HealthResponseDto } from './dto/health-response.dto.js';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Verifica se a API está no ar e alcança o banco (usado pelo healthcheck do Docker). */
  @Get()
  @ApiErros({ 503: 'Banco de dados indisponível' })
  async check(): Promise<HealthResponseDto> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (erro) {
      this.logger.error(
        `Banco indisponível: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
      throw new ServiceUnavailableException('Banco de dados indisponível.');
    }

    return {
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
