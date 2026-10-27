import { getLoginMockHandler } from '@ampara/api-client/mocks';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { respostaDeLogin } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { LoginEquipePage } from './LoginEquipePage';

const rotas = [
  { path: '/equipe/entrar', element: <LoginEquipePage /> },
  { path: '/painel', element: <p>Área da funerária</p> },
  { path: '/painel/agenda', element: <p>Agenda</p> },
];

async function preencherEEnviar(usuario: ReturnType<typeof renderizar>['usuario']) {
  await usuario.type(screen.getByLabelText('E-mail corporativo'), 'ana@demo.localhost');
  await usuario.type(screen.getByLabelText('Senha'), 'Senha@123');
  await usuario.click(screen.getByRole('button', { name: /entrar no portal/i }));
}

describe('LoginEquipePage', () => {
  it('valida os campos antes de chamar a API', async () => {
    const { usuario } = renderizar(rotas, { caminho: '/equipe/entrar' });

    await usuario.click(screen.getByRole('button', { name: /entrar no portal/i }));

    expect(await screen.findByText('E-mail é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Senha é obrigatória.')).toBeInTheDocument();
  });

  it('entra e vai para a área do perfil', async () => {
    servidor.use(getLoginMockHandler(respostaDeLogin('FUNCIONARIO')));
    const { usuario, router } = renderizar(rotas, { caminho: '/equipe/entrar' });

    await preencherEEnviar(usuario);

    await waitFor(() => expect(router.state.location.pathname).toBe('/painel'));
  });

  it('volta para a página que pediu o login', async () => {
    servidor.use(getLoginMockHandler(respostaDeLogin('FUNERARIA')));
    const { usuario, router } = renderizar(rotas, {
      caminho: '/equipe/entrar?voltar=%2Fpainel%2Fagenda',
    });

    await preencherEEnviar(usuario);

    await waitFor(() => expect(router.state.location.pathname).toBe('/painel/agenda'));
  });

  it('mostra o erro da API quando as credenciais estão erradas', async () => {
    servidor.use(
      http.post('*/api/v1/auth/login', () =>
        HttpResponse.json(
          { status: 401, detail: 'E-mail ou senha inválidos.', code: 'Auth.CredenciaisInvalidas' },
          { status: 401 },
        ),
      ),
    );
    const { usuario, router } = renderizar(rotas, { caminho: '/equipe/entrar' });

    await preencherEEnviar(usuario);

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
    expect(router.state.location.pathname).toBe('/equipe/entrar');
  });

  it('o card de demonstração preenche o e-mail', async () => {
    const { usuario } = renderizar(rotas, { caminho: '/equipe/entrar' });

    await usuario.click(screen.getByRole('button', { name: /administrador/i }));

    expect(screen.getByLabelText('E-mail corporativo')).toHaveValue('gestor@demo.localhost');
  });
});
