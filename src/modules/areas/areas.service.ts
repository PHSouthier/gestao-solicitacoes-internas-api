import { Injectable } from '@nestjs/common';
import { AreasRepository } from './areas.repository.js';
import type { AreaResponseDto } from './dto/area-response.dto.js';

@Injectable()
export class AreasService {
  constructor(private readonly repositorio: AreasRepository) {}

  listarAtivas(): Promise<AreaResponseDto[]> {
    return this.repositorio.listarAtivas();
  }
}
