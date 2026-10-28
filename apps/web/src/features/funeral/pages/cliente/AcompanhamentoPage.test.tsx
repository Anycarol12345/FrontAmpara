import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import type { FuneralResponse } from '../../hooks/funerais';
import { AcompanhamentoPage } from './AcompanhamentoPage';

const FUNERAL: FuneralResponse = {
  id_funeral: 'fu1',
  nome_falecido: 'Helena Duarte',
  data_falecimento: '2026-10-26',
  status: 'EM_PREPARACAO',
  historico: [
    { status: 'REGISTRADO', data_hora: '2026-10-26T10:00:00Z', observacao: null },
    { status: 'EM_PREPARACAO', data_hora: '2026-10-26T15:00:00Z', observacao: null },
  ],
  velorio: {
    local: 'Capela Ampara Jardim',
    endereco: 'Rua das Acácias, 120',
    sala: 'Sala 2',
    inicio: '2026-10-27T13:00:00Z',
    fim: '2026-10-27T21:00:00Z',
  },
  despedida: null,
  itens: [{ nome: 'Urna em madeira', categoria: 'Urna', quantidade: 1, coberto: true }],
  translado: {
    id_translado: 't1',
    status: 'EM_TRANSITO',
    origem: 'Hospital Santa Clara',
    destino: 'Capela Ampara Jardim',
    historico: [],
  },
  certidao: { status: 'EMITIDA', numero_matricula: '1234', url: 'https://arquivos.exemplo/c.pdf' },
  documentos: [],
  responsavel: { nome: 'Carlos Menezes', telefone: '(11) 98888-7766' },
};

describe('AcompanhamentoPage', () => {
  it('mostra a etapa atual, o local do velório, o translado e a certidão', async () => {
    servidor.use(
      http.get('*/api/v1/funerais/fu1', () => HttpResponse.json(FUNERAL)),
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
    expect(screen.getByText(/o local e o horário aparecem aqui/i)).toBeInTheDocument();

    const translado = screen.getByRole('list', { name: 'Etapas do translado' });
    expect(within(translado).getByRole('listitem', { current: 'step' })).toHaveTextContent(
      'A caminho do destino',
    );

    expect(screen.getByRole('link', { name: 'Baixar Certidão de óbito' })).toHaveAttribute(
      'href',
      'https://arquivos.exemplo/c.pdf',
    );
    expect(screen.getByRole('link', { name: /ligar para \(11\) 98888-7766/i })).toBeInTheDocument();
  });
});
