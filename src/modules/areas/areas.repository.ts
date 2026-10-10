import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AreaResponseDto } from './dto/area-response.dto.js';

/** Acesso ao banco das áreas. */
@Injectable()
export class AreasRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Áreas ativas em ordem alfabética, com "Outras" por último. */
  listarAtivas(): Promise<AreaResponseDto[]> {
    return this.prisma.area.findMany({
      where: { ativo: true },
      orderBy: [{ exigeComplemento: 'asc' }, { nome: 'asc' }],
      select: { id: true, nome: true, exigeComplemento: true },
    });
  }
}
