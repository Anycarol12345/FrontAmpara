import type { AtribuicaoResponse, StatusAtribuicao, TipoAtribuicao } from '@ampara/api-client';

type Variante = 'success' | 'warning' | 'info' | 'neutral';

export const TIPO_ATRIBUICAO: Record<TipoAtribuicao, string> = {
  TRANSLADO: 'Translado',
  CERTIDAO: 'Certidão de óbito',
  PEDIDO: 'Pedido',
};

export const STATUS_ATRIBUICAO: Record<StatusAtribuicao, { rotulo: string; variante: Variante }> = {
  PENDENTE: { rotulo: 'Aguardando sua resposta', variante: 'warning' },
  ACEITA: { rotulo: 'Aceita', variante: 'info' },
  RECUSADA: { rotulo: 'Recusada', variante: 'neutral' },
  EXPIRADA: { rotulo: 'Prazo encerrado', variante: 'neutral' },
  CONCLUIDA: { rotulo: 'Concluída', variante: 'success' },
  CANCELADA: { rotulo: 'Cancelada', variante: 'neutral' },
};

/** Documento que o parceiro pode baixar pelo link temporário. */
export type DocumentoDoServico = { nome: string; id_documento: string };

/**
 * O que cada tipo de parceiro vê do serviço (TER-02, LGPD): o backend manda o resumo em snake_case,
 * sem CPF, contrato nem valores.
 */
export type ResumoTranslado = {
  nome_falecido: string;
  origem: string;
  destino: string;
  data_hora: string;
  contato: { nome: string; telefone: string };
  documentos: DocumentoDoServico[];
};
export type ResumoCertidao = {
  nome_falecido: string;
  data_obito: string;
  local_obito: string;
  documentos: DocumentoDoServico[];
};
export type ResumoPedido = {
  nome_falecido: string;
  local: string;
  data_hora: string;
  itens: { nome: string; quantidade: number; observacao: string | null }[];
};

export const resumoDe = <T>(atribuicao: AtribuicaoResponse) =>
  atribuicao.resumo as unknown as Partial<T>;

/** Linha curta para a lista: onde e quando. */
export function descricaoCurta(a: AtribuicaoResponse): {
  titulo: string;
  detalhe: string;
  quando?: string;
} {
  if (a.tipo === 'TRANSLADO') {
    const r = resumoDe<ResumoTranslado>(a);
    return {
      titulo: r.nome_falecido ?? '',
      detalhe: `${r.origem ?? ''} → ${r.destino ?? ''}`,
      quando: r.data_hora,
    };
  }
  if (a.tipo === 'CERTIDAO') {
    const r = resumoDe<ResumoCertidao>(a);
    return { titulo: r.nome_falecido ?? '', detalhe: `Óbito em ${r.local_obito ?? '—'}` };
  }
  const r = resumoDe<ResumoPedido>(a);
  const itens = (r.itens ?? []).map((i) => `${i.quantidade}× ${i.nome}`).join(', ');
  return {
    titulo: r.nome_falecido ?? '',
    detalhe: `${itens} · ${r.local ?? ''}`,
    quando: r.data_hora,
  };
}

/** "em 1 h 20 min", "em 35 min" ou "encerrado". */
export function tempoRestante(prazo: string, agora = Date.now()) {
  const minutos = Math.floor((new Date(prazo).getTime() - agora) / 60_000);
  if (minutos <= 0) return 'encerrado';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `em ${h} h${m ? ` ${m} min` : ''}` : `em ${m} min`;
}
