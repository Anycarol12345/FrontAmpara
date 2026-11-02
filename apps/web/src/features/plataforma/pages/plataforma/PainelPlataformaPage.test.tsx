import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo, respostaDeLogin } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { PainelPlataformaPage } from './PainelPlataformaPage';

const rotas = [{ path: '/admin', element: <PainelPlataformaPage /> }];
const PENDENTE = {
  id_tenant: 't1',
  nome_fantasia: 'Funerária São José',
  razao_social: 'São José Serviços Póstumos Ltda',
  cnpj: '11222333000181',
  slug: 'sao-jose',
  email_contato: 'contato@saojose.com.br',
  status: 'PENDENTE',
  origem_cadastro: 'AUTO',
  criada_em: '2026-10-30T10:00:00Z',
};

beforeEach(() => {
  servidor.use(
    // A restauração da sessão roda no primeiro teste do arquivo: sem ela, o 401 limparia o cache.
    http.post('*/api/v1/auth/refresh', () => HttpResponse.json(respostaDeLogin('ADMIN'))),
    http.get('*/api/v1/admin/tenants', ({ request }) => {
      const status = new URL(request.url).searchParams.get('status');
      const itens = !status || status === 'PENDENTE' ? [PENDENTE] : [];
      return HttpResponse.json({ itens, pagina: 1, tamanho: 20, total: itens.length });
    }),
  );
  entrarComo('ADMIN');
});

describe('PainelPlataformaPage', () => {
  it('aprova um auto-cadastro com confirmação', async () => {
    let corpo: unknown;
    servidor.use(
      http.patch('*/api/v1/admin/tenants/t1/status', async ({ request }) => {
        corpo = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/admin' });

    expect(await screen.findByText('11.222.333/0001-81', { exact: false })).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Aprovar' }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Liberar' }));

    await waitFor(() => expect(corpo).toEqual({ status: 'ATIVA' }));
  });

  it('cadastra uma funerária sugerindo o endereço pelo nome', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/admin/tenants', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json(
          { id_tenant: 't2', slug: 'funeraria-boa-paz', status: 'ATIVA' },
          { status: 201 },
        );
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/admin' });

    await usuario.click(await screen.findByRole('button', { name: /cadastrar funerária/i }));
    const dialogo = await screen.findByRole('dialog');
    const campo = (rotulo: string) => within(dialogo).getByLabelText(rotulo);
    await usuario.type(campo('Nome fantasia'), 'Funerária Boa Paz');
    expect(campo('Endereço')).toHaveValue('funeraria-boa-paz');
    await usuario.type(campo('Razão social'), 'Boa Paz Ltda');
    await usuario.type(campo('CNPJ'), '11222333000181');
    await usuario.type(campo('E-mail de contato'), 'contato@boapaz.com.br');
    await usuario.type(campo('Telefone'), '1133334444');
    await usuario.type(campo('Nome do gestor'), 'Marcos Lima');
    await usuario.type(campo('E-mail do gestor'), 'marcos@boapaz.com.br');
    await usuario.click(within(dialogo).getByRole('button', { name: /cadastrar e convidar/i }));

    await waitFor(() =>
      expect(corpo).toEqual({
        nome_fantasia: 'Funerária Boa Paz',
        razao_social: 'Boa Paz Ltda',
        cnpj: '11222333000181',
        email_contato: 'contato@boapaz.com.br',
        telefone: '1133334444',
        slug: 'funeraria-boa-paz',
        gestor: { nome: 'Marcos Lima', email: 'marcos@boapaz.com.br' },
      }),
    );
  });
});
