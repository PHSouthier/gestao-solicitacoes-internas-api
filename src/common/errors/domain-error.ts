import { HttpStatus } from '@nestjs/common';

export interface DetalheErro {
  field: string;
  messages: string[];
}

interface DomainErrorOptions {
  code: string;
  message: string;
  httpStatus?: HttpStatus;
  details?: DetalheErro[];
}

export class DomainError extends Error {
  readonly code: string;
  readonly httpStatus: HttpStatus;
  readonly details: DetalheErro[];

  constructor({
    code,
    message,
    httpStatus = HttpStatus.CONFLICT,
    details = [],
  }: DomainErrorOptions) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}
