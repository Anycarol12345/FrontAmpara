import type {
  RegistroAuditoriaResponse,
  FunerariaListaResponse,
  AtribuicaoResponse,
  TerceiroResponse,
  TransladoFrotaResponse,
  CertidaoResponse,
  FuneralResumoResponse,
  PrazoRegistroResponse,
  EnderecoRequest,
  FaixaKm,
  HistoricoTransladoResponse,
  SimulacaoResponse,
  StatusTranslado,
  LocalResponse,
  ReservaResponse,
  ConfiguracaoTransladoResponse,
  ConfiguracoesResponse,
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
import { funeralDeExemplo, ID_FUNERAL_EXEMPLO } from '../exemplos';
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
  id_terceiro_fornecedor: null,
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
    motivo_cancelamento: null,
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

/** Configurações completas da funerária de demonstração (ADM-12). Multa nula: contratação bloqueada. */
export const configuracoesDemo = (): ConfiguracoesResponse => ({
  id_tenant: 'tenant-demo',
  nome_fantasia: FUNERARIA.nome_fantasia,
  slug: FUNERARIA.slug,
  status: 'ATIVA',
  cobranca_configurada: true,
  identidade_visual: {
    ...FUNERARIA.identidade_visual,
    cor_primaria: '#3E5C54',
    cor_secundaria: '#C9A66B',
    endereco: {
      logradouro: 'Rua das Acácias',
      numero: '120',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01310100',
    },
  },
  parametros: {
    cobranca: {
      modo_vencimento: 'ESCOLHA_CLIENTE',
      dia_vencimento_fixo: 10,
      dias_vencimento_permitidos: [5, 10, 15, 20],
      tolerancia_dias: 5,
      multa_percentual: null,
      juros_mensal_percentual: 1,
      desconto_anual_percentual: 10,
      reajuste_anual_percentual: 4.5,
    },
    lembretes: { dias_antes: [5, 1, 0], dias_depois: [1, 3, 7] },
    terceiros: { prazo_aceite_horas: 2 },
    certidao: { modo: 'MANUAL' },
  },
});

export const tabelaKmDemo = (): ConfiguracaoTransladoResponse => ({
  faixas: [
    { de_km: 0, ate_km: 30, valor: 250, valor_km_excedente: null },
    { de_km: 30, ate_km: 100, valor: 600, valor_km_excedente: null },
    { de_km: 100, ate_km: null, valor: 900, valor_km_excedente: 4.5 },
  ],
  documentos_exigidos: {
    MUNICIPAL: ['Certidão de óbito'],
    INTERMUNICIPAL: ['Certidão de óbito', 'Autorização de translado'],
    INTERESTADUAL: ['Certidão de óbito', 'Autorização de translado', 'Atestado de embalsamamento'],
  },
});

/** Salas e locais da demonstração (ADM-06). */
export const locaisDemo = (): LocalResponse[] =>
  (
    [
      ['local-capela', 'Capela Ampara Jardim · Sala 2', 'SALA_VELORIO', true, 60, true],
      ['local-sala1', 'Capela Ampara Jardim · Sala 1', 'SALA_VELORIO', true, 60, true],
      ['local-ipe', 'Sala Ipê', 'SALA_VELORIO', true, 90, true],
      ['local-cemiterio', 'Cemitério da Paz', 'CEMITERIO', false, 0, true],
      ['local-igreja', 'Paróquia São José', 'IGREJA', false, 0, false],
    ] as const
  ).map(([id_local, nome, tipo, proprio, intervalo, ativo]) => ({
    id_local,
    nome,
    tipo,
    endereco: proprio ? 'Rua das Acácias, 120' : null,
    proprio,
    intervalo_preparacao_minutos: intervalo,
    ativo,
  }));

type ReservaDemo = ReservaResponse & { id_funeral: string; nome_falecido: string };

/** As reservas do funeral de exemplo e mais duas de outros funerais, para a agenda ter movimento. */
export function reservasDemo(): ReservaDemo[] {
  const agora = new Date();
  const as = (dias: number, h: number) =>
    new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + dias, h).toISOString();
  const exemplo = funeralDeExemplo();
  return [
    ...exemplo.reservas.map((r) => ({
      ...r,
      id_funeral: ID_FUNERAL_EXEMPLO,
      nome_falecido: exemplo.nome_falecido,
    })),
    {
      id_reserva: 'reserva-outro-1',
      id_local: 'local-sala1',
      nome_local: 'Capela Ampara Jardim · Sala 1',
      tipo_local: 'SALA_VELORIO',
      inicio: as(0, 8),
      fim: as(0, 14),
      id_funeral: 'funeral-outro-1',
      nome_falecido: 'José Almeida',
    },
    {
      id_reserva: 'reserva-outro-2',
      id_local: 'local-ipe',
      nome_local: 'Sala Ipê',
      tipo_local: 'SALA_VELORIO',
      inicio: as(0, 15),
      fim: as(0, 21),
      id_funeral: 'funeral-outro-2',
      nome_falecido: 'Lúcia Ferraz',
    },
  ];
}

/** Tira os campos nulos de um endereço enviado pela tela. */
export const limparNulos = (endereco: EnderecoRequest | null) =>
  Object.fromEntries(Object.entries(endereco ?? {}).filter(([, v]) => v != null)) as Record<
    string,
    string
  >;

export const mudancaTranslado = (
  de: StatusTranslado,
  para: StatusTranslado,
  observacao: string | null | undefined,
  horas = 0,
): HistoricoTransladoResponse => ({
  de,
  para,
  id_usuario: 'us-juliana',
  observacao: observacao ?? null,
  em: new Date(Date.now() + horas * 3_600_000).toISOString(),
});

/**
 * Preço do translado pela tabela de km (TRA-02, TRA-03). Sem distância informada, a demonstração
 * usa 12 km na mesma cidade, 95 km no mesmo estado e 430 km entre estados. O plano cobre até 50 km.
 */
export function simularTransladoDemo(
  dados: {
    origem: EnderecoRequest | null;
    destino: EnderecoRequest | null;
    distancia_km: number | null;
  },
  faixas: FaixaKm[],
): SimulacaoResponse {
  const mesmaUf = dados.origem?.uf === dados.destino?.uf;
  const mesmaCidade =
    mesmaUf &&
    dados.origem?.cidade?.trim().toLowerCase() === dados.destino?.cidade?.trim().toLowerCase();
  const tipo = mesmaCidade ? 'MUNICIPAL' : mesmaUf ? 'INTERMUNICIPAL' : 'INTERESTADUAL';
  const distancia = dados.distancia_km ?? (mesmaCidade ? 12 : mesmaUf ? 95 : 430);
  const preco = (km: number) => {
    const faixa = faixas.find((f) => km >= f.de_km && (f.ate_km == null || km < f.ate_km));
    if (!faixa) return 0;
    const excedente =
      faixa.ate_km == null ? (km - faixa.de_km) * (faixa.valor_km_excedente ?? 0) : 0;
    return Number(faixa.valor) + excedente;
  };
  const valor = preco(distancia);
  const coberto = Math.min(valor, preco(Math.min(distancia, 50)));
  return {
    tipo,
    distancia_km: distancia,
    distancia_manual: dados.distancia_km != null,
    valor,
    valor_coberto_plano: coberto,
    valor_a_pagar: valor - coberto,
  };
}

/** Prazo legal do registro do óbito a partir de hoje (CER-03). */
export function prazoDemo(dias: number): PrazoRegistroResponse {
  const data = new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);
  return { data, dias_restantes: dias, vencido: dias < 0 };
}

export const novaCertidaoDemo = (idBeneficiario: string): CertidaoResponse => ({
  id_solicitacao: `certidao-${idBeneficiario}`,
  id_beneficiario: idBeneficiario,
  status: 'SOLICITADA',
  modo: 'MANUAL',
  responsavel: null,
  protocolo: null,
  pendencia: null,
  numero_matricula: null,
  id_documento_certidao: null,
  prazo: prazoDemo(1),
  historico: [
    {
      de: 'SOLICITADA',
      para: 'SOLICITADA',
      id_usuario: 'us-juliana',
      observacao: 'Pedido registrado',
      em: new Date().toISOString(),
    },
  ],
});

/** Os funerais dos outros falecidos que aparecem na agenda (ADM-06). */
export function outrosFuneraisDemo(): FuneralResumoResponse[] {
  const hoje = new Date();
  const as = (h: number) =>
    new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), h).toISOString();
  return [
    {
      id_funeral: 'funeral-outro-1',
      id_beneficiario: 'beneficiario-outro-1',
      nome_falecido: 'José Almeida',
      status: 'VELORIO',
      data_hora_prevista: as(8),
      destinacao: 'CREMACAO',
    },
    {
      id_funeral: 'funeral-outro-2',
      id_beneficiario: 'beneficiario-outro-2',
      nome_falecido: 'Lúcia Ferraz',
      status: 'REGISTRADO',
      data_hora_prevista: as(15),
      destinacao: 'SEPULTAMENTO',
    },
  ];
}

/** Cadastro da empresa de translado que entra no portal do parceiro (TER-01). */
export const parceiroDemo = (): TerceiroResponse => ({
  id_terceiro: 'terceiro-boa-viagem',
  tipo: 'FROTA',
  nome_razao_social: 'Translados Boa Viagem',
  cpf_cnpj: '12.345.678/0001-90',
  telefone: '(11) 3222-1100',
  email: 'operacao@boaviagem.demo',
  area_atuacao: { ufs: ['SP'], cidades: [] },
  categorias_atendidas: [],
  status: 'ATIVO',
});

const ORIGEM = {
  endereco: 'Hospital Municipal Vila Nova',
  cidade: 'Campinas',
  uf: 'SP',
  pais: 'BR',
};
const DESTINO = { endereco: 'Rua das Acácias, 120', cidade: 'São Paulo', uf: 'SP', pais: 'BR' };

/** Um translado novo para responder e outro já aceito, sem motorista (TER-02, TRA-04). */
export function atribuicoesDemo(): AtribuicaoResponse[] {
  const daqui = (horas: number) => new Date(Date.now() + horas * 3_600_000).toISOString();
  const resumo = (nome: string, horas: number) =>
    ({
      nome_falecido: nome,
      origem: `${ORIGEM.endereco}, ${ORIGEM.cidade}-${ORIGEM.uf}`,
      destino: `${DESTINO.endereco}, ${DESTINO.cidade}-${DESTINO.uf}`,
      data_hora: daqui(horas),
      contato: { nome: 'Juliana Rocha', telefone: '(11) 3333-4444' },
      documentos: [{ nome: 'Declaração de óbito', id_documento: 'doc-declaracao' }],
    }) as AtribuicaoResponse['resumo'];
  return [
    {
      id_atribuicao: 'atribuicao-nova',
      tipo: 'TRANSLADO',
      id_origem: 'translado-frota-novo',
      status: 'PENDENTE',
      prazo_aceite: daqui(1.5),
      respondida_em: null,
      motivo_recusa: null,
      resumo: resumo('José Almeida', 5),
    },
    {
      id_atribuicao: 'atribuicao-aceita',
      tipo: 'TRANSLADO',
      id_origem: 'translado-frota-aceito',
      status: 'ACEITA',
      prazo_aceite: daqui(-2),
      respondida_em: daqui(-3),
      motivo_recusa: null,
      resumo: resumo('Lúcia Ferraz', 2),
    },
  ];
}

export function transladosDaFrotaDemo(): TransladoFrotaResponse[] {
  const daqui = (horas: number) => new Date(Date.now() + horas * 3_600_000).toISOString();
  const translado = (id: string, nome: string, horas: number): TransladoFrotaResponse => ({
    id_translado: id,
    nome_falecido: nome,
    status: 'AGENDADO',
    origem: ORIGEM,
    destino: DESTINO,
    data_prevista: daqui(horas),
    contato_nome: 'Juliana Rocha',
    contato_telefone: '(11) 3333-4444',
    status_aceite: 'ACEITO',
    motorista: null,
  });
  return [
    translado('translado-frota-novo', 'José Almeida', 5),
    translado('translado-frota-aceito', 'Lúcia Ferraz', 2),
  ];
}

/** Funerárias da plataforma: duas aguardando aprovação do auto-cadastro (TEN-01). */
export function funerariasDemo(): FunerariaListaResponse[] {
  const dias = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  return (
    [
      [
        'tenant-demo',
        'Funerária Ampara Demonstração',
        'Ampara Demonstração Ltda',
        '11222333000181',
        'demo',
        'ATIVA',
        'ADMIN',
        120,
      ],
      [
        'tenant-sao-jose',
        'Funerária São José',
        'São José Serviços Póstumos Ltda',
        '45723174000110',
        'sao-jose',
        'PENDENTE',
        'AUTO',
        1,
      ],
      [
        'tenant-ipe',
        'Ipê Assistência Funeral',
        'Ipê Assistência Ltda',
        '33000167000101',
        'ipe',
        'PENDENTE',
        'AUTO',
        2,
      ],
      [
        'tenant-paz',
        'Grupo Paz Eterna',
        'Paz Eterna Funerária S/A',
        '60746948000112',
        'paz-eterna',
        'ATIVA',
        'CONSULTOR',
        40,
      ],
      [
        'tenant-luz',
        'Funerária Luz Divina',
        'Luz Divina ME',
        '19131243000197',
        'luz-divina',
        'SUSPENSA',
        'AUTO',
        90,
      ],
    ] as const
  ).map(([id_tenant, nome_fantasia, razao_social, cnpj, slug, status, origem_cadastro, idade]) => ({
    id_tenant,
    nome_fantasia,
    razao_social,
    cnpj,
    slug,
    email_contato: `contato@${slug}.com.br`,
    status,
    origem_cadastro,
    criada_em: dias(idade),
  }));
}

/** Conteúdo de exemplo dos relatórios em CSV (ponto e vírgula, como o backend). */
export function csvDemo(relatorio: string) {
  const linhas: Record<string, string[]> = {
    financeiro: [
      'fatura;titular;vencimento;valor;status',
      'ft-1;Ana Souza;10/11/2026;54,90;PENDENTE',
      'ft-2;Carlos Menezes;05/11/2026;89,90;PAGA',
    ],
    contratos: [
      'contrato;titular;plano;inicio;status',
      'ct-1;Ana Souza;Acolher;12/03/2025;ATIVO',
      'ct-2;Paulo Reis;Essencial;01/10/2026;A_PAGAR',
    ],
    funerais: [
      'funeral;falecido;cerimonia;destinacao;status',
      'fu-1;Helena Duarte;03/11/2026;SEPULTAMENTO;EM_PREPARACAO',
    ],
  };
  return `\uFEFF${(linhas[relatorio] ?? ['sem dados']).join('\n')}`;
}

/** Ações recentes da equipe na funerária de demonstração (REL-03). */
export function auditoriaDemo(): RegistroAuditoriaResponse[] {
  const horas = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();
  const registro = (
    id: string,
    h: number,
    acao: string,
    entidade: string,
    nome: string,
    antes: object | null,
    depois: object | null,
  ): RegistroAuditoriaResponse => ({
    id_auditoria: id,
    data_hora: horas(h),
    acao,
    entidade,
    id_entidade: `${entidade.toLowerCase()}-1`,
    id_usuario: 'us-marcos',
    nome_usuario: nome,
    ip: '177.38.12.4',
    valores_anteriores: antes,
    valores_novos: depois,
  });
  return [
    registro(
      'au-1',
      1,
      'FATURA_BAIXA_MANUAL',
      'Fatura',
      'Juliana Rocha',
      { status: 'VENCIDA' },
      { status: 'PAGA', forma: 'PIX' },
    ),
    registro(
      'au-2',
      3,
      'PLANO_ALTERADO',
      'Plano',
      'Marcos Lima',
      { valor_mensal: 49.9 },
      { valor_mensal: 54.9 },
    ),
    registro(
      'au-3',
      5,
      'FUNERAL_STATUS_ALTERADO',
      'Funeral',
      'Juliana Rocha',
      { status: 'REGISTRADO' },
      { status: 'EM_PREPARACAO' },
    ),
    registro('au-4', 26, 'CONTRATO_CRIADO', 'Contrato', 'Rafael Nunes', null, {
      plano: 'Essencial',
      titular: 'Paulo Reis',
    }),
    registro('au-5', 50, 'RELATORIO_EXPORTADO', 'Relatorio', 'Marcos Lima', null, {
      relatorio: 'financeiro',
      formato: 'csv',
    }),
  ];
}
