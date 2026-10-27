import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { servidor } from '@/test/setup';
import { CadastroFuneraria } from './CadastroFuneraria';

const EM_USO = new Set(['demo']);

beforeEach(() => {
  // Endereço em uso responde 200 na identidade visual; livre responde 404.
  servidor.use(
    http.get('*/api/v1/tenant/configuracoes', ({ request }) =>
      EM_USO.has(request.headers.get('X-Tenant') ?? '')
        ? HttpResponse.json({ slug: 'demo' })
        : HttpResponse.json({ detail: 'Funerária não encontrada.' }, { status: 404 }),
    ),
  );
});

function renderizar() {
  const usuario = userEvent.setup();
  render(
    <CadastroFuneraria dominioBase="localhost" urlPainel="http://localhost:5173/equipe/entrar" />,
  );
  return usuario;
}

async function preencherEmpresa(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Nome fantasia'), 'Funerária São José');
  await usuario.type(screen.getByLabelText('Razão social'), 'São José Serviços Funerários Ltda.');
  await usuario.type(screen.getByLabelText('CNPJ'), '11222333000181');
  await usuario.type(screen.getByLabelText('Telefone'), '1133334444');
  await usuario.type(screen.getByLabelText('E-mail de contato'), 'contato@saojose.com.br');
  await usuario.click(screen.getByRole('button', { name: /continuar/i }));
}

describe('CadastroFuneraria', () => {
  it('valida a etapa da empresa antes de avançar', async () => {
    const usuario = renderizar();
    await usuario.click(screen.getByRole('button', { name: /continuar/i }));

    expect(await screen.findByText('Nome fantasia é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('CNPJ não informado ou em formato inválido.')).toBeInTheDocument();
  });

  it('sugere o endereço e verifica a disponibilidade enquanto digita', async () => {
    const usuario = renderizar();
    await preencherEmpresa(usuario);

    const slug = await screen.findByLabelText('Endereço da sua landing');
    expect(slug).toHaveValue('funeraria-sao-jose');
    expect(await screen.findByText('Endereço disponível')).toBeInTheDocument();

    await usuario.clear(slug);
    await usuario.type(slug, 'demo');
    expect(await screen.findByText('Este endereço já está em uso')).toBeInTheDocument();
  });

  it('cadastra e mostra que a funerária aguarda aprovação', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/onboarding/funerarias', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json(
          { id_tenant: 't1', slug: 'funeraria-sao-jose', status: 'PENDENTE' },
          { status: 201 },
        );
      }),
    );
    const usuario = renderizar();
    await preencherEmpresa(usuario);
    await screen.findByText('Endereço disponível');
    await usuario.click(screen.getByRole('button', { name: /continuar/i }));

    await usuario.type(await screen.findByLabelText('Nome do gestor'), 'José Lima');
    await usuario.type(screen.getByLabelText('E-mail do gestor'), 'jose@saojose.com.br');
    await usuario.click(screen.getByLabelText(/termos de uso/i));
    await usuario.click(screen.getByRole('button', { name: /cadastrar funerária/i }));

    expect(await screen.findByText('Cadastro recebido!')).toBeInTheDocument();
    expect(screen.getByText(/aguardando aprovação/)).toBeInTheDocument();
    expect(corpo).toEqual({
      nome_fantasia: 'Funerária São José',
      razao_social: 'São José Serviços Funerários Ltda.',
      cnpj: '11222333000181',
      email_contato: 'contato@saojose.com.br',
      telefone: '(11) 3333-4444',
      slug: 'funeraria-sao-jose',
      gestor: { nome: 'José Lima', email: 'jose@saojose.com.br' },
    });
  });

  it('volta para a etapa do CNPJ quando ele já está cadastrado', async () => {
    servidor.use(
      http.post('*/api/v1/onboarding/funerarias', () =>
        HttpResponse.json(
          { status: 409, detail: 'CNPJ já cadastrado.', code: 'Tenant.CnpjDuplicado' },
          { status: 409 },
        ),
      ),
    );
    const usuario = renderizar();
    await preencherEmpresa(usuario);
    await screen.findByText('Endereço disponível');
    await usuario.click(screen.getByRole('button', { name: /continuar/i }));
    await usuario.type(await screen.findByLabelText('Nome do gestor'), 'José Lima');
    await usuario.type(screen.getByLabelText('E-mail do gestor'), 'jose@saojose.com.br');
    await usuario.click(screen.getByLabelText(/termos de uso/i));
    await usuario.click(screen.getByRole('button', { name: /cadastrar funerária/i }));

    await waitFor(() => expect(screen.getByLabelText('CNPJ')).toBeInTheDocument());
    expect(screen.getByText('CNPJ já cadastrado.')).toBeInTheDocument();
  });
});
