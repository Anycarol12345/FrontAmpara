import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo, respostaDeLogin } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { AgendaPage } from './AgendaPage';
import { FuneralPainelPage } from './FuneralPainelPage';

const SALA = {
  id_local: 'l1',
  nome: 'Sala Ipê',
  tipo: 'SALA_VELORIO',
  endereco: null,
  proprio: true,
  intervalo_preparacao_minutos: 60,
  ativo: true,
};
const CEMITERIO = {
  ...SALA,
  id_local: 'l2',
  nome: 'Cemitério da Paz',
  tipo: 'CEMITERIO',
  proprio: false,
};

beforeEach(() => {
  servidor.use(
    http.get('*/api/v1/gestao/locais', () => HttpResponse.json([SALA, CEMITERIO])),
    http.get('*/api/v1/gestao/locais/:id/agenda', ({ request }) =>
      HttpResponse.json({
        local: SALA,
        data: new URL(request.url).searchParams.get('data'),
        reservas: [
          {
            id_reserva: 'r1',
            id_funeral: 'f9',
            nome_falecido: 'José Almeida',
            inicio: '2026-11-05T11:00:00Z',
            fim: '2026-11-05T17:00:00Z',
            ocupado_ate: '2026-11-05T18:00:00Z',
          },
        ],
      }),
    ),
  );
});

describe('AgendaPage', () => {
  it('mostra a ocupação das salas próprias no dia escolhido', async () => {
    // A restauração da sessão roda no primeiro teste do arquivo: sem ela, o 401 limparia o cache.
    servidor.use(
      http.post('*/api/v1/auth/refresh', () => HttpResponse.json(respostaDeLogin('FUNCIONARIO'))),
    );
    entrarComo('FUNCIONARIO');
    renderizar([{ path: '/painel/agenda', element: <AgendaPage /> }], {
      caminho: '/painel/agenda?dia=2026-11-05',
    });

    expect(await screen.findByRole('link', { name: 'José Almeida' })).toHaveAttribute(
      'href',
      '/painel/funerais/f9?aba=local',
    );
    expect(screen.getByRole('img', { name: 'Ocupação de Sala Ipê' })).toBeInTheDocument();
    // O cemitério não é da funerária: não tem agenda.
    expect(screen.queryByText('Cemitério da Paz')).not.toBeInTheDocument();
    // Só o gestor cadastra locais.
    expect(screen.queryByRole('button', { name: /novo local/i })).not.toBeInTheDocument();
  });

  it('gestor cadastra uma sala', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/gestao/locais', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ ...SALA, id_local: 'l3' }, { status: 201 });
      }),
    );
    entrarComo('FUNERARIA');
    const { usuario } = renderizar([{ path: '/painel/agenda', element: <AgendaPage /> }], {
      caminho: '/painel/agenda?aba=locais',
    });

    await usuario.click(await screen.findByRole('button', { name: /novo local/i }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.type(within(dialogo).getByLabelText('Nome'), 'Sala Jacarandá');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(corpo).toEqual({
        nome: 'Sala Jacarandá',
        tipo: 'SALA_VELORIO',
        endereco: null,
        proprio: true,
        intervalo_preparacao_minutos: 60,
      }),
    );
  });
});

describe('Aba Local e agenda do funeral', () => {
  it('explica o conflito quando o horário está ocupado', async () => {
    servidor.use(
      http.get('*/api/v1/funerais/f1', () =>
        HttpResponse.json({
          id_funeral: 'f1',
          id_beneficiario: 'b1',
          id_contrato: 'c1',
          nome_falecido: 'Maria Souza',
          status: 'REGISTRADO',
          data_hora_prevista: '2026-11-05T17:00:00Z',
          destinacao: 'SEPULTAMENTO',
          observacoes: null,
          proximos_status: [],
          equipe: [],
          reservas: [],
          historico: [],
        }),
      ),
      http.post('*/api/v1/funerais/f1/reservas', () =>
        HttpResponse.json({ title: 'Conflito', detail: 'Horário ocupado.' }, { status: 409 }),
      ),
    );
    entrarComo('FUNCIONARIO');
    const { usuario } = renderizar(
      [{ path: '/painel/funerais/:id', element: <FuneralPainelPage /> }],
      { caminho: '/painel/funerais/f1?aba=local' },
    );

    await usuario.click(await screen.findByRole('button', { name: /reservar local/i }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.selectOptions(within(dialogo).getByLabelText('Local'), 'l1');
    await usuario.type(within(dialogo).getByLabelText('Fim'), '23:00');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Reservar' }));

    expect(await within(dialogo).findByText(/esse horário já está ocupado/i)).toBeInTheDocument();
  });
});
