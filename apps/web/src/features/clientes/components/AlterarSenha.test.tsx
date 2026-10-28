import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { AlterarSenha } from './AlterarSenha';

const rotas = [{ path: '/', element: <AlterarSenha /> }];

describe('AlterarSenha', () => {
  it('confere a repetição antes de enviar', async () => {
    entrarComo('CLIENTE');
    const { usuario } = renderizar(rotas);

    await usuario.type(screen.getByLabelText('Senha atual'), 'Antiga@123');
    await usuario.type(screen.getByLabelText('Nova senha'), 'Nova@2026x');
    await usuario.type(screen.getByLabelText('Repita a nova senha'), 'Outra@2026x');
    await usuario.click(screen.getByRole('button', { name: 'Alterar senha' }));

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument();
  });

  it('envia a senha atual e a nova e mostra o erro da API no campo', async () => {
    let corpo: unknown;
    servidor.use(
      http.put('*/api/v1/auth/senha', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json(
          {
            status: 400,
            title: 'Dados inválidos',
            errors: { senha_atual: ['Senha atual incorreta.'] },
          },
          { status: 400 },
        );
      }),
    );
    entrarComo('CLIENTE');
    const { usuario } = renderizar(rotas);

    await usuario.type(screen.getByLabelText('Senha atual'), 'Antiga@123');
    await usuario.type(screen.getByLabelText('Nova senha'), 'Nova@2026x');
    await usuario.type(screen.getByLabelText('Repita a nova senha'), 'Nova@2026x');
    await usuario.click(screen.getByRole('button', { name: 'Alterar senha' }));

    expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument();
    await waitFor(() =>
      expect(corpo).toEqual({ senha_atual: 'Antiga@123', nova_senha: 'Nova@2026x' }),
    );
  });
});
