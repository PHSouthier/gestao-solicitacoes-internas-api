import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AreaResponseDto } from './dto/area-response.dto.js';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  listarAtivas(): Promise<AreaResponseDto[]> {
    return this.prisma.area.findMany({
      where: { ativo: true },
      orderBy: [{ exigeComplemento: 'asc' }, { nome: 'asc' }],
      select: { id: true, nome: true, exigeComplemento: true },
    });
  }
}
