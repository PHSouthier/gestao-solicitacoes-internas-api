import { type INestApplication, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';

export function configurarApp(app: INestApplication): void {
  app.use(requestIdMiddleware);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
}
