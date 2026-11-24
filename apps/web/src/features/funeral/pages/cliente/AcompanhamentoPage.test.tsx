import type { FuneralResponse, TransladoResponse } from '@ampara/api-client';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { AcompanhamentoPage } from './AcompanhamentoPage';

const FUNERAL: FuneralResponse = {
  id_funeral: 'fu1',
  id_beneficiario: 'b1',
  id_contrato: 'c1',
  nome_falecido: 'Helena Duarte',
  status: 'EM_PREPARACAO',
  data_hora_prevista: '2026-10-28T13:00:00Z',
  destinacao: 'SEPULTAMENTO',
  observacoes: null,
  proximos_status: ['VELORIO', 'CANCELADO'],
  equipe: [
    {
      id_usuario: 'u1',
      id_funcionario: 'f1',
      nome: 'Carlos Menezes',
      email: 'carlos@demo.localhost',
      perfil: 'FUNCIONARIO',
      ativo: true,
      cpf: null,
      cargo: 'Atendente',
      telefone: '(11) 98888-7766',
    },
  ],
  reservas: [
    {
      id_reserva: 'r1',
      id_local: 'l1',
      nome_local: 'Capela Ampara Jardim',
      tipo_local: 'SALA_VELORIO',
      inicio: '2026-10-27T13:00:00Z',
      fim: '2026-10-27T21:00:00Z',
    },
  ],
  historico: [
    {
      de: 'REGISTRADO',
      para: 'REGISTRADO',
      id_usuario: null,
      observacao: null,
      em: '2026-10-26T10:00:00Z',
    },
    {
      de: 'REGISTRADO',
      para: 'EM_PREPARACAO',
      id_usuario: 'u1',
      observacao: null,
      em: '2026-10-26T15:00:00Z',
    },
  ],
};

const TRANSLADO = {
  id_translado: 't1',
  id_funeral: 'fu1',
  status: 'EM_TRANSITO',
  origem: { endereco: 'Rua A, 1', cidade: 'Campinas', uf: 'SP', pais: 'Brasil' },
  destino: { endereco: 'Rua B, 2', cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' },
  motorista: null,
} as unknown as TransladoResponse;

describe('AcompanhamentoPage', () => {
  it('mostra a etapa atual, o velório, o translado e a certidão emitida', async () => {
    servidor.use(
      http.get('*/api/v1/funerais/fu1', () => HttpResponse.json(FUNERAL)),
      http.get('*/api/v1/funerais/fu1/translados', () => HttpResponse.json([TRANSLADO])),
      http.get('*/api/v1/funerais/fu1/itens', () =>
        HttpResponse.json({ itens_cobertos: [], itens_adicionais: [], total_adicional: 0 }),
      ),
      http.get('*/api/v1/beneficiarios/b1/certidao', () =>
        HttpResponse.json({
          status: 'EMITIDA',
          numero_matricula: '1234',
          id_documento_certidao: 'd9',
        }),
      ),
      http.get('*/api/v1/beneficiarios/b1/documentos', () => HttpResponse.json([])),
      http.get('*/api/v1/tenant/configuracoes', () => HttpResponse.json({})),
    );
    entrarComo('CLIENTE');
    renderizar([{ path: '/minha-conta/atendimentos/:id', element: <AcompanhamentoPage /> }], {
      caminho: '/minha-conta/atendimentos/fu1',
    });

    expect(
      await screen.findByRole('heading', { name: 'Despedida de Helena Duarte' }),
    ).toBeInTheDocument();

    const etapas = screen.getByRole('list', { name: 'Etapas do atendimento' });
    expect(within(etapas).getByRole('listitem', { current: 'step' })).toHaveTextContent(
      'Em preparação',
    );
    expect(screen.getByText('Capela Ampara Jardim')).toBeInTheDocument();
    expect(screen.getByText(/o local aparece aqui assim que for definido/i)).toBeInTheDocument();

    const translado = await screen.findByRole('list', { name: 'Etapas do translado' });
    expect(within(translado).getByRole('listitem', { current: 'step' })).toHaveTextContent(
      'A caminho do destino',
    );

    expect(
      await screen.findByRole('button', { name: 'Baixar Certidão de óbito' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Matrícula 1234/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ligar para \(11\) 98888-7766/i })).toBeInTheDocument();
  });
});
