import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CriarUsuarioDto } from './criar-usuario.dto.js';

async function validar(body: Record<string, unknown>) {
  const dto = plainToInstance(CriarUsuarioDto, body);
  const erros = await validate(dto);
  return { dto, campos: erros.map((erro) => erro.property) };
}

describe('CriarUsuarioDto', () => {
  const valido = {
    nome: 'Maria Souza',
    email: 'maria@empresa.com',
    senha: 'Senha@123',
  };

  it('aceita dados válidos', async () => {
    expect((await validar(valido)).campos).toEqual([]);
  });

  it('normaliza o e-mail (minúsculas, sem espaços) e apara o nome', async () => {
    const { dto, campos } = await validar({
      ...valido,
      nome: '  Maria Souza ',
      email: '  Maria@Empresa.COM ',
    });

    expect(campos).toEqual([]);
    expect(dto.nome).toBe('Maria Souza');
    expect(dto.email).toBe('maria@empresa.com');
  });

  it.each([
    ['nome curto', { nome: 'M' }, 'nome'],
    ['e-mail inválido', { email: 'maria' }, 'email'],
    ['senha curta', { senha: 'Ab1' }, 'senha'],
    ['senha sem número', { senha: 'SomenteLetras' }, 'senha'],
    ['senha sem letra', { senha: '12345678' }, 'senha'],
  ])('rejeita %s', async (_caso, alteracao, campo) => {
    expect((await validar({ ...valido, ...alteracao })).campos).toEqual([
      campo,
    ]);
  });
});
