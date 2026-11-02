import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizar } from '@/test/renderizar';
import { entrarComo } from '@/test/sessao';
import { servidor } from '@/test/setup';
import { FuneralPainelPage } from './FuneralPainelPage';

const FUNERAL = {
  id_funeral: 'f1',
  id_beneficiario: 'b1',
  id_contrato: 'c1',
  nome_falecido: 'Maria Souza',
  status: 'REGISTRADO',
  data_hora_prevista: '2026-11-05T14:00:00Z',
  destinacao: 'SEPULTAMENTO',
  observacoes: 'Família pediu flores brancas',
  proximos_status: ['EM_PREPARACAO', 'CANCELADO'],
  equipe: [],
  reservas: [],
  historico: [
    {
      de: 'REGISTRADO',
      para: 'REGISTRADO',
      id_usuario: 'u1',
      observacao: 'Funeral registrado',
      em: '2026-11-01T10:00:00Z',
    },
  ],
};

const COMPOSICAO = {
  itens_cobertos: [
    {
      id_funeral_item: 'i1',
      id_item_catalogo: 'cat1',
      nome: 'Urna simples',
      categoria: 'Urnas',
      variacao: null,
      quantidade: 1,
    },
  ],
  itens_adicionais: [
    {
      id_funeral_item: 'i2',
      id_item_catalogo: 'cat2',
      nome: 'Coroa de flores',
      categoria: 'Flores',
      variacao: 'Grande',
      quantidade: 2,
      preco_unitario: 150,
      subtotal: 300,
      somente_diferenca_variacao: false,
    },
  ],
  total_adicional: 300,
};

const item = (parcial: Record<string, unknown>) => ({
  id_categoria: 'g1',
  descricao: null,
  preco: 40,
  controla_estoque: false,
  quantidade_estoque: null,
  imagem_url: null,
  ativo: true,
  id_terceiro_fornecedor: null,
  variacoes: [],
  ...parcial,
});

const CATALOGO = [
  item({
    id_item: 'cat2',
    nome: 'Coroa de flores',
    preco: 150,
    variacoes: [{ id_variacao: 'v1', nome: 'Grande', acrescimo_preco: 50, ativo: true }],
  }),
  item({ id_item: 'cat3', nome: 'Livro de presença' }),
  item({ id_item: 'cat4', nome: 'Velas', controla_estoque: true, quantidade_estoque: 0 }),
];

const ORCAMENTO_PENDENTE = {
  id_orcamento: 'o1',
  status: 'PENDENTE',
  itens: [
    {
      id_funeral_item: 'i2',
      nome: 'Coroa de flores',
      variacao: 'Grande',
      quantidade: 2,
      preco_unitario: 150,
      subtotal: 300,
      somente_diferenca_variacao: false,
    },
  ],
  total: 300,
  gerado_em: '2026-11-01T12:00:00Z',
  aprovado_por: null,
  aprovado_em: null,
  id_fatura: null,
  link_pagamento: null,
  fatura_pendente: false,
};

const ORCAMENTO_APROVADO = {
  ...ORCAMENTO_PENDENTE,
  status: 'APROVADO',
  aprovado_por: 'Ana Souza',
  aprovado_em: '2026-11-01T13:00:00Z',
  id_fatura: 'fat1',
  link_pagamento: 'https://pagamento.exemplo/o1',
};

const BENEFICIARIO = {
  id_beneficiario: 'b1',
  nome: 'Maria Souza',
  responsavel: { nome: 'Ana Souza', telefone: '44999990000', parentesco: 'Filha' },
};

const NAO_GERADO = { status: 404, detail: 'Orçamento não gerado.', code: 'Orcamento.NaoGerado' };

let funeral: Record<string, unknown>;
let composicao: Record<string, unknown>;
let orcamento: Record<string, unknown> | null;

const rotas = [{ path: '/painel/funerais/:id', element: <FuneralPainelPage /> }];
const abrir = () => renderizar(rotas, { caminho: '/painel/funerais/f1' });
type Usuario = ReturnType<typeof abrir>['usuario'];

const irParaAba = async (usuario: Usuario, nome: string) =>
  usuario.click(await screen.findByRole('tab', { name: nome }));

beforeEach(() => {
  entrarComo('FUNERARIA', 'Gestor');
  funeral = FUNERAL;
  composicao = COMPOSICAO;
  orcamento = null;
  servidor.use(
    http.get('*/api/v1/funerais/f1', () => HttpResponse.json(funeral)),
    http.get('*/api/v1/funerais/f1/itens', () => HttpResponse.json(composicao)),
    http.get('*/api/v1/gestao/catalogo', () => HttpResponse.json(CATALOGO)),
    http.get('*/api/v1/funerais/f1/orcamento', () =>
      orcamento ? HttpResponse.json(orcamento) : HttpResponse.json(NAO_GERADO, { status: 404 }),
    ),
    http.get('*/api/v1/beneficiarios/b1', () => HttpResponse.json(BENEFICIARIO)),
  );
});

describe('FuneralPainelPage: dados e situação', () => {
  it('mostra os dados e só oferece as mudanças de situação liberadas pela API', async () => {
    abrir();

    expect(await screen.findByText('Família pediu flores brancas')).toBeInTheDocument();
    expect(screen.getByText('Sepultamento')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Dados' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Iniciar preparação' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar funeral' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Iniciar velório' })).not.toBeInTheDocument();
  });

  it('muda a situação com uma observação opcional', async () => {
    let corpo: unknown;
    servidor.use(
      http.patch('*/api/v1/funerais/f1/status', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ ...FUNERAL, status: 'EM_PREPARACAO' });
      }),
    );
    const { usuario } = abrir();

    await usuario.click(await screen.findByRole('button', { name: 'Iniciar preparação' }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.type(within(dialogo).getByLabelText('Observação (opcional)'), 'Equipe a caminho');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(corpo).toEqual({ status: 'EM_PREPARACAO', observacao: 'Equipe a caminho' });
  });

  it('exige o motivo para cancelar o funeral', async () => {
    let chamou = false;
    servidor.use(
      http.patch('*/api/v1/funerais/f1/status', () => {
        chamou = true;
        return HttpResponse.json(FUNERAL);
      }),
    );
    const { usuario } = abrir();

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar funeral' }));
    const dialogo = await screen.findByRole('dialog');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Confirmar' }));

    expect(
      await within(dialogo).findByText('Informe o motivo do cancelamento.'),
    ).toBeInTheDocument();
    expect(chamou).toBe(false);
  });

  it('não oferece mudanças quando o funeral está concluído', async () => {
    funeral = { ...FUNERAL, status: 'CONCLUIDO', proximos_status: [] };
    abrir();

    expect(
      await screen.findByText('Este funeral não aceita novas mudanças de situação.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar funeral' })).not.toBeInTheDocument();
  });
});

describe('FuneralPainelPage: histórico', () => {
  it('lista as mudanças da mais recente para a mais antiga', async () => {
    funeral = {
      ...FUNERAL,
      status: 'EM_PREPARACAO',
      proximos_status: ['VELORIO', 'CANCELADO'],
      historico: [
        ...(FUNERAL.historico as unknown[]),
        {
          de: 'REGISTRADO',
          para: 'EM_PREPARACAO',
          id_usuario: 'u1',
          observacao: 'Iniciada a preparação',
          em: '2026-11-02T09:00:00Z',
        },
      ],
    };
    const { usuario } = abrir();

    await irParaAba(usuario, 'Histórico');

    const painel = await screen.findByRole('tabpanel');
    const mudancas = within(painel).getAllByRole('listitem');
    expect(mudancas).toHaveLength(2);
    expect(mudancas[0]).toHaveTextContent('Registrado → Em preparação');
    expect(mudancas[0]).toHaveTextContent('Iniciada a preparação');
    expect(mudancas[1]).toHaveTextContent('Funeral registrado');
  });
});

describe('FuneralPainelPage: itens e personalização', () => {
  it('separa o que o plano cobre do que é adicional e mostra o total', async () => {
    const { usuario } = abrir();
    await irParaAba(usuario, 'Itens e personalização');

    expect(await screen.findByText('Urna simples')).toBeInTheDocument();
    expect(screen.getByText('Cobertos pelo plano')).toBeInTheDocument();
    expect(screen.getByText('Adicionais (pagos pela família)')).toBeInTheDocument();
    expect(screen.getByText('Coroa de flores')).toBeInTheDocument();
    expect(screen.getByText('Total adicional').parentElement).toHaveTextContent('R$ 300,00');
  });

  it('importa as preferências da família e avisa o que não entrou', async () => {
    servidor.use(
      http.post('*/api/v1/funerais/f1/itens/importar-preferencias', () =>
        HttpResponse.json({
          importados: 2,
          ignorados: [{ id_item_catalogo: 'cat3', motivo: 'Já está no funeral' }],
          composicao: COMPOSICAO,
        }),
      ),
    );
    const { usuario } = abrir();
    await irParaAba(usuario, 'Itens e personalização');

    await usuario.click(
      await screen.findByRole('button', { name: /Importar preferências da família/ }),
    );

    expect(await screen.findByText(/Livro de presença: Já está no funeral/)).toBeInTheDocument();
    expect(screen.getByText(/2 importado\(s\)/)).toBeInTheDocument();
  });

  it('adiciona um item do catálogo com variação e quantidade', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/funerais/f1/itens', async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json(COMPOSICAO, { status: 201 });
      }),
    );
    const { usuario } = abrir();
    await irParaAba(usuario, 'Itens e personalização');

    await screen.findByRole('option', { name: /Coroa de flores · R\$/ });
    expect(screen.getByRole('option', { name: /Velas/ })).toBeDisabled();
    await usuario.selectOptions(screen.getByLabelText('Item'), 'cat2');
    await usuario.selectOptions(screen.getByLabelText('Variação'), 'v1');
    await usuario.clear(screen.getByLabelText('Quantidade'));
    await usuario.type(screen.getByLabelText('Quantidade'), '3');
    await usuario.click(screen.getByRole('button', { name: 'Adicionar ao funeral' }));

    await waitFor(() =>
      expect(corpo).toEqual({ id_item_catalogo: 'cat2', id_variacao: 'v1', quantidade: 3 }),
    );
  });

  it('remove um item do funeral', async () => {
    let removido: string | readonly string[] | undefined;
    servidor.use(
      http.delete('*/api/v1/funerais/f1/itens/:idItem', ({ params }) => {
        removido = params.idItem;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { usuario } = abrir();
    await irParaAba(usuario, 'Itens e personalização');

    await usuario.click(await screen.findByRole('button', { name: 'Remover Coroa de flores' }));

    await waitFor(() => expect(removido).toBe('i2'));
  });

  it('não deixa alterar os itens de um funeral concluído', async () => {
    funeral = { ...FUNERAL, status: 'CONCLUIDO', proximos_status: [] };
    const { usuario } = abrir();
    await irParaAba(usuario, 'Itens e personalização');

    expect(await screen.findByText('Urna simples')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Adicionar ao funeral' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Importar preferências/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remover / })).not.toBeInTheDocument();
  });
});

describe('FuneralPainelPage: orçamento', () => {
  it('gera o orçamento e depois aprova com o nome de quem respondeu pela família', async () => {
    let corpo: unknown;
    servidor.use(
      http.post('*/api/v1/funerais/f1/orcamento', () => {
        orcamento = ORCAMENTO_PENDENTE;
        return HttpResponse.json(ORCAMENTO_PENDENTE, { status: 201 });
      }),
      http.post('*/api/v1/funerais/f1/orcamento/aprovar', async ({ request }) => {
        corpo = await request.json();
        orcamento = ORCAMENTO_APROVADO;
        return HttpResponse.json(ORCAMENTO_APROVADO);
      }),
    );
    const { usuario } = abrir();
    await irParaAba(usuario, 'Itens e personalização');

    expect(await screen.findByText('Nenhum orçamento gerado')).toBeInTheDocument();
    const gerar = screen.getByRole('button', { name: 'Gerar orçamento' });
    await waitFor(() => expect(gerar).toBeEnabled());
    await usuario.click(gerar);

    expect(await screen.findByText('Aguardando aprovação')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Aprovar orçamento' }));
    const dialogo = await screen.findByRole('dialog');
    await waitFor(() =>
      expect(within(dialogo).getByLabelText('Quem da família aprovou')).toHaveValue('Ana Souza'),
    );
    await usuario.click(within(dialogo).getByRole('button', { name: 'Confirmar aprovação' }));

    expect(
      await screen.findByRole('link', { name: 'Abrir a página de pagamento' }),
    ).toHaveAttribute('href', 'https://pagamento.exemplo/o1');
    expect(corpo).toEqual({ id_orcamento: 'o1', nome_responsavel: 'Ana Souza' });
  });

  it('oferece emitir a fatura de novo quando ela ficou pendente', async () => {
    orcamento = {
      ...ORCAMENTO_APROVADO,
      id_fatura: null,
      link_pagamento: null,
      fatura_pendente: true,
    };
    const { usuario } = abrir();
    await irParaAba(usuario, 'Itens e personalização');

    expect(await screen.findByText(/A fatura ainda não foi emitida/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar emitir a fatura' })).toBeInTheDocument();
  });

  it('não permite gerar orçamento quando não há itens adicionais', async () => {
    composicao = { ...COMPOSICAO, itens_adicionais: [], total_adicional: 0 };
    const { usuario } = abrir();
    await irParaAba(usuario, 'Itens e personalização');

    expect(await screen.findByText('Não há itens adicionais para cobrar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar orçamento' })).toBeDisabled();
  });
});
