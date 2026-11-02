import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { CatalogoPage } from './CatalogoPage';

const rotas = [{ path: '/painel/catalogo', element: <CatalogoPage /> }];
const CATEGORIAS = [
  { id_categoria: 'c1', nome: 'Urna', ordem: 1, ativo: true },
  { id_categoria: 'c2', nome: 'Flores', ordem: 2, ativo: true },
];
const ITEM = {
  id_item: 'i1',
  id_categoria: 'c2',
  nome: 'Coroa de flores',
  descricao: null,
  preco: 350,
  controla_estoque: false,
  quantidade_estoque: null,
  imagem_url: null,
  ativo: true,
  variacoes: [],
};

beforeEach(() => {
  servidor.use(
    http.get('*/api/v1/gestao/catalogo/categorias', () => HttpResponse.json(CATEGORIAS)),
    http.get('*/api/v1/gestao/catalogo', () => HttpResponse.json([ITEM])),
    http.get('*/api/v1/gestao/terceiros', () =>
      HttpResponse.json({ itens: [], pagina: 1, tamanho: 100, total: 0 }),
    ),
  );
  entrarComo('FUNERARIA');
});

describe('CatalogoPage', () => {
  it('lista os itens e cria um item novo com estoque', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/gestao/catalogo', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ ...ITEM, id_item: 'i2' }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/painel/catalogo' });

    expect(await screen.findByText('Coroa de flores')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: /novo item/i }));

    const dialogo = await screen.findByRole('dialog');
    await usuario.type(within(dialogo).getByLabelText('Nome'), 'Urna ecológica');
    await usuario.selectOptions(within(dialogo).getByLabelText('Categoria'), 'c1');
    await usuario.type(within(dialogo).getByLabelText('Preço (R$)'), '1400');
    await usuario.click(within(dialogo).getByLabelText('Controlar estoque'));
    await usuario.type(within(dialogo).getByLabelText('Quantidade em estoque'), '5');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Salvar item' }));

    await waitFor(() =>
      expect(corpo).toEqual({
        id_categoria: 'c1',
        nome: 'Urna ecológica',
        descricao: null,
        preco: 1400,
        controla_estoque: true,
        quantidade_estoque: 5,
      }),
    );
  });

  it('desativa um item', async () => {
    let status: unknown;
    servidor.use(
      http.patch('*/api/v1/gestao/catalogo/i1/status', async ({ request }) => {
        status = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/painel/catalogo' });

    const linha = (await screen.findByText('Coroa de flores')).closest('tr')!;
    await usuario.click(within(linha).getByRole('button', { name: 'Desativar' }));

    await waitFor(() => expect(status).toEqual({ ativo: false }));
  });
});
