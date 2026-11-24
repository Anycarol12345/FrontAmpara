import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo, respostaDeLogin } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { PainelLayout } from './PainelLayout';

describe('PainelLayout', () => {
  it('abre o menu em gaveta (celular e tablet) e fecha ao escolher um item', async () => {
    servidor.use(
      http.post('*/api/v1/auth/refresh', () => HttpResponse.json(respostaDeLogin('CONSULTOR'))),
    );
    entrarComo('CONSULTOR');
    const { usuario, router } = renderizar(
      [
        {
          path: '/painel',
          element: <PainelLayout />,
          children: [
            { index: true, element: <p>Início</p> },
            { path: 'simulador', element: <p>Tela do simulador</p> },
          ],
        },
      ],
      { caminho: '/painel' },
    );

    await usuario.click(await screen.findByRole('button', { name: 'Abrir o menu' }));
    const gaveta = await screen.findByRole('dialog');
    expect(within(gaveta).getByRole('link', { name: 'Desempenho' })).toBeInTheDocument();

    await usuario.click(within(gaveta).getByRole('link', { name: 'Simulador' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe('/painel/simulador');
  });
});
