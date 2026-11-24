import type {
  CertidaoResponse,
  ComposicaoItensResponse,
  ContratoDetalheResponse,
  DocumentoResponse,
  FormaPagamento,
  FuneralResponse,
  NotificacaoResponse,
  TransladoResponse,
} from '@ampara/api-client';
import type { FaturaFicticia } from './estado';

const iso = (data: Date) => data.toISOString();
const dia = (data: Date) => iso(data).slice(0, 10);
const mais = (horas: number) => new Date(Date.now() + horas * 3_600_000);

// Valores do DEC-12 ainda em aberto: 2% de multa e 1% de juros ao mês, como exemplo.
const MULTA = 0.02;
const JUROS_MES = 0.01;
const FORMAS: FormaPagamento[] = ['PIX', 'CARTAO', 'BOLETO'];

export const linkPagamento = (idFatura: string) => `/pagamento-simulado?fatura=${idFatura}`;

/**
 * Faturas coerentes com o contrato real (COB-01 e COB-03): mensais ou anuais desde a contratação,
 * com a situação do contrato (em dia, aguardando o primeiro pagamento, suspenso ou cancelado).
 */
export function gerarFaturas(contrato: ContratoDetalheResponse): FaturaFicticia[] {
  const hoje = new Date();
  const inicio = new Date(`${contrato.data_contratacao.slice(0, 10)}T12:00:00`);
  const anual = contrato.periodicidade === 'ANUAL';
  const diaVencimento = Math.min(contrato.dia_vencimento || inicio.getDate(), 28);

  const vencimentos: Date[] = [];
  for (
    let d = new Date(inicio.getFullYear(), inicio.getMonth(), diaVencimento, 12);
    d <= hoje || vencimentos.length === 0;
    d = anual
      ? new Date(d.getFullYear() + 1, d.getMonth(), diaVencimento, 12)
      : new Date(d.getFullYear(), d.getMonth() + 1, diaVencimento, 12)
  ) {
    vencimentos.push(d);
  }
  // Mostra no máximo um ano de histórico mensal.
  const recentes = vencimentos.slice(-12);
  if (contrato.status === 'ATIVO') {
    const ultimo = recentes.at(-1)!;
    recentes.push(
      anual
        ? new Date(ultimo.getFullYear() + 1, ultimo.getMonth(), diaVencimento, 12)
        : new Date(ultimo.getFullYear(), ultimo.getMonth() + 1, diaVencimento, 12),
    );
  }

  return recentes.map((vencimento, i) => {
    const ultima = i === recentes.length - 1;
    const id = `${contrato.id_contrato.slice(0, 8)}-${dia(vencimento)}`;
    const base: FaturaFicticia = {
      id_fatura: id,
      id_contrato: contrato.id_contrato,
      competencia: dia(vencimento),
      valor: contrato.valor_total,
      valor_multa_juros: 0,
      encargos_estimados: 0,
      data_vencimento: dia(vencimento),
      status: 'PAGA',
      forma_pagamento: FORMAS[i % FORMAS.length]!,
      link_pagamento: null,
      data_pagamento: dia(new Date(vencimento.getTime() - 2 * 86_400_000)),
    };
    const emAberto = {
      ...base,
      forma_pagamento: null,
      data_pagamento: null,
      link_pagamento: linkPagamento(id),
    };

    if (!ultima) return base;
    if (contrato.status === 'CANCELADO')
      return { ...emAberto, status: 'CANCELADA', link_pagamento: null };
    if (contrato.status === 'SUSPENSO') {
      const atraso = Math.max(1, Math.round((hoje.getTime() - vencimento.getTime()) / 86_400_000));
      const encargos = contrato.valor_total * (MULTA + (JUROS_MES / 30) * atraso);
      return {
        ...emAberto,
        status: 'VENCIDA',
        encargos_estimados: Math.round(encargos * 100) / 100,
      };
    }
    if (contrato.status === 'A_PAGAR' || vencimento > hoje)
      return { ...emAberto, status: 'PENDENTE' };
    return base;
  });
}

/** Um atendimento de exemplo no formato de GET /funerais/{id}, para a tela de acompanhamento (FE-CLI-08). */
export const ID_FUNERAL_EXEMPLO = 'exemplo-1';
const ID_BENEFICIARIO_EXEMPLO = 'beneficiario-exemplo-1';

export function funeralDeExemplo(): FuneralResponse {
  return {
    id_funeral: ID_FUNERAL_EXEMPLO,
    id_beneficiario: ID_BENEFICIARIO_EXEMPLO,
    id_contrato: 'ct-ana-acolher',
    nome_falecido: 'Helena Duarte',
    status: 'EM_PREPARACAO',
    data_hora_prevista: iso(mais(27)),
    destinacao: 'SEPULTAMENTO',
    observacoes: null,
    proximos_status: ['VELORIO', 'CANCELADO'],
    equipe: [
      {
        id_usuario: 'us-carlos',
        id_funcionario: 'fn-carlos',
        nome: 'Carlos Menezes',
        email: 'carlos@ampara.demo',
        perfil: 'FUNCIONARIO',
        ativo: true,
        cpf: null,
        cargo: 'Atendente',
        telefone: '(11) 98888-7766',
      },
    ],
    reservas: [
      {
        id_reserva: 'reserva-velorio',
        id_local: 'local-capela',
        nome_local: 'Capela Ampara Jardim · Sala 2',
        tipo_local: 'SALA_VELORIO',
        inicio: iso(mais(18)),
        fim: iso(mais(26)),
      },
      {
        id_reserva: 'reserva-sepultamento',
        id_local: 'local-cemiterio',
        nome_local: 'Cemitério da Paz',
        tipo_local: 'CEMITERIO',
        inicio: iso(mais(27)),
        fim: iso(mais(28)),
      },
    ],
    historico: [
      {
        de: 'REGISTRADO',
        para: 'REGISTRADO',
        id_usuario: 'us-carlos',
        observacao: null,
        em: iso(mais(-28)),
      },
      {
        de: 'REGISTRADO',
        para: 'EM_PREPARACAO',
        id_usuario: 'us-carlos',
        observacao: 'As flores escolhidas pela família já foram encomendadas.',
        em: iso(mais(-20)),
      },
    ],
  };
}

export function itensDoExemplo(): ComposicaoItensResponse {
  const coberto = (id: string, nome: string, categoria: string, quantidade = 1) => ({
    id_funeral_item: id,
    id_item_catalogo: id,
    nome,
    categoria,
    variacao: null,
    quantidade,
  });
  return {
    itens_cobertos: [
      coberto('fi-urna', 'Urna sextavada em madeira', 'Urna'),
      coberto('fi-sala', 'Sala de velório (8 horas)', 'Velório'),
      coberto('fi-flor', 'Coroa de flores do campo', 'Flores'),
    ],
    itens_adicionais: [
      {
        ...coberto('fi-transmissao', 'Transmissão online da cerimônia', 'Transmissão online'),
        preco_unitario: 300,
        subtotal: 300,
        somente_diferenca_variacao: false,
      },
    ],
    total_adicional: 300,
  };
}

export function transladoDoExemplo(): TransladoResponse {
  return {
    id_translado: 'translado-exemplo-1',
    id_funeral: ID_FUNERAL_EXEMPLO,
    tipo: 'MUNICIPAL',
    status: 'EM_TRANSITO',
    origem: { endereco: 'Hospital Santa Clara', cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' },
    destino: { endereco: 'Rua das Acácias, 120', cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' },
    data_prevista: iso(mais(-1)),
    distancia_km: 38,
    distancia_manual: false,
    valor: 450,
    valor_coberto_plano: 450,
    valor_a_pagar: 0,
    id_terceiro_frota: 'terceiro-boa-viagem',
    nome_frota: 'Translados Boa Viagem',
    status_aceite: 'ACEITO',
    motivo_recusa: null,
    motorista: {
      nome: 'Edson Lima',
      telefone: '(11) 97777-1234',
      placa: 'FTR-2B41',
      modelo: 'Furgão funerário',
    },
  };
}

export function certidaoDoExemplo(): CertidaoResponse {
  return {
    id_solicitacao: 'certidao-exemplo-1',
    id_beneficiario: ID_BENEFICIARIO_EXEMPLO,
    status: 'EM_PROCESSAMENTO',
    modo: 'MANUAL',
    responsavel: {
      tipo: 'TERCEIRO',
      id_usuario: null,
      id_terceiro: 'cartorio-2',
      nome: 'Cartório do 2º Ofício',
    },
    protocolo: '2026-118734',
    pendencia: null,
    numero_matricula: null,
    id_documento_certidao: null,
    prazo: { data: dia(mais(72)), dias_restantes: 3, vencido: false },
    historico: [],
  };
}

export function documentosDoExemplo(): DocumentoResponse[] {
  return [
    {
      id_documento: 'doc-declaracao',
      tipo: 'DECLARACAO_OBITO',
      nome_original: 'Declaração de óbito.pdf',
      content_type: 'application/pdf',
      tamanho: 48_000,
      enviado_em: iso(mais(-26)),
    },
  ];
}

let pdf: string | undefined;
/** Link temporário de download (GET .../documentos/{id}/download): um PDF de exemplo. */
export const linkDoPdfDeExemplo = () =>
  (pdf ??= URL.createObjectURL(new Blob([PDF_FICTICIO], { type: 'application/pdf' })));

/** Notificações no formato de GET /notificacoes; os links seguem os do backend (/funerais/{id}, /faturas/{id}). */
export function notificacoesIniciais(): NotificacaoResponse[] {
  const notificacao = (
    id: string,
    tipo: string,
    titulo: string,
    mensagem: string,
    link: string | null,
    horas: number,
    lida: boolean,
  ): NotificacaoResponse => ({
    id_notificacao: id,
    tipo,
    titulo,
    mensagem,
    link,
    criada_em: iso(mais(horas)),
    lida_em: lida ? iso(mais(horas + 1)) : null,
  });
  return [
    notificacao(
      'n-1',
      'TRANSLADO',
      'Translado a caminho',
      'O translado de Helena Duarte saiu do hospital e está a caminho da capela.',
      `/funerais/${ID_FUNERAL_EXEMPLO}`,
      -0.5,
      false,
    ),
    notificacao(
      'n-2',
      'FATURA',
      'Sua fatura está disponível',
      'Você pode pagar com Pix, boleto ou cartão.',
      '/faturas/ultima',
      -26,
      false,
    ),
    notificacao(
      'n-3',
      'PREFERENCIAS',
      'Registre suas preferências',
      'Deixar suas escolhas registradas ajuda sua família no momento da despedida.',
      '/minha-conta/preferencias',
      -24 * 6,
      true,
    ),
    notificacao(
      'n-4',
      'BOAS_VINDAS',
      'Bem-vindo à área do cliente',
      'Aqui você acompanha seu plano, seus pagamentos e quem está protegido.',
      null,
      -24 * 20,
      true,
    ),
  ];
}

// PDF mínimo de uma página, só para demonstrar o download.
const PDF_FICTICIO = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 58>>stream
BT /F1 16 Tf 72 760 Td (Documento ficticio - Ampara) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
