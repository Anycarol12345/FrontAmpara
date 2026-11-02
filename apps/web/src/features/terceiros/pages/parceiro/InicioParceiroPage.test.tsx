import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo, respostaDeLogin } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { AtribuicaoPage } from './AtribuicaoPage';
import { InicioParceiroPage } from './InicioParceiroPage';

const daquiA = (minutos: number) => new Date(Date.now() + minutos * 60_000).toISOString();
const RESUMO = {
  nome_falecido: 'Helena Duarte',
  origem: 'Hospital Santa Clara, São Paulo-SP',
  destino: 'Rua das Acácias, 120, São Paulo-SP',
  data_hora: '2026-11-05T12:00:00Z',
  contato: { nome: 'Juliana Rocha', telefone: '(11) 3333-4444' },
  documentos: [],
};
const atribuicao = (id: string, status: string) => ({
  id_atribuicao: id,
  tipo: 'TRANSLADO',
  id_origem: `tr-${id}`,
  status,
  prazo_aceite: daquiA(90),
  respondida_em: null,
  motivo_recusa: null,
  resumo: RESUMO,
});

const rotas = [
  { path: '/parceiro', element: <InicioParceiroPage /> },
  { path: '/parceiro/atribuicoes/:id', element: <AtribuicaoPage /> },
];

beforeEach(() => {
  servidor.use(
    // A restauração da sessão roda no primeiro teste do arquivo: sem ela, o 401 limparia o cache.
    http.post('*/api/v1/auth/refresh', () => HttpResponse.json(respostaDeLogin('TERCEIRO'))),
    http.get('*/api/v1/terceiros/atribuicoes', () =>
      HttpResponse.json([atribuicao('a1', 'PENDENTE'), atribuicao('a2', 'ACEITA')]),
    ),
  );
  entrarComo('TERCEIRO');
});

describe('Portal do parceiro', () => {
  it('mostra o prazo e recusa com o motivo', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/terceiros/atribuicoes/a1/recusa', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json(atribuicao('a1', 'RECUSADA'));
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/parceiro' });

    expect(await screen.findByText(/responda em 1 h (29|30) min/i)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Recusar' }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.type(within(dialogo).getByLabelText('Motivo'), 'Sem veículo no horário');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Recusar serviço' }));

    await waitFor(() => expect(corpo).toEqual({ motivo: 'Sem veículo no horário' }));
  });

  it('no translado aceito, pede o motorista antes de começar', async () => {
    let motorista: unknown;
    servidor.use(
      http.get('*/api/v1/terceiros/translados/tr-a2', () =>
        HttpResponse.json({
          id_translado: 'tr-a2',
          nome_falecido: 'Helena Duarte',
          status: 'AGENDADO',
          origem: { endereco: 'Hospital Santa Clara', cidade: 'São Paulo', uf: 'SP', pais: 'BR' },
          destino: { endereco: 'Rua das Acácias, 120', cidade: 'São Paulo', uf: 'SP', pais: 'BR' },
          data_prevista: '2026-11-05T12:00:00Z',
          contato_nome: 'Juliana Rocha',
          contato_telefone: '(11) 3333-4444',
          status_aceite: 'ACEITO',
          motorista: null,
        }),
      ),
      http.put('*/api/v1/terceiros/translados/tr-a2/motorista', async ({ request }) => {
        motorista = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/parceiro/atribuicoes/a2' });

    expect(await screen.findByRole('button', { name: 'Cheguei para a coleta' })).toBeDisabled();
    await usuario.type(screen.getByLabelText('Nome do motorista'), 'Edson Lima');
    await usuario.type(screen.getByLabelText('Telefone'), '11977771234');
    await usuario.type(screen.getByLabelText('Placa'), 'ftr2b41');
    await usuario.type(screen.getByLabelText('Modelo do veículo'), 'Furgão funerário');
    await usuario.click(screen.getByRole('button', { name: 'Informar motorista' }));

    await waitFor(() =>
      expect(motorista).toEqual({
        nome: 'Edson Lima',
        telefone: '(11) 97777-1234',
        placa: 'FTR2B41',
        modelo: 'Furgão funerário',
      }),
    );
  });
});
