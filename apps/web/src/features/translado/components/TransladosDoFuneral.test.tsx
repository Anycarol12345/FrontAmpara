import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo, respostaDeLogin } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { TransladosDoFuneral } from './TransladosDoFuneral';

const TRANSLADO = {
  id_translado: 't1',
  id_funeral: 'f1',
  tipo: 'INTERMUNICIPAL',
  status: 'AGENDADO',
  origem: { endereco: 'Hospital Santa Clara', cidade: 'Campinas', uf: 'SP', pais: 'BR' },
  destino: { endereco: 'Rua das Acácias, 120', cidade: 'São Paulo', uf: 'SP', pais: 'BR' },
  data_prevista: '2026-11-05T12:00:00Z',
  distancia_km: 95,
  distancia_manual: false,
  valor: 600,
  valor_coberto_plano: 400,
  valor_a_pagar: 200,
  id_terceiro_frota: 'fr1',
  nome_frota: 'Translados Boa Viagem',
  status_aceite: 'RECUSADO',
  motivo_recusa: 'Sem veículo no horário',
  motorista: null,
};

const rotas = [
  {
    path: '/painel/funerais/:id',
    element: <TransladosDoFuneral idFuneral="f1" dataPrevista="2026-11-05T17:00:00Z" />,
  },
];

beforeEach(() => {
  servidor.use(
    // A restauração da sessão roda no primeiro teste do arquivo: sem ela, o 401 limparia o cache.
    http.post('*/api/v1/auth/refresh', () => HttpResponse.json(respostaDeLogin('FUNCIONARIO'))),
    http.get('*/api/v1/funerais/f1/translados', () => HttpResponse.json([TRANSLADO])),
    http.get('*/api/v1/translados/t1/historico', () =>
      HttpResponse.json([
        {
          de: 'AGENDADO',
          para: 'AGENDADO',
          id_usuario: null,
          observacao: null,
          em: '2026-11-04T10:00:00Z',
        },
      ]),
    ),
    http.get('*/api/v1/translados/t1/documentos', () =>
      HttpResponse.json({
        tipo: 'INTERMUNICIPAL',
        completo: false,
        documentos: [
          { tipo: 'Certidão de óbito', presente: true },
          { tipo: 'Autorização de translado', presente: false },
        ],
      }),
    ),
    http.get('*/api/v1/translados/t1/empresas-disponiveis', () =>
      HttpResponse.json([{ id_terceiro: 'fr2', nome: 'Remoções Paz' }]),
    ),
  );
  entrarComo('FUNCIONARIO');
});

describe('TransladosDoFuneral', () => {
  it('mostra valores, recusa e documentos, e envia para outra empresa', async () => {
    let corpo: unknown;
    servidor.use(
      http.patch('*/api/v1/translados/t1/terceiro', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json(TRANSLADO);
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/painel/funerais/f1' });

    expect(await screen.findByText('Motivo da recusa: Sem veículo no horário')).toBeInTheDocument();
    expect(screen.getByText('R$ 200,00')).toBeInTheDocument();
    expect(await screen.findByLabelText('Falta')).toBeInTheDocument();

    const empresa = screen.getByLabelText('Empresa de translado');
    await waitFor(() => expect(within(empresa).getByText('Remoções Paz')).toBeInTheDocument());
    await usuario.selectOptions(empresa, 'fr2');
    await usuario.click(screen.getByRole('button', { name: 'Enviar para outra empresa' }));

    await waitFor(() => expect(corpo).toEqual({ id_terceiro: 'fr2' }));
  });

  it('calcula o preço antes de registrar um translado', async () => {
    let registrado: unknown;
    servidor.use(
      http.post('*/api/v1/translados/simular', () =>
        HttpResponse.json({
          tipo: 'MUNICIPAL',
          distancia_km: 12,
          distancia_manual: false,
          valor: 250,
          valor_coberto_plano: 250,
          valor_a_pagar: 0,
        }),
      ),
      http.post('*/api/v1/funerais/f1/translados', async ({ request }) => {
        registrado = await request.json();
        return HttpResponse.json(TRANSLADO, { status: 201 });
      }),
    );
    const { usuario } = renderizar(rotas, { caminho: '/painel/funerais/f1' });

    await usuario.click(await screen.findByRole('button', { name: /novo translado/i }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.type(
      within(dialogo).getByLabelText('Endereço de retirada'),
      'Hospital Municipal',
    );
    await usuario.type(within(dialogo).getByLabelText('Cidade de retirada'), 'São Paulo');
    await usuario.selectOptions(within(dialogo).getByLabelText('UF de retirada'), 'SP');
    await usuario.type(
      within(dialogo).getByLabelText('Endereço de entrega'),
      'Rua das Acácias, 120',
    );
    await usuario.type(within(dialogo).getByLabelText('Cidade de entrega'), 'São Paulo');
    await usuario.selectOptions(within(dialogo).getByLabelText('UF de entrega'), 'SP');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Calcular preço' }));

    expect(await within(dialogo).findByLabelText('Preço calculado')).toHaveTextContent(
      'Municipal · 12 km',
    );
    expect(registrado).toBeUndefined();
    await usuario.click(within(dialogo).getByRole('button', { name: 'Registrar translado' }));

    await waitFor(() =>
      expect(registrado).toMatchObject({
        origem: { endereco: 'Hospital Municipal', cidade: 'São Paulo', uf: 'SP', pais: 'BR' },
        distancia_km: null,
      }),
    );
  });
});
