import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo, respostaDeLogin } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { RelatoriosPage } from './RelatoriosPage';

const rotas = [{ path: '/painel/relatorios', element: <RelatoriosPage /> }];

beforeEach(() => {
  servidor.use(
    // A restauração da sessão roda no primeiro teste do arquivo: sem ela, o 401 limparia o cache.
    http.post('*/api/v1/auth/refresh', () => HttpResponse.json(respostaDeLogin('FUNERARIA'))),
  );
  entrarComo('FUNERARIA');
});

describe('RelatoriosPage', () => {
  it('mostra as mudanças de cada ação da auditoria', async () => {
    servidor.use(
      http.get('*/api/v1/gestao/auditoria', () =>
        HttpResponse.json({
          itens: [
            {
              id_auditoria: 'a1',
              data_hora: '2026-11-01T13:00:00Z',
              acao: 'PLANO_ALTERADO',
              entidade: 'Plano',
              id_entidade: 'p1',
              id_usuario: 'u1',
              nome_usuario: 'Marcos Lima',
              ip: '10.0.0.5',
              valores_anteriores: { valor_mensal: 49.9, nome: 'Acolher' },
              valores_novos: { valor_mensal: 54.9, nome: 'Acolher' },
            },
          ],
          pagina: 1,
          tamanho: 20,
          total: 1,
        }),
      ),
    );
    const { usuario } = renderizar(rotas, { caminho: '/painel/relatorios?aba=auditoria' });

    expect(await screen.findByText('Marcos Lima')).toBeInTheDocument();
    expect(screen.getByText(/plano alterado/i)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Ver 1 mudança' }));

    const linha = screen.getByRole('cell', { name: 'valor_mensal' }).closest('tr')!;
    expect(within(linha).getByText('49.9')).toBeInTheDocument();
    expect(within(linha).getByText('54.9')).toBeInTheDocument();
  });

  it('baixa o CSV do período e recusa período maior que 366 dias', async () => {
    let parametros: URLSearchParams | undefined;
    servidor.use(
      http.get('*/api/v1/gestao/relatorios/financeiro', ({ request }) => {
        parametros = new URL(request.url).searchParams;
        return new HttpResponse('id;valor', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="f.csv"',
          },
        });
      }),
    );
    URL.createObjectURL = vi.fn(() => 'blob:relatorio');
    URL.revokeObjectURL = vi.fn();
    const { usuario } = renderizar(rotas, { caminho: '/painel/relatorios?aba=exportar' });

    const de = await screen.findByLabelText('Vencimento: de');
    const ate = screen.getAllByLabelText('até')[0]!;
    await usuario.type(de, '2025-01-01');
    await usuario.type(ate, '2026-06-30');
    const [baixarFinanceiro] = screen.getAllByRole('button', { name: /baixar csv/i });
    await usuario.click(baixarFinanceiro!);
    expect(await screen.findByText('Escolha um período de até 366 dias.')).toBeInTheDocument();

    await usuario.clear(de);
    await usuario.type(de, '2026-01-01');
    await usuario.selectOptions(screen.getAllByLabelText('Situação')[0]!, 'VENCIDA');
    await usuario.click(baixarFinanceiro!);

    await waitFor(() => expect(parametros?.get('formato')).toBe('csv'));
    expect(parametros?.get('de')).toBe('2026-01-01');
    expect(parametros?.get('status')).toBe('VENCIDA');
  });
});
