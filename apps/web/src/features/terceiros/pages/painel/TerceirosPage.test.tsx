import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { TerceirosPage } from './TerceirosPage';

const rotas = [{ path: '/painel/terceiros', element: <TerceirosPage /> }];
const FROTA = {
  id_terceiro: 't1',
  tipo: 'FROTA',
  nome_razao_social: 'Translados Boa Viagem',
  cpf_cnpj: '12345678000190',
  telefone: null,
  email: 'contato@boaviagem.com.br',
  area_atuacao: { ufs: ['SP'], cidades: [] },
  categorias_atendidas: [],
  status: 'ATIVO',
};

beforeEach(() => {
  servidor.use(
    http.get('*/api/v1/gestao/terceiros', ({ request }) => {
      const tipo = new URL(request.url).searchParams.get('tipo');
      const itens = !tipo || tipo === 'FROTA' ? [FROTA] : [];
      return HttpResponse.json({ itens, pagina: 1, tamanho: 20, total: itens.length });
    }),
    http.get('*/api/v1/gestao/catalogo/categorias', () =>
      HttpResponse.json([{ id_categoria: 'cat-flores', nome: 'Flores', ordem: 1, ativo: true }]),
    ),
  );
  entrarComo('FUNERARIA');
});

describe('TerceirosPage', () => {
  it('filtra por tipo', async () => {
    const { usuario } = renderizar(rotas, { caminho: '/painel/terceiros' });

    expect(await screen.findByText('Translados Boa Viagem')).toBeInTheDocument();
    await usuario.click(screen.getByRole('radio', { name: 'Fornecedor' }));

    expect(await screen.findByText('Nenhum parceiro por aqui')).toBeInTheDocument();
  });

  it('convida um fornecedor com área de atuação e categorias', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/gestao/terceiros', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ ...FROTA, id_terceiro: 't2' }, { status: 201 });
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/painel/terceiros' });

    await usuario.click(await screen.findByRole('button', { name: /convidar parceiro/i }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.selectOptions(within(dialogo).getByLabelText('Tipo'), 'FORNECEDOR');
    await usuario.type(within(dialogo).getByLabelText('E-mail do convite'), 'pedidos@floripe.com');
    await usuario.type(within(dialogo).getByLabelText('Nome ou razão social'), 'Floricultura Ipê');
    await usuario.type(within(dialogo).getByLabelText('CPF ou CNPJ'), '12.345.678/0001-90');
    await usuario.click(within(dialogo).getByRole('button', { name: 'SP' }));
    await usuario.click(within(dialogo).getByRole('button', { name: 'Flores' }));
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cadastrar e convidar' }));

    await waitFor(() =>
      expect(corpo).toEqual({
        tipo: 'FORNECEDOR',
        email: 'pedidos@floripe.com',
        nome_razao_social: 'Floricultura Ipê',
        cpf_cnpj: '12345678000190',
        telefone: null,
        area_atuacao: { ufs: ['SP'], cidades: [] },
        categorias_atendidas: ['cat-flores'],
      }),
    );
  });
});
