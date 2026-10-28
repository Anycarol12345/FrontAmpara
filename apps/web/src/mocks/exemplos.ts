import type { ContratoDetalheResponse } from '@ampara/api-client';
import type { FormaPagamento } from '@/features/financeiro';
import type { FuneralResponse } from '@/features/funeral';
import type { NotificacaoResponse } from '@/features/notificacoes';
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
      competencia: dia(vencimento).slice(0, 7),
      valor: contrato.valor_total,
      valor_multa_juros: 0,
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
        valor_multa_juros: Math.round(encargos * 100) / 100,
      };
    }
    if (contrato.status === 'A_PAGAR' || vencimento > hoje)
      return { ...emAberto, status: 'PENDENTE' };
    return base;
  });
}

/** Um atendimento de exemplo, para mostrar a tela de acompanhamento (FE-CLI-08). */
export function funeralDeExemplo(): FuneralResponse {
  const pdf = URL.createObjectURL(new Blob([PDF_FICTICIO], { type: 'application/pdf' }));
  return {
    id_funeral: 'exemplo-1',
    nome_falecido: 'Helena Duarte',
    data_falecimento: dia(mais(-30)),
    status: 'EM_PREPARACAO',
    historico: [
      { status: 'REGISTRADO', data_hora: iso(mais(-28)), observacao: null },
      {
        status: 'EM_PREPARACAO',
        data_hora: iso(mais(-20)),
        observacao: 'As flores escolhidas pela família já foram encomendadas.',
      },
    ],
    velorio: {
      local: 'Capela Ampara Jardim',
      endereco: 'Rua das Acácias, 120 - Jardim Paulista, São Paulo - SP',
      sala: 'Sala 2',
      inicio: iso(mais(18)),
      fim: iso(mais(26)),
    },
    despedida: {
      tipo: 'SEPULTAMENTO',
      local: 'Cemitério da Paz',
      endereco: 'Av. Prof. Francisco Morato, 2000 - Butantã, São Paulo - SP',
      data_hora: iso(mais(27)),
    },
    itens: [
      {
        nome: 'Urna em madeira com acabamento acetinado',
        categoria: 'Urna',
        quantidade: 1,
        coberto: true,
      },
      { nome: 'Coroa de flores do campo', categoria: 'Flores', quantidade: 2, coberto: false },
      { nome: 'Sala de velório por 8 horas', categoria: 'Velório', quantidade: 1, coberto: true },
      {
        nome: 'Transmissão online da cerimônia',
        categoria: 'Transmissão online',
        quantidade: 1,
        coberto: false,
      },
    ],
    translado: {
      id_translado: 'translado-exemplo-1',
      status: 'EM_TRANSITO',
      origem: 'Hospital Santa Clara',
      destino: 'Capela Ampara Jardim',
      historico: [
        { status: 'AGENDADO', data_hora: iso(mais(-6)), observacao: null },
        { status: 'EM_COLETA', data_hora: iso(mais(-1.5)), observacao: null },
        { status: 'EM_TRANSITO', data_hora: iso(mais(-0.5)), observacao: null },
      ],
    },
    certidao: { status: 'EM_ANDAMENTO', numero_matricula: null, url: null },
    documentos: [{ id_documento: 'doc-1', nome: 'Declaração de óbito', url: pdf }],
    responsavel: { nome: 'Carlos Menezes', telefone: '(11) 98888-7766' },
  };
}

export function notificacoesIniciais(): NotificacaoResponse[] {
  return [
    {
      id_notificacao: 'n-1',
      titulo: 'Translado a caminho',
      mensagem: 'O translado de Helena Duarte saiu do hospital e está a caminho da capela.',
      link: '/minha-conta/atendimentos/exemplo-1',
      lida: false,
      criada_em: iso(mais(-0.5)),
    },
    {
      id_notificacao: 'n-2',
      titulo: 'Sua fatura está disponível',
      mensagem: 'Você pode pagar com Pix, boleto ou cartão.',
      link: '/minha-conta/faturas',
      lida: false,
      criada_em: iso(mais(-26)),
    },
    {
      id_notificacao: 'n-3',
      titulo: 'Registre suas preferências',
      mensagem: 'Deixar suas escolhas registradas ajuda sua família no momento da despedida.',
      link: '/minha-conta/preferencias',
      lida: true,
      criada_em: iso(mais(-24 * 6)),
    },
    {
      id_notificacao: 'n-4',
      titulo: 'Bem-vindo à área do cliente',
      mensagem: 'Aqui você acompanha seu plano, seus pagamentos e quem está protegido.',
      link: null,
      lida: true,
      criada_em: iso(mais(-24 * 20)),
    },
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
