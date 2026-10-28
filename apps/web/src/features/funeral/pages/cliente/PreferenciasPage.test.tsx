import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { PreferenciasPage } from './PreferenciasPage';

const item = (id: string, nome: string, preco: number, variacoes: unknown[] = []) => ({
  id_item: id,
  id_categoria: 'cat-flores',
  nome,
  descricao: null,
  preco,
  controla_estoque: false,
  quantidade_estoque: null,
  imagem_url: null,
  ativo: true,
  variacoes,
});

const rotas = [{ path: '/minha-conta/preferencias', element: <PreferenciasPage /> }];
let salvo: { id: string; corpo: unknown } | undefined;

beforeEach(() => {
  salvo = undefined;
  servidor.use(
    http.get('*/api/v1/clientes/me', () =>
      HttpResponse.json({ id_cliente: 'cl1', nome: 'Ana Souza', cpf: '52998224725' }),
    ),
    http.get('*/api/v1/dependentes', () => HttpResponse.json([])),
    http.get('*/api/v1/preferencias-funeral', () => HttpResponse.json([])),
    http.put('*/api/v1/preferencias-funeral/:id', async ({ request, params }) => {
      salvo = { id: String(params.id), corpo: await request.json() };
      return HttpResponse.json({ ...(salvo.corpo as object), id_pessoa: params.id });
    }),
    http.get('*/api/v1/contratos', () =>
      HttpResponse.json([{ id_contrato: 'c1', id_plano: 'p1', status: 'ATIVO' }]),
    ),
    http.get('*/api/v1/contratos/c1', () =>
      HttpResponse.json({
        id_contrato: 'c1',
        id_plano: 'p1',
        pessoas_cobertas: [{ id_pessoa_coberta: 'pc1', tipo: 'TITULAR', id_dependente: null }],
      }),
    ),
    http.get('*/api/v1/planos/p1', () =>
      HttpResponse.json({
        id_plano: 'p1',
        nome: 'Acolher',
        coberturas: [{ id_item_catalogo: 'i1' }],
      }),
    ),
    http.get('*/api/v1/catalogo/categorias', () =>
      HttpResponse.json([{ id_categoria: 'cat-flores', nome: 'Flores', ordem: 1, ativo: true }]),
    ),
    http.get('*/api/v1/catalogo', () =>
      HttpResponse.json([
        item('i1', 'Arranjo de rosas brancas', 180),
        item('i2', 'Coroa de flores do campo', 350, [
          { id_variacao: 'v1', nome: 'Grande', acrescimo_preco: 120, ativo: true },
        ]),
      ]),
    ),
  );
  entrarComo('CLIENTE');
});

describe('PreferenciasPage', () => {
  it('indica o que o plano cobre, soma os adicionais e salva', async () => {
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/preferencias' });

    const flores = await screen.findByRole('region', { name: 'Flores' });
    expect(within(flores).getByText('Coberto pelo plano')).toBeInTheDocument();
    expect(within(flores).getByText('Adicional · R$ 350,00')).toBeInTheDocument();
    expect(screen.getByText('Coberto pelo plano Acolher.')).toBeInTheDocument();

    await usuario.click(screen.getByRole('radio', { name: 'Cremação' }));
    await usuario.click(within(flores).getByRole('checkbox', { name: /rosas brancas/i }));
    await usuario.click(within(flores).getByRole('checkbox', { name: /flores do campo/i }));
    await usuario.selectOptions(
      within(flores).getByRole('combobox', { name: /opção de coroa/i }),
      'v1',
    );

    // A coroa não é coberta (350) e a variação grande soma 120. As rosas são cobertas.
    const resumo = screen.getByRole('complementary');
    expect(resumo).toHaveTextContent('R$ 470,00');

    await usuario.click(within(resumo).getByRole('button', { name: 'Salvar preferências' }));

    await waitFor(() => expect(salvo).toBeDefined());
    expect(salvo).toEqual({
      id: 'cl1',
      corpo: {
        destino: 'CREMACAO',
        cerimonia: null,
        itens: [
          { id_item_catalogo: 'i1', id_variacao: null },
          { id_item_catalogo: 'i2', id_variacao: 'v1' },
        ],
        musicas: null,
        observacoes: null,
      },
    });
  });
});
