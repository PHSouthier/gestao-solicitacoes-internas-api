import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { hoje } from '../../../common/validators/data.js';
import { CriarSolicitacaoDto } from './criar-solicitacao.dto.js';

async function validar(body: Record<string, unknown>) {
  const dto = plainToInstance(CriarSolicitacaoDto, body);
  const erros = await validate(dto);
  return { dto, campos: erros.map((erro) => erro.property) };
}

describe('CriarSolicitacaoDto', () => {
  const valido = {
    titulo: 'Compra de notebooks',
    descricao: 'Cinco notebooks para os novos vendedores.',
    nomeSolicitante: 'Maria Souza',
    areaId: 9,
    prioridade: 'ALTA',
  };

  it('aceita dados válidos (data e complemento são opcionais)', async () => {
    expect((await validar(valido)).campos).toEqual([]);
  });

  it('apara os espaços dos textos', async () => {
    const { dto } = await validar({ ...valido, titulo: '  Notebooks  ' });

    expect(dto.titulo).toBe('Notebooks');
  });

  it('aceita a data de hoje', async () => {
    expect(
      (await validar({ ...valido, dataSolicitacao: hoje() })).campos,
    ).toEqual([]);
  });

  it.each([
    ['título curto', { titulo: 'ab' }, 'titulo'],
    ['descrição curta', { descricao: 'curta' }, 'descricao'],
    ['sem área', { areaId: undefined }, 'areaId'],
    ['prioridade inválida', { prioridade: 'URGENTE' }, 'prioridade'],
    ['data futura', { dataSolicitacao: '2999-01-01' }, 'dataSolicitacao'],
    [
      'data em outro formato',
      { dataSolicitacao: '05/10/2026' },
      'dataSolicitacao',
    ],
  ])('rejeita %s', async (_caso, alteracao, campo) => {
    expect((await validar({ ...valido, ...alteracao })).campos).toEqual([
      campo,
    ]);
  });
});
