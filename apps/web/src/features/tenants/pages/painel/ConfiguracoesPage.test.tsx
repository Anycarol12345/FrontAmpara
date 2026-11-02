import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { ConfiguracoesPage } from './ConfiguracoesPage';

const rotas = [{ path: '/painel/configuracoes', element: <ConfiguracoesPage /> }];
const CONFIGURACOES = {
  id_tenant: 'tn1',
  nome_fantasia: 'Funerária Boa Paz',
  slug: 'boapaz',
  status: 'ATIVA',
  cobranca_configurada: true,
  identidade_visual: {
    nome_exibicao: 'Boa Paz',
    logo_url: null,
    cor_primaria: '#3E5C54',
    cor_secundaria: '#C9A66B',
    email: 'contato@boapaz.com.br',
    telefone: '1133334444',
    whatsapp: null,
    endereco: { cidade: 'Campinas', uf: 'SP' },
    horario_atendimento: null,
  },
  parametros: {
    cobranca: {
      modo_vencimento: 'FIXO',
      dia_vencimento_fixo: 10,
      dias_vencimento_permitidos: [5, 10],
      tolerancia_dias: 5,
      multa_percentual: null,
      juros_mensal_percentual: 1,
      desconto_anual_percentual: 10,
      reajuste_anual_percentual: 0,
    },
    lembretes: { dias_antes: [5, 1], dias_depois: [1, 3] },
    terceiros: { prazo_aceite_horas: 2 },
    certidao: { modo: 'MANUAL' },
  },
};

beforeEach(() => {
  servidor.use(
    http.get('*/api/v1/gestao/configuracoes', () => HttpResponse.json(CONFIGURACOES)),
    http.get('*/api/v1/gestao/translados/tabela-precos', () =>
      HttpResponse.json({
        faixas: [{ de_km: 0, ate_km: 50, valor: 200, valor_km_excedente: null }],
        documentos_exigidos: { MUNICIPAL: ['Certidão de óbito'] },
      }),
    ),
  );
  entrarComo('FUNERARIA');
});

describe('ConfiguracoesPage', () => {
  it('salva a identidade visual sem mexer nos parâmetros', async () => {
    let corpo: { identidade_visual: Record<string, unknown>; parametros: unknown } | undefined;
    servidor.use(
      http.put('*/api/v1/gestao/configuracoes', async ({ request }) => {
        corpo = (await request.json()) as typeof corpo;
        return HttpResponse.json(CONFIGURACOES);
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/painel/configuracoes' });

    const nome = await screen.findByLabelText('Nome de exibição');
    await usuario.clear(nome);
    await usuario.type(nome, 'Boa Paz Campinas');
    expect(screen.getByLabelText('Pré-visualização')).toHaveTextContent('Boa Paz Campinas');
    await usuario.click(screen.getByRole('button', { name: 'Salvar identidade visual' }));

    await waitFor(() => expect(corpo?.parametros).toBeNull());
    expect(corpo?.identidade_visual).toMatchObject({
      nome_exibicao: 'Boa Paz Campinas',
      telefone: '1133334444',
      endereco: expect.objectContaining({ cidade: 'Campinas', uf: 'SP' }),
    });
  });

  it('avisa que a contratação está bloqueada e recusa multa acima de 2%', async () => {
    const { usuario } = renderizar(rotas, { caminho: '/painel/configuracoes?aba=cobranca' });

    expect(await screen.findByText('Novas contratações estão bloqueadas.')).toBeInTheDocument();
    await usuario.type(screen.getByLabelText('Multa por atraso (%)'), '3');
    await usuario.click(screen.getByRole('button', { name: 'Salvar cobrança' }));

    expect(await screen.findByText('Use um valor de 0 a 2.')).toBeInTheDocument();
  });

  it('mostra o erro de faixas sobrepostas na tabela de km', async () => {
    const { usuario } = renderizar(rotas, { caminho: '/painel/configuracoes?aba=translado' });

    await usuario.click(await screen.findByRole('button', { name: /adicionar faixa/i }));
    const inicio = screen.getByLabelText('Faixa 2: km inicial');
    await usuario.clear(inicio);
    await usuario.type(inicio, '30');
    await usuario.type(screen.getByLabelText('Faixa 2: valor'), '400');
    await usuario.click(screen.getByRole('button', { name: 'Salvar tabela de km' }));

    expect(
      await screen.findByText('As faixas 1 e 2 se sobrepõem: a faixa 2 começa antes de 50 km.'),
    ).toBeInTheDocument();
  });
});
