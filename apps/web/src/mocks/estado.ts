import type { FaturaResponse } from '@/features/financeiro';
import type { PreferenciaFuneralResponse } from '@/features/funeral';
import type { NotificacaoResponse } from '@/features/notificacoes';

/**
 * Estado dos dados fictícios, guardado no localStorage: sobrevive ao recarregar a página
 * e é o mesmo em todas as abas (a página de pagamento simulado abre em outra aba).
 */
export type FaturaFicticia = FaturaResponse & {
  /** Pix e boleto ficam em processamento até esta hora e depois viram PAGA. */
  confirmar_em?: string;
};

type Estado = {
  faturas: Record<string, FaturaFicticia>;
  /** Contratos cujas faturas já foram geradas. */
  contratos: string[];
  preferencias: Record<string, PreferenciaFuneralResponse>;
  notificacoes: NotificacaoResponse[] | null;
};

const CHAVE = 'ampara:dados-ficticios';
const vazio = (): Estado => ({ faturas: {}, contratos: [], preferencias: {}, notificacoes: null });

export function lerEstado(): Estado {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? { ...vazio(), ...(JSON.parse(salvo) as Estado) } : vazio();
  } catch {
    return vazio();
  }
}

export function alterarEstado(alterar: (estado: Estado) => void) {
  const estado = lerEstado();
  alterar(estado);
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Sem localStorage (aba anônima bloqueada): os dados valem só até recarregar.
  }
  return estado;
}

/** Volta os dados fictícios ao início (útil para demonstrar o fluxo de novo). */
export function limparEstado() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // nada a limpar
  }
}
