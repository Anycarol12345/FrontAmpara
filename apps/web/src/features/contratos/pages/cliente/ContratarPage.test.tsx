import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { ContratarPage } from './ContratarPage';

const PLANO = {
  id_plano: 'p1',
  nome: 'Acolher',
  descricao: 'Mais conforto para você e sua família.',
  valor_mensal: 69,
  valor_anual: 660,
  valor_dependente_mensal: 14,
  valor_dependente_anual: 134,
  carencia_dias: 60,
  limite_dependentes: 4,
  permite_somente_dependente: false,
  ativo: true,
  configuracoes: {},
  coberturas: [],
};

const rotas = [
  { path: '/minha-conta/contratar', element: <ContratarPage /> },
  { path: '/minha-conta/contratos/:id', element: <p>Contrato criado</p> },
];

let corpoContrato: unknown;

beforeEach(() => {
  corpoContrato = undefined;
  servidor.use(
    http.get('*/api/v1/planos', () => HttpResponse.json([PLANO])),
    http.get('*/api/v1/planos/p1', () => HttpResponse.json(PLANO)),
    http.get('*/api/v1/dependentes', () =>
      HttpResponse.json([
        {
          id_dependente: 'd1',
          id_cliente: 'c1',
          nome: 'Marina Lima',
          cpf: '11144477735',
          data_nascimento: '1985-03-12',
          parentesco: 'Cônjuge',
          telefone: null,
          email: null,
        },
      ]),
    ),
    http.post('*/api/v1/contratos', async ({ request }) => {
      corpoContrato = await request.json();
      return HttpResponse.json({ id_contrato: 'k1' }, { status: 201 });
    }),
  );
});

describe('ContratarPage', () => {
  it('contrata o plano com dependente e abre o contrato criado', async () => {
    entrarComo('CLIENTE');
    const { usuario, router } = renderizar(rotas, { caminho: '/minha-conta/contratar?plano=p1' });

    // O plano vem marcado pelo ?plano= da landing.
    expect(await screen.findByRole('radio', { name: /acolher/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await usuario.click(screen.getByRole('button', { name: /continuar/i }));

    await usuario.click(await screen.findByRole('radio', { name: /titular e dependentes/i }));
    // Sem dependente marcado, não dá para avançar.
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
    await usuario.click(await screen.findByLabelText(/marina lima/i));
    await usuario.click(screen.getByRole('button', { name: /continuar/i }));

    await usuario.click(await screen.findByRole('radio', { name: /mensal/i }));
    await usuario.click(screen.getByRole('button', { name: /continuar/i }));

    expect(await screen.findByText('R$ 83,00')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: /confirmar contratação/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/minha-conta/contratos/k1'));
    expect(corpoContrato).toEqual({
      id_plano: 'p1',
      tipo_cobertura: 'TITULAR_E_DEPENDENTES',
      dependentes: ['d1'],
      periodicidade: 'MENSAL',
      dia_vencimento: 10,
    });
  });

  it('mostra o motivo quando a funerária não permite contratar', async () => {
    servidor.use(
      http.post('*/api/v1/contratos', () =>
        HttpResponse.json(
          {
            status: 400,
            detail: 'A contratação está bloqueada até a funerária configurar a cobrança.',
          },
          { status: 400 },
        ),
      ),
    );
    entrarComo('CLIENTE');
    const { usuario } = renderizar(rotas, { caminho: '/minha-conta/contratar?plano=p1' });

    await screen.findByRole('radio', { name: /acolher/i });
    for (let i = 0; i < 3; i++) {
      await usuario.click(await screen.findByRole('button', { name: /continuar/i }));
    }
    await usuario.click(await screen.findByRole('button', { name: /confirmar contratação/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A contratação está bloqueada');
  });
});
