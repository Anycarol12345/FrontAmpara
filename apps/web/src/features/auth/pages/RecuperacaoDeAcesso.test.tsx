import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { servidor } from '@/test/setup';
import { ConfirmarEmailPage } from './ConfirmarEmailPage';
import { RedefinirSenhaPage } from './DefinirSenhaPage';
import { LoginClientePage } from './LoginClientePage';
import { RecuperarSenhaPage } from './RecuperarSenhaPage';

const rotas = [
  { path: '/entrar', element: <LoginClientePage /> },
  { path: '/recuperar-senha', element: <RecuperarSenhaPage /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },
  { path: '/confirmar-email', element: <ConfirmarEmailPage /> },
];

describe('Esqueci minha senha', () => {
  it('confirma o envio sem dizer se o e-mail existe', async () => {
    servidor.use(
      http.post('*/api/v1/auth/esqueci-senha', () => new HttpResponse(null, { status: 204 })),
    );
    const { usuario } = renderizar(rotas, { caminho: '/recuperar-senha' });

    await usuario.type(screen.getByLabelText('E-mail'), 'ana@email.com');
    await usuario.click(screen.getByRole('button', { name: /enviar link/i }));

    expect(await screen.findByText('Confira seu e-mail')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Se houver uma conta para ana@email.com');
  });
});

describe('Redefinir senha', () => {
  it('sem token, avisa que o link está incompleto', () => {
    renderizar(rotas, { caminho: '/redefinir-senha' });
    expect(screen.getByText('Link incompleto')).toBeInTheDocument();
  });

  it('troca a senha com o token do link', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/auth/redefinir-senha', async ({ request }) => {
        corpo = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/redefinir-senha?token=abc' });

    await usuario.type(screen.getByLabelText('Senha nova'), 'Nova@1234');
    await usuario.type(screen.getByLabelText('Confirme a senha'), 'Nova@1234');
    await usuario.click(screen.getByRole('button', { name: /salvar senha/i }));

    expect(await screen.findByText('Senha alterada')).toBeInTheDocument();
    expect(corpo).toEqual({ token: 'abc', senha: 'Nova@1234' });
  });

  it('mostra quando o link expirou', async () => {
    servidor.use(
      http.post('*/api/v1/auth/redefinir-senha', () =>
        HttpResponse.json(
          { status: 400, errors: { token: ['Link inválido ou expirado.'] } },
          { status: 400 },
        ),
      ),
    );
    const { usuario } = renderizar(rotas, { caminho: '/redefinir-senha?token=velho' });

    await usuario.type(screen.getByLabelText('Senha nova'), 'Nova@1234');
    await usuario.type(screen.getByLabelText('Confirme a senha'), 'Nova@1234');
    await usuario.click(screen.getByRole('button', { name: /salvar senha/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Link inválido ou expirado.');
  });
});

describe('Confirmar e-mail', () => {
  it('confirma uma única vez ao abrir o link', async () => {
    let chamadas = 0;
    servidor.use(
      http.post('*/api/v1/auth/confirmar-email', () => {
        chamadas += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderizar(rotas, { caminho: '/confirmar-email?token=abc' });

    expect(await screen.findByText('E-mail confirmado')).toBeInTheDocument();
    expect(chamadas).toBe(1);
  });

  it('avisa quando o link não vale mais', async () => {
    servidor.use(
      http.post('*/api/v1/auth/confirmar-email', () =>
        HttpResponse.json({ status: 400, detail: 'Link inválido ou expirado.' }, { status: 400 }),
      ),
    );
    renderizar(rotas, { caminho: '/confirmar-email?token=velho' });

    expect(await screen.findByText('Não foi possível confirmar')).toBeInTheDocument();
  });
});

describe('Login', () => {
  it.each([
    [423, 'Conta bloqueada temporariamente. Tente novamente mais tarde.'],
    [403, 'Usuário inativo.'],
  ])('mostra o motivo quando a API responde %i', async (status, detail) => {
    servidor.use(
      http.post('*/api/v1/auth/login', () => HttpResponse.json({ status, detail }, { status })),
    );
    const { usuario } = renderizar(rotas, { caminho: '/entrar' });

    await usuario.type(screen.getByLabelText('E-mail ou CPF'), 'ana@email.com');
    await usuario.type(screen.getByLabelText('Senha'), 'Senha@123');
    await usuario.click(screen.getByRole('button', { name: /entrar na minha conta/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(detail));
  });
});
