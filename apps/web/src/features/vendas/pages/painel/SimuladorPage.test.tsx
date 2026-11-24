import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo, respostaDeLogin } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { SimuladorPage } from './SimuladorPage';

const plano = (id: string, nome: string, mensal: number, anual: number) => ({
  id_plano: id,
  nome,
  descricao: `Plano ${nome}`,
  valor_mensal: mensal,
  valor_anual: anual,
  valor_dependente_mensal: 10,
  valor_dependente_anual: 100,
  carencia_dias: 60,
  limite_dependentes: 2,
  ativo: true,
});

beforeEach(() => {
  servidor.use(
    http.post('*/api/v1/auth/refresh', () => HttpResponse.json(respostaDeLogin('CONSULTOR'))),
    http.get('*/api/v1/planos', () =>
      HttpResponse.json([
        plano('p1', 'Essencial', 39, 400),
        plano('p2', 'Acolher', 69, 700),
        plano('p3', 'Legado', 119, 1200),
      ]),
    ),
    http.get('*/api/v1/catalogo', () =>
      HttpResponse.json([
        {
          id_item: 'i1',
          id_categoria: 'c1',
          nome: 'Coroa de flores',
          descricao: null,
          preco: 560,
          controla_estoque: false,
          quantidade_estoque: null,
          imagem_url: null,
          ativo: true,
          variacoes: [],
          id_terceiro_fornecedor: null,
        },
      ]),
    ),
    http.get('*/api/v1/gestao/clientes', () =>
      HttpResponse.json({
        itens: [{ id_cliente: 'cl1', nome: 'Mariana Costa', cpf: '***', email: 'm@x.com' }],
        pagina: 1,
        tamanho: 100,
        total: 1,
      }),
    ),
  );
});

describe('SimuladorPage', () => {
  it('soma plano, dependentes e avulsos e leva à contratação do cliente', async () => {
    entrarComo('CONSULTOR');
    const { usuario, router } = renderizar(
      [
        { path: '/painel/simulador', element: <SimuladorPage /> },
        { path: '/painel/clientes/:id/contratar', element: <p>Contratação</p> },
      ],
      { caminho: '/painel/simulador' },
    );

    // Começa no plano do meio, anual.
    const resumo = await screen.findByText('Resumo da simulação');
    const aside = resumo.closest('aside')!;
    expect(within(aside).getByText('Plano Acolher')).toBeInTheDocument();
    expect(within(aside).getByText(/R\$\s?700,00/)).toBeInTheDocument();

    await usuario.click(screen.getByRole('radio', { name: /Legado/ }));
    await usuario.click(screen.getByRole('radio', { name: 'Mensal' }));
    await usuario.click(screen.getByRole('button', { name: 'Mais um dependente' }));
    // R$ 119 + 1 dependente de R$ 10.
    expect(within(aside).getByText(/R\$\s?129,00/)).toBeInTheDocument();

    await usuario.click(await screen.findByRole('checkbox'));
    expect(within(aside).getByText('Total avulsos')).toBeInTheDocument();

    const seguir = within(aside).getByRole('button', { name: /seguir para a contratação/i });
    expect(seguir).toBeDisabled();
    await usuario.selectOptions(
      await within(aside).findByRole('combobox'),
      await within(aside).findByRole('option', { name: 'Mariana Costa' }),
    );
    await usuario.click(seguir);

    expect(router.state.location.pathname).toBe('/painel/clientes/cl1/contratar');
    expect(router.state.location.search).toBe('?plano=p3&periodicidade=MENSAL');
  });
});
