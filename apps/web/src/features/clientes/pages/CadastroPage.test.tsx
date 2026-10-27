import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { servidor } from '@/test/setup';
import { CadastroPage } from './CadastroPage';

const rotas = [
  { path: '/cadastro', element: <CadastroPage /> },
  { path: '/cadastro/concluido', element: <p>Confirme seu e-mail</p> },
];

type Usuario = ReturnType<typeof renderizar>['usuario'];

async function preencherAteOAcesso(usuario: Usuario) {
  await usuario.type(screen.getByLabelText('Como podemos chamar você?'), 'Mariana Lima');
  await usuario.type(screen.getByLabelText('CPF'), '52998224725');
  await usuario.type(screen.getByLabelText('Data de nascimento'), '12051980');
  await usuario.type(screen.getByLabelText('Celular com DDD'), '11988887777');
  await usuario.click(screen.getByRole('button', { name: /continuar/i }));

  // O CEP completo preenche endereço, cidade e UF pela ViaCEP (simulada no beforeEach).
  await usuario.type(await screen.findByLabelText('CEP'), '01310100');
  await waitFor(() => expect(screen.getByLabelText('Cidade')).toHaveValue('São Paulo'));
  expect(screen.getByLabelText('Endereço')).toHaveValue('Avenida Paulista, Bela Vista');
  expect(screen.getByLabelText('UF')).toHaveValue('SP');
  await usuario.click(screen.getByRole('button', { name: /continuar/i }));

  await usuario.type(await screen.findByLabelText('Seu melhor e-mail'), 'mariana@email.com');
  await usuario.type(screen.getByLabelText('Crie uma senha'), 'Senha@123');
  await usuario.type(screen.getByLabelText('Confirme sua senha'), 'Senha@123');
  await usuario.click(screen.getByLabelText(/li e concordo/i));
}

describe('CadastroPage', () => {
  beforeEach(() => {
    servidor.use(
      http.get('https://viacep.com.br/ws/:cep/json/', () =>
        HttpResponse.json({
          logradouro: 'Avenida Paulista',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
        }),
      ),
    );
  });

  it('não avança enquanto a etapa tem erros', async () => {
    const { usuario } = renderizar(rotas, { caminho: '/cadastro' });

    await usuario.click(screen.getByRole('button', { name: /continuar/i }));

    expect(await screen.findByText('Nome não informado.')).toBeInTheDocument();
    expect(screen.getByText('CPF não informado ou em formato inválido.')).toBeInTheDocument();
    expect(screen.getByLabelText('Como podemos chamar você?')).toBeInTheDocument();
  });

  it('mostra as regras da senha enquanto a pessoa digita', async () => {
    const { usuario } = renderizar(rotas, { caminho: '/cadastro' });
    await preencherAteOAcesso(usuario);

    const regras = screen.getByRole('list', { name: 'Regras da senha' });
    expect(regras).toHaveTextContent('8 caracteres ou mais(cumprida)');
    expect(regras).toHaveTextContent('Um símbolo (ex.: @, #, !)(cumprida)');
  });

  it('cadastra e leva para a confirmação do e-mail', async () => {
    let corpo: Record<string, unknown> | undefined;
    servidor.use(
      http.post('*/api/v1/clientes', async ({ request }) => {
        corpo = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id_cliente: 'c1' }, { status: 201 });
      }),
    );
    const { usuario, router } = renderizar(rotas, { caminho: '/cadastro?plano=p1' });

    await preencherAteOAcesso(usuario);
    await usuario.click(screen.getByRole('button', { name: /criar meu perfil/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/cadastro/concluido'));
    expect(router.state.location.search).toBe('?email=mariana%40email.com&plano=p1');
    expect(corpo).toMatchObject({
      nome: 'Mariana Lima',
      data_nascimento: '1980-05-12',
      estado: 'SP',
      email: 'mariana@email.com',
    });
  });

  it('mostra o CPF já cadastrado no campo, voltando para a etapa dele', async () => {
    servidor.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          { status: 409, detail: 'CPF já cadastrado.', code: 'Cliente.CpfDuplicado' },
          { status: 409 },
        ),
      ),
    );
    const { usuario } = renderizar(rotas, { caminho: '/cadastro' });

    await preencherAteOAcesso(usuario);
    await usuario.click(screen.getByRole('button', { name: /criar meu perfil/i }));

    expect(await screen.findByText('CPF já cadastrado.')).toBeInTheDocument();
    expect(screen.getByLabelText('CPF')).toHaveAttribute('aria-invalid', 'true');
  });
});
