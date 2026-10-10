import { registerDecorator, type ValidationOptions } from 'class-validator';

const FUSO = 'America/Sao_Paulo';

/** Data de hoje no fuso da empresa, no formato AAAA-MM-DD. */
export function hoje(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(
    new Date(),
  );
}

/** AAAA-MM-DD → Date (meia-noite UTC, como o Postgres guarda o tipo date). */
export function paraData(valor: string): Date {
  return new Date(`${valor}T00:00:00.000Z`);
}

/** Date → AAAA-MM-DD. */
export function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Validador: a data (AAAA-MM-DD) não pode ser depois de hoje. */
export function NaoFutura(opcoes?: ValidationOptions) {
  return (objeto: object, propriedade: string) =>
    registerDecorator({
      name: 'naoFutura',
      target: objeto.constructor,
      propertyName: propriedade,
      options: opcoes,
      validator: {
        validate: (valor: unknown) =>
          typeof valor !== 'string' || valor <= hoje(),
      },
    });
}
