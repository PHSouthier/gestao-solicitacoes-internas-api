import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

const HEADER_REQUEST_ID = 'x-request-id';
const ID_VALIDO = /^[\w.:-]{1,128}$/;

export type RequestComId = Request & { id?: string };

/**
 * Dá um id a cada requisição (reaproveita o `x-request-id` recebido, se for válido)
 * e devolve no header da resposta. Ajuda a achar a requisição nos logs.
 */
export function requestIdMiddleware(
  req: RequestComId,
  res: Response,
  next: NextFunction,
): void {
  const recebido = req.headers[HEADER_REQUEST_ID];
  req.id =
    typeof recebido === 'string' && ID_VALIDO.test(recebido)
      ? recebido
      : randomUUID();

  res.setHeader(HEADER_REQUEST_ID, req.id);
  next();
}
