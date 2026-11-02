import type { ContratoDetalheResponse } from '@ampara/api-client';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { ContratoClientePage } from './ContratoClientePage';

const contrato = (parcial: Partial<ContratoDetalheResponse> = {}): ContratoDetalheResponse => ({
  id_contrato: 'c1',
  titular: { id_cliente: 'cl1', nome: 'Ana Souza', cpf: '52998224725' },
  id_plano: 'p1',
  nome_plano: 'Acolher',
  tipo_cobertura: 'TITULAR_E_DEPENDENTES',
  periodicidade: 'MENSAL',
  dia_vencimento: 10,
  data_contratacao: '2026-02-10',
  data_fim: null,
  status: 'ATIVO',
  valor_plano: 69.9,
  valor_por_dependente: 14.9,
  valor_total: 84.8,
  carencia_dias: 60,
  id_consultor: null,
  motivo_cancelamento: null,
  pessoas_cobertas: [
    {
      id_pessoa_coberta: 'pc1',
      tipo: 'TITULAR',
      id_dependente: null,
      nome: 'Ana Souza',
      cpf: '52998224725',
      data_inclusao: '2026-02-10',
      carencia_cumprida_em: '2026-04-11',
    },
    {
      id_pessoa_coberta: 'pc2',
      tipo: 'DEPENDENTE',
      id_dependente: 'd1',
      nome: 'Carlos Souza',
      cpf: '11144477735',
      data_inclusao: '2026-02-10',
      carencia_cumprida_em: '2026-04-11',
    },
  ],
  ...parcial,
});

const dependente = (id: string, nome: string) => ({
  id_dependente: id,
  id_cliente: 'cl1',
  nome,
  cpf: '39053344705',
  data_nascimento: '1950-01-20',
  parentesco: 'Mãe',
  telefone: null,
  email: null,
});

const rotas = [{ path: '/minha-conta/contratos/:id', element: <ContratoClientePage /> }];

beforeEach(() => {
  servidor.use(
    http.get('*/api/v1/dependentes', () =>
      HttpResponse.json([dependente('d1', 'Carlos Souza'), dependente('d2', 'Lúcia Souza')]),
    ),
  );
  entrarComo('CLIENTE');
});

describe('ContratoClientePage', () => {
  it('inclui no contrato um dependente que ainda não está nele', async () => {
    let incluido: unknown;
    servidor.use(
      http.get('*/api/v1/contratos/c1', () => HttpResponse.json(contrato())),
      http.post('*/api/v1/contratos/c1/dependentes', async ({ request }) => {
        incluido = await request.json();
        return HttpResponse.json(contrato());
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/contratos/c1' });

    // Carlos já está no contrato; só a Lúcia aparece para incluir.
    await usuario.click(await screen.findByRole('button', { name: /incluir/i }));
    const dialogo = await screen.findByRole('dialog');
    expect(dialogo).toHaveTextContent('carência de 60 dias');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Incluir no contrato' }));

    await waitFor(() => expect(incluido).toEqual({ id_dependente: 'd2' }));
  });

  it('cancela com o motivo escolhido e mostra o erro do backend', async () => {
    let corpo: unknown;
    servidor.use(
      http.get('*/api/v1/contratos/c1', () => HttpResponse.json(contrato())),
      http.post('*/api/v1/contratos/c1/cancelar', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json(
          {
            status: 409,
            code: 'Contrato.FuneralEmAndamento',
            detail: 'Há um funeral em andamento neste contrato.',
          },
          { status: 409 },
        );
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/contratos/c1' });

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar contrato' }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar contrato' }));
    expect(within(dialogo).getByText('Escolha um motivo.')).toBeInTheDocument();

    await usuario.click(within(dialogo).getByRole('radio', { name: 'Vou me mudar de cidade' }));
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar contrato' }));

    expect(
      await within(dialogo).findByText('Há um funeral em andamento neste contrato.'),
    ).toBeInTheDocument();
    expect(corpo).toEqual({ motivo: 'Vou me mudar de cidade' });
  });

  it('mostra a primeira cobrança para pagar quando o contrato ainda não está ativo', async () => {
    servidor.use(
      http.get('*/api/v1/contratos/c1', () => HttpResponse.json(contrato({ status: 'A_PAGAR' }))),
      http.get('*/api/v1/contratos/c1/faturas', () =>
        HttpResponse.json([
          {
            id_fatura: 'f1',
            id_contrato: 'c1',
            competencia: '2026-11-01',
            valor: 84.8,
            valor_multa_juros: 0,
            encargos_estimados: 0,
            data_vencimento: '2026-11-10',
            status: 'PENDENTE',
            forma_pagamento: null,
            link_pagamento: 'https://pagamento.exemplo/f1',
            data_pagamento: null,
          },
        ]),
      ),
    );
    renderizar(rotas, { caminho: '/minha-conta/contratos/c1?novo=1' });

    expect(await screen.findByText(/falta só pagar a primeira cobrança/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Pagar' })).toBeEnabled();
  });
});
