import { type INestApplication, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';

/** Configuração comum à aplicação real (main.ts) e aos testes e2e. */
export function configurarApp(app: INestApplication): void {
  app.use(requestIdMiddleware);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
}
