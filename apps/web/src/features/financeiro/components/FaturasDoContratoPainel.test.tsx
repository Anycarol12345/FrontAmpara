import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import type { FaturaResponse } from '../hooks/faturas';
import { FaturasDoContratoPainel } from './FaturasDoContratoPainel';

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
    data_pagamento: null,
  }),
  fatura({
    id_fatura: 'f3',
    competencia: '2026-10',
    data_vencimento: '2026-10-10',
    status: 'VENCIDA',
    valor_multa_juros: 4.15,
    forma_pagamento: null,
    data_pagamento: null,
  }),
];

const rotas = [
  { path: '/painel/contratos/c1', element: <FaturasDoContratoPainel idContrato="c1" /> },
];

const abrir = () => renderizar(rotas, { caminho: '/painel/contratos/c1' });

function listaDeFaturas(faturas: FaturaResponse[]) {
  servidor.use(http.get('*/api/v1/contratos/c1/faturas', () => HttpResponse.json(faturas)));
}

beforeEach(() => {
  entrarComo('FUNERARIA', 'Gestor');
  listaDeFaturas(FATURAS);
});

describe('FaturasDoContratoPainel', () => {
  it('oferece a baixa só nas faturas em aberto ou em atraso', async () => {
    abrir();

    const outubro = await screen.findByRole('row', { name: /outubro de 2026/i });
    expect(outubro).toHaveTextContent('Em atraso');
    expect(outubro).toHaveTextContent('R$ 4,15 de multa e juros');
    expect(within(outubro).getByRole('button', { name: 'Dar baixa' })).toBeEnabled();

    const setembro = screen.getByRole('row', { name: /setembro de 2026/i });
    expect(setembro).toHaveTextContent('Em processamento');
    expect(within(setembro).queryByRole('button', { name: 'Dar baixa' })).not.toBeInTheDocument();

    const agosto = screen.getByRole('row', { name: /agosto de 2026/i });
    expect(agosto).toHaveTextContent('Paga');
    expect(within(agosto).queryByRole('button', { name: 'Dar baixa' })).not.toBeInTheDocument();
  });

  it('explica quando o contrato ainda não tem faturas', async () => {
    listaDeFaturas([]);
    abrir();

    expect(await screen.findByText('Nenhuma fatura ainda')).toBeInTheDocument();
  });

  it('registra a baixa com a forma de pagamento e a observação', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/gestao/faturas/f3/baixa', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json(fatura({ id_fatura: 'f3', status: 'PAGA' }));
      }),
    );
    const { usuario } = abrir();

    const outubro = await screen.findByRole('row', { name: /outubro de 2026/i });
    await usuario.click(within(outubro).getByRole('button', { name: 'Dar baixa' }));

    const dialogo = await screen.findByRole('dialog');
    expect(dialogo).toHaveTextContent('Multa e juros pelo atraso');
    await usuario.selectOptions(within(dialogo).getByLabelText('Forma de pagamento'), 'PIX');
    await usuario.type(within(dialogo).getByLabelText('Observação'), 'recibo 123');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Confirmar baixa' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(corpo).toEqual({ forma_pagamento: 'PIX', observacao: 'recibo 123' });
  });

  it('exige a observação antes de enviar a baixa', async () => {
    let chamou = false;
    servidor.use(
      http.post('*/api/v1/gestao/faturas/f3/baixa', () => {
        chamou = true;
        return HttpResponse.json({});
      }),
    );
    const { usuario } = abrir();

    const outubro = await screen.findByRole('row', { name: /outubro de 2026/i });
    await usuario.click(within(outubro).getByRole('button', { name: 'Dar baixa' }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Confirmar baixa' }));

    expect(await within(dialogo).findByText(/informe uma observação/i)).toBeInTheDocument();
    expect(chamou).toBe(false);
  });

  it('mostra o motivo quando a API recusa a baixa', async () => {
    servidor.use(
      http.post('*/api/v1/gestao/faturas/f3/baixa', () =>
        HttpResponse.json(
          { status: 409, detail: 'A fatura já foi paga.', code: 'Fatura.JaPaga' },
          { status: 409 },
        ),
      ),
    );
    const { usuario } = abrir();

    const outubro = await screen.findByRole('row', { name: /outubro de 2026/i });
    await usuario.click(within(outubro).getByRole('button', { name: 'Dar baixa' }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.type(within(dialogo).getByLabelText('Observação'), 'recibo 123');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Confirmar baixa' }));

    expect(await within(dialogo).findByText('A fatura já foi paga.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
