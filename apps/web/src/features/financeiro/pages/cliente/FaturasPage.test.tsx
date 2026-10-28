import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import type { FaturaResponse } from '../../hooks/faturas';
import { FaturasPage } from './FaturasPage';

const fatura = (parcial: Partial<FaturaResponse>): FaturaResponse => ({
  id_fatura: 'f',
  id_contrato: 'c1',
  competencia: '2026-08',
  valor: 69,
  valor_multa_juros: 0,
  data_vencimento: '2026-08-10',
  status: 'PAGA',
  forma_pagamento: 'PIX',
  link_pagamento: null,
  data_pagamento: '2026-08-08',
  ...parcial,
});

const FATURAS = [
  fatura({ id_fatura: 'f1' }),
  fatura({
    id_fatura: 'f2',
    competencia: '2026-09',
    data_vencimento: '2026-09-10',
    status: 'PROCESSANDO',
    forma_pagamento: 'BOLETO',
  }),
  fatura({
    id_fatura: 'f3',
    competencia: '2026-10',
    data_vencimento: '2026-10-10',
    status: 'VENCIDA',
    valor_multa_juros: 4.15,
    forma_pagamento: null,
    data_pagamento: null,
    link_pagamento: 'https://pagamento.exemplo/f3',
  }),
];

const rotas = [{ path: '/minha-conta/faturas', element: <FaturasPage /> }];

beforeEach(() => {
  servidor.use(
    http.get('*/api/v1/contratos', () =>
      HttpResponse.json([
        {
          id_contrato: 'c1',
          id_cliente: 'cl1',
          nome_titular: 'Ana Souza',
          id_plano: 'p1',
          nome_plano: 'Acolher',
          tipo_cobertura: 'TITULAR',
          periodicidade: 'MENSAL',
          status: 'SUSPENSO',
          valor_total: 69,
          data_contratacao: '2026-03-10',
          quantidade_pessoas: 1,
        },
      ]),
    ),
    http.get('*/api/v1/contratos/c1/faturas', () => HttpResponse.json(FATURAS)),
  );
  entrarComo('CLIENTE');
});

describe('FaturasPage', () => {
  it('mostra o aviso de plano suspenso, a multa e o pagamento em processamento', async () => {
    renderizar(rotas, { caminho: '/minha-conta/faturas' });

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('O plano Acolher está suspenso');
    expect(within(aviso).getByRole('button', { name: 'Pagar e reativar' })).toBeEnabled();

    const outubro = await screen.findByRole('article', { name: 'Fatura de outubro de 2026' });
    expect(outubro).toHaveTextContent('Em atraso');
    expect(outubro).toHaveTextContent('Multa e juros pelo atraso: R$ 4,15');

    const setembro = screen.getByRole('article', { name: 'Fatura de setembro de 2026' });
    expect(setembro).toHaveTextContent('Em processamento');
    expect(setembro).toHaveTextContent('Isso não conta como atraso');
    expect(within(setembro).queryByRole('button', { name: 'Pagar' })).not.toBeInTheDocument();
  });

  it('filtra por status', async () => {
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/faturas' });
    await screen.findByRole('article', { name: 'Fatura de outubro de 2026' });

    await usuario.click(screen.getByRole('radio', { name: 'Pagas' }));

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('article')).toHaveTextContent('Paga em 08/08/2026 com Pix');
  });

  it('mostra a multa antes de abrir a página de pagamento do Stripe', async () => {
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null);
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/faturas' });

    const outubro = await screen.findByRole('article', { name: 'Fatura de outubro de 2026' });
    await usuario.click(within(outubro).getByRole('button', { name: 'Pagar' }));

    const dialogo = await screen.findByRole('dialog');
    expect(dialogo).toHaveTextContent('Multa e juros pelo atraso');
    expect(dialogo).toHaveTextContent('R$ 4,15');
    await usuario.click(within(dialogo).getByRole('button', { name: /ir para o pagamento/i }));

    expect(abrir).toHaveBeenCalledWith(
      'https://pagamento.exemplo/f3',
      '_blank',
      'noopener,noreferrer',
    );
    abrir.mockRestore();
  });
});
