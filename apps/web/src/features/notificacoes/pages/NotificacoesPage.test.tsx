import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { SinoNotificacoes } from '../components/SinoNotificacoes';
import type { NotificacaoResponse } from '../hooks/notificacoes';
import { NotificacoesPage } from './NotificacoesPage';

const agora = new Date().toISOString();
const lista = (): NotificacaoResponse[] => [
  {
    id_notificacao: 'n1',
    titulo: 'Sua fatura está disponível',
    mensagem: 'Você pode pagar com Pix, boleto ou cartão.',
    link: null,
    lida: false,
    criada_em: agora,
  },
  {
    id_notificacao: 'n2',
    titulo: 'Bem-vindo',
    mensagem: 'Sua conta está pronta.',
    link: null,
    lida: true,
    criada_em: agora,
  },
];

const rotas = [
  {
    path: '/minha-conta/notificacoes',
    element: (
      <>
        <SinoNotificacoes todas="/minha-conta/notificacoes" />
        <NotificacoesPage />
      </>
    ),
  },
];

describe('Central de notificações', () => {
  it('conta as não lidas e marca todas como lidas', async () => {
    let notificacoes = lista();
    let marcouTodas = false;
    servidor.use(
      http.get('*/api/v1/notificacoes', () => HttpResponse.json(notificacoes)),
      http.patch('*/api/v1/notificacoes/lidas', () => {
        marcouTodas = true;
        notificacoes = notificacoes.map((n) => ({ ...n, lida: true }));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    entrarComo('CLIENTE');
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/notificacoes' });

    expect(
      await screen.findByRole('button', { name: 'Notificações (1 não lidas)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('(não lida)')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /marcar todas como lidas/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Notificações' })).toBeInTheDocument(),
    );
    expect(screen.queryByText('(não lida)')).not.toBeInTheDocument();
    expect(marcouTodas).toBe(true);
  });

  it('marca uma notificação como lida ao abrir', async () => {
    let lida: string | undefined;
    servidor.use(
      http.get('*/api/v1/notificacoes', () => HttpResponse.json(lista())),
      http.patch('*/api/v1/notificacoes/:id/lida', ({ params }) => {
        lida = String(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    entrarComo('CLIENTE');
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/notificacoes' });

    await usuario.click(await screen.findByRole('button', { name: /sua fatura está disponível/i }));

    await waitFor(() => expect(lida).toBe('n1'));
  });
});
