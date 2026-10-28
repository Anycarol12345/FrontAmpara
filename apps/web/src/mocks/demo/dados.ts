import type {
  CategoriaResponse,
  ClienteResponse,
  ContratoDetalheResponse,
  ContratoResumoResponse,
  DependenteResponse,
  IdentidadeVisualResponse,
  ItemResponse,
  MembroEquipeResponse,
  PlanoResponse,
} from '@ampara/api-client';
import type { Cenario } from './sessao';

// Uma funerária de demonstração coerente: os mesmos planos, catálogo, clientes e contratos
// aparecem na área do cliente e no painel da equipe.

export const FUNERARIA: IdentidadeVisualResponse = {
  slug: 'demo',
  nome_fantasia: 'Funerária Ampara Demonstração',
  identidade_visual: {
    nome_exibicao: 'Ampara Demonstração',
    logo_url: null,
    email: 'atendimento@ampara.demo',
    telefone: '(11) 3333-4444',
    whatsapp: '(11) 99999-0000',
    horario_atendimento: 'Atendimento 24 horas, todos os dias, inclusive feriados.',
  },
};

export const CATEGORIAS: CategoriaResponse[] = [
  { id_categoria: 'cat-urna', nome: 'Urna', ordem: 1, ativo: true },
  { id_categoria: 'cat-flores', nome: 'Flores', ordem: 2, ativo: true },
  { id_categoria: 'cat-velorio', nome: 'Velório', ordem: 3, ativo: true },
  { id_categoria: 'cat-cerimonia', nome: 'Cerimônia', ordem: 4, ativo: true },
  { id_categoria: 'cat-transmissao', nome: 'Transmissão online', ordem: 5, ativo: true },
  { id_categoria: 'cat-alimentacao', nome: 'Alimentação', ordem: 6, ativo: true },
];

const item = (
  id_item: string,
  id_categoria: string,
  nome: string,
  preco: number,
  descricao: string | null = null,
  variacoes: [string, number][] = [],
): ItemResponse => ({
  id_item,
  id_categoria,
  nome,
  descricao,
  preco,
  controla_estoque: false,
  quantidade_estoque: null,
  imagem_url: null,
  ativo: true,
  variacoes: variacoes.map(([nomeVariacao, acrescimo], i) => ({
    id_variacao: `${id_item}-v${i + 1}`,
    nome: nomeVariacao,
    acrescimo_preco: acrescimo,
    ativo: true,
  })),
});

export const CATALOGO: ItemResponse[] = [
  item(
    'it-urna-1',
    'cat-urna',
    'Urna sextavada em madeira',
    1800,
    'Acabamento acetinado e alças em metal.',
    [
      ['Em mogno', 900],
      ['Com visor', 350],
    ],
  ),
  item('it-urna-2', 'cat-urna', 'Urna ecológica', 1400, 'Feita de material biodegradável.'),
  item('it-flor-1', 'cat-flores', 'Arranjo de rosas brancas', 180),
  item('it-flor-2', 'cat-flores', 'Coroa de flores do campo', 350, 'Com faixa de homenagem.', [
    ['Grande', 120],
  ]),
  item('it-vel-1', 'cat-velorio', 'Sala de velório (8 horas)', 900),
  item(
    'it-vel-2',
    'cat-velorio',
    'Sala de velório reservada (12 horas)',
    1600,
    'Sala ampla, com copa.',
  ),
  item('it-cer-1', 'cat-cerimonia', 'Cerimonialista', 450),
  item('it-cer-2', 'cat-cerimonia', 'Música ao vivo (violino)', 600),
  item(
    'it-tra-1',
    'cat-transmissao',
    'Transmissão online da cerimônia',
    300,
    'Link para quem não pode estar presente.',
  ),
  item('it-ali-1', 'cat-alimentacao', 'Café e lanches para a família', 380),
];

const plano = (
  id_plano: string,
  nome: string,
  descricao: string,
  [valor_mensal, valor_anual, valor_dependente_mensal, valor_dependente_anual]: number[],
  carencia_dias: number,
  limite_dependentes: number,
  coberturas: string[],
): PlanoResponse => ({
  id_plano,
  nome,
  descricao,
  valor_mensal: valor_mensal!,
  valor_anual: valor_anual!,
  valor_dependente_mensal: valor_dependente_mensal!,
  valor_dependente_anual: valor_dependente_anual!,
  carencia_dias,
  limite_dependentes,
  permite_somente_dependente: true,
  configuracoes: { velorio: { horas_incluidas: 8, sala_vip: false } },
  ativo: true,
  coberturas: coberturas.map((id, i) => {
    const coberto = CATALOGO.find((c) => c.id_item === id)!;
    return {
      id_plano_cobertura: `${id_plano}-cob-${i + 1}`,
      id_item_catalogo: id,
      nome: coberto.nome,
      categoria: CATEGORIAS.find((c) => c.id_categoria === coberto.id_categoria)!.nome,
      quantidade: 1,
      km_translado_incluso: null,
      item_ativo: true,
    };
  }),
});

export const PLANOS: PlanoResponse[] = [
  plano(
    'pl-essencial',
    'Essencial',
    'O cuidado necessário, com tranquilidade.',
    [39.9, 430, 9.9, 107],
    90,
    2,
    ['it-urna-2', 'it-vel-1', 'it-flor-1'],
  ),
  plano(
    'pl-acolher',
    'Acolher',
    'Mais conforto para você e sua família.',
    [69.9, 755, 14.9, 161],
    60,
    4,
    ['it-urna-1', 'it-vel-1', 'it-flor-1', 'it-flor-2', 'it-tra-1'],
  ),
  plano(
    'pl-completo',
    'Completo',
    'Uma homenagem completa, sem preocupações.',
    [119.9, 1295, 24.9, 269],
    30,
    6,
    [
      'it-urna-1',
      'it-vel-2',
      'it-flor-1',
      'it-flor-2',
      'it-cer-1',
      'it-cer-2',
      'it-tra-1',
      'it-ali-1',
    ],
  ),
];

export const ANA: ClienteResponse = {
  id_cliente: 'cl-ana',
  nome: 'Ana Souza',
  cpf: '52998224725',
  data_nascimento: '1978-05-14',
  email: 'ana.souza@exemplo.com',
  telefone: '11987654321',
  endereco: 'Rua das Palmeiras, 85 - Vila Mariana',
  cep: '04117000',
  cidade: 'São Paulo',
  estado: 'SP',
};

const dependente = (
  id_dependente: string,
  nome: string,
  cpf: string,
  data_nascimento: string,
  parentesco: string,
): DependenteResponse => ({
  id_dependente,
  id_cliente: ANA.id_cliente,
  nome,
  cpf,
  data_nascimento,
  parentesco,
  telefone: null,
  email: null,
});

export const DEPENDENTES_ANA: DependenteResponse[] = [
  dependente('dep-carlos', 'Carlos Souza', '11144477735', '1975-09-02', 'Cônjuge'),
  dependente('dep-lucia', 'Lúcia Souza', '39053344705', '1950-01-20', 'Mãe'),
  dependente('dep-pedro', 'Pedro Souza', '12345678909', '2008-11-11', 'Filho(a)'),
];

/** Outros clientes da funerária, para as listas do painel. */
export const OUTROS_CLIENTES: ClienteResponse[] = [
  ['cl-joao', 'João Pereira', '28625587887', '1962-03-08', 'Campinas'],
  ['cl-maria', 'Maria Oliveira', '86288366757', '1985-12-01', 'São Paulo'],
  ['cl-roberto', 'Roberto Almeida', '45317828791', '1955-07-19', 'Santo André'],
  ['cl-fernanda', 'Fernanda Costa', '71428793860', '1990-04-25', 'São Paulo'],
  ['cl-antonio', 'Antônio Ribeiro', '04154473085', '1948-10-30', 'Osasco'],
  ['cl-patricia', 'Patrícia Mendes', '15350946056', '1982-02-14', 'Guarulhos'],
].map(([id_cliente, nome, cpf, data_nascimento, cidade]) => ({
  id_cliente: id_cliente!,
  nome: nome!,
  cpf: cpf!,
  data_nascimento: data_nascimento!,
  email: `${nome!
    .split(' ')[0]!
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z]/g, '')}@exemplo.com`,
  telefone: '11912345678',
  endereco: null,
  cep: null,
  cidade: cidade!,
  estado: 'SP',
}));

const somarDias = (dia: string, dias: number) => {
  const d = new Date(`${dia}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
};

/** Monta um contrato completo (CON-01) a partir do plano, do titular e dos dependentes cobertos. */
export function montarContrato(dados: {
  id_contrato: string;
  titular: ClienteResponse;
  id_plano: string;
  dependentes: DependenteResponse[];
  periodicidade: 'MENSAL' | 'ANUAL';
  status: ContratoDetalheResponse['status'];
  data_contratacao: string;
  dia_vencimento: number;
  somenteDependentes?: boolean;
}): ContratoDetalheResponse {
  const p = PLANOS.find((x) => x.id_plano === dados.id_plano) ?? PLANOS[0]!;
  const anual = dados.periodicidade === 'ANUAL';
  const valorPlano = anual ? p.valor_anual : p.valor_mensal;
  const valorDependente = anual ? p.valor_dependente_anual : p.valor_dependente_mensal;
  const carencia = (inclusao: string) => somarDias(inclusao, p.carencia_dias);
  const titularCoberto = !dados.somenteDependentes;
  return {
    id_contrato: dados.id_contrato,
    titular: {
      id_cliente: dados.titular.id_cliente,
      nome: dados.titular.nome,
      cpf: dados.titular.cpf,
    },
    id_plano: p.id_plano,
    nome_plano: p.nome,
    tipo_cobertura: dados.somenteDependentes
      ? 'SOMENTE_DEPENDENTES'
      : dados.dependentes.length
        ? 'TITULAR_E_DEPENDENTES'
        : 'TITULAR',
    periodicidade: dados.periodicidade,
    dia_vencimento: dados.dia_vencimento,
    data_contratacao: dados.data_contratacao,
    data_fim: dados.status === 'CANCELADO' ? somarDias(dados.data_contratacao, 200) : null,
    status: dados.status,
    valor_plano: valorPlano,
    valor_por_dependente: valorDependente,
    valor_total:
      Math.round(
        ((titularCoberto ? valorPlano : 0) + valorDependente * dados.dependentes.length) * 100,
      ) / 100,
    carencia_dias: p.carencia_dias,
    id_consultor: null,
    pessoas_cobertas: [
      ...(titularCoberto
        ? [
            {
              id_pessoa_coberta: `${dados.id_contrato}-titular`,
              tipo: 'TITULAR' as const,
              id_dependente: null,
              nome: dados.titular.nome,
              cpf: dados.titular.cpf,
              data_inclusao: dados.data_contratacao,
              carencia_cumprida_em: carencia(dados.data_contratacao),
            },
          ]
        : []),
      ...dados.dependentes.map((d) => ({
        id_pessoa_coberta: `${dados.id_contrato}-${d.id_dependente}`,
        tipo: 'DEPENDENTE' as const,
        id_dependente: d.id_dependente,
        nome: d.nome,
        cpf: d.cpf,
        data_inclusao: dados.data_contratacao,
        carencia_cumprida_em: carencia(dados.data_contratacao),
      })),
    ],
  };
}

export const resumoDoContrato = (c: ContratoDetalheResponse): ContratoResumoResponse => ({
  id_contrato: c.id_contrato,
  id_cliente: c.titular.id_cliente,
  nome_titular: c.titular.nome,
  id_plano: c.id_plano,
  nome_plano: c.nome_plano,
  tipo_cobertura: c.tipo_cobertura,
  periodicidade: c.periodicidade,
  status: c.status,
  valor_total: c.valor_total,
  data_contratacao: c.data_contratacao,
  quantidade_pessoas: c.pessoas_cobertas.length,
});

/** Contratos da Ana conforme o cenário escolhido na página /demo. */
function contratosDaAna(cenario: Cenario): ContratoDetalheResponse[] {
  if (cenario === 'sem-plano') return [];
  return [
    montarContrato({
      id_contrato: cenario === 'suspenso' ? 'ct-ana-suspenso' : 'ct-ana-acolher',
      titular: ANA,
      id_plano: 'pl-acolher',
      dependentes: DEPENDENTES_ANA.slice(0, 2),
      periodicidade: 'MENSAL',
      status: cenario === 'suspenso' ? 'SUSPENSO' : 'ATIVO',
      data_contratacao: '2026-02-10',
      dia_vencimento: 10,
    }),
  ];
}

function contratosDosOutros(): ContratoDetalheResponse[] {
  const [joao, maria, roberto, fernanda, antonio, patricia] = OUTROS_CLIENTES;
  const contrato = (
    id: string,
    titular: ClienteResponse,
    id_plano: string,
    status: ContratoDetalheResponse['status'],
    data_contratacao: string,
    periodicidade: 'MENSAL' | 'ANUAL' = 'MENSAL',
  ) =>
    montarContrato({
      id_contrato: id,
      titular,
      id_plano,
      dependentes: [],
      periodicidade,
      status,
      data_contratacao,
      dia_vencimento: 5,
    });
  return [
    contrato('ct-joao', joao!, 'pl-completo', 'ATIVO', '2025-08-05', 'ANUAL'),
    contrato('ct-maria', maria!, 'pl-essencial', 'A_PAGAR', '2026-10-20'),
    contrato('ct-roberto', roberto!, 'pl-acolher', 'SUSPENSO', '2025-11-05'),
    contrato('ct-fernanda', fernanda!, 'pl-acolher', 'ATIVO', '2026-04-05'),
    contrato('ct-antonio', antonio!, 'pl-essencial', 'CANCELADO', '2024-06-05'),
    contrato('ct-patricia', patricia!, 'pl-completo', 'ATIVO', '2026-01-05'),
  ];
}

export const EQUIPE: MembroEquipeResponse[] = [
  ['us-marcos', 'Marcos Lima', 'marcos@ampara.demo', 'FUNERARIA', true, 'Gestor'],
  ['us-juliana', 'Juliana Rocha', 'juliana@ampara.demo', 'FUNCIONARIO', true, 'Atendente'],
  ['us-rafael', 'Rafael Nunes', 'rafael@ampara.demo', 'CONSULTOR', true, 'Consultor de vendas'],
  ['us-beatriz', 'Beatriz Alves', 'beatriz@ampara.demo', 'FUNCIONARIO', true, 'Cerimonialista'],
  ['us-tiago', 'Tiago Martins', 'tiago@ampara.demo', 'FUNCIONARIO', false, 'Motorista'],
].map(([id_usuario, nome, email, perfil, ativo, cargo]) => ({
  id_usuario: id_usuario as string,
  id_funcionario: id_usuario === 'us-marcos' ? null : `fn-${id_usuario as string}`,
  nome: nome as string,
  email: email as string,
  perfil: perfil as MembroEquipeResponse['perfil'],
  ativo: ativo as boolean,
  cpf: null,
  cargo: cargo as string,
  telefone: null,
}));

/** Banco em memória da demonstração. Alterações valem até recarregar a página. */
export function criarBanco(cenario: Cenario) {
  return {
    meusDados: { ...ANA },
    dependentes: DEPENDENTES_ANA.map((d) => ({ ...d })),
    clientes: [ANA, ...OUTROS_CLIENTES],
    contratos: [...contratosDaAna(cenario), ...contratosDosOutros()],
    planos: PLANOS.map((p) => ({ ...p })),
    equipe: EQUIPE.map((m) => ({ ...m })),
  };
}

export type BancoDemo = ReturnType<typeof criarBanco>;
