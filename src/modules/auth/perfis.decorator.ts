import { SetMetadata } from '@nestjs/common';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';

export const PERFIS_KEY = 'perfis';

export const Perfis = (...perfis: PerfilUsuario[]) =>
  SetMetadata(PERFIS_KEY, perfis);
