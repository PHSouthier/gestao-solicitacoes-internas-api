import { registerDecorator, type ValidationOptions } from 'class-validator';

const FUSO = 'America/Sao_Paulo';

export function hoje(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(
    new Date(),
  );
}

export function paraData(valor: string): Date {
  return new Date(`${valor}T00:00:00.000Z`);
}

export function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10);
}

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
