import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListarSolicitacoesQuery } from './listar-solicitacoes.dto.js';

async function validar(query: Record<string, unknown>) {
  const dto = plainToInstance(ListarSolicitacoesQuery, query);
  const erros = await validate(dto);
  return { dto, campos: erros.map((erro) => erro.property) };
}

describe('ListarSolicitacoesQuery', () => {
  it('sem parâmetros, usa os padrões', async () => {
    const { dto, campos } = await validar({});

    expect(campos).toEqual([]);
    expect(dto).toMatchObject({
      ordenarPor: 'dataSolicitacao',
      ordem: 'desc',
      pagina: 1,
      tamanhoPagina: 10,
    });
  });

  it('aceita vários status separados por vírgula ou repetidos na URL', async () => {
    const porVirgula = await validar({ status: 'ABERTA, EM_ANALISE' });
    const repetidos = await validar({ status: ['ABERTA', 'APROVADA'] });

    expect(porVirgula.dto.status).toEqual(['ABERTA', 'EM_ANALISE']);
    expect(repetidos.dto.status).toEqual(['ABERTA', 'APROVADA']);
  });

  it('converte os números que chegam como texto na URL', async () => {
    const { dto } = await validar({
      pagina: '2',
      tamanhoPagina: '20',
      areaId: '9',
    });

    expect(dto).toMatchObject({ pagina: 2, tamanhoPagina: 20, areaId: 9 });
  });

  it.each([
    ['status inexistente', { status: 'ABERTA,PERDIDA' }, 'status'],
    ['página zero', { pagina: '0' }, 'pagina'],
    ['página grande demais', { tamanhoPagina: '101' }, 'tamanhoPagina'],
    ['ordenação desconhecida', { ordenarPor: 'senha' }, 'ordenarPor'],
    ['data inválida', { dataInicio: '2026-13-01' }, 'dataInicio'],
  ])('rejeita %s', async (_caso, query, campo) => {
    expect((await validar(query)).campos).toEqual([campo]);
  });
});
