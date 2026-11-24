import { useSyncExternalStore } from 'react';

/** Tema do sistema (área do cliente e painel). 'sistema' segue o modo do aparelho. */
export type Tema = 'claro' | 'escuro' | 'sistema';

export const CHAVE_TEMA = 'ampara:tema';
const ESCURO_DO_APARELHO = '(prefers-color-scheme: dark)';
const ouvintes = new Set<() => void>();

export function lerTema(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    return salvo === 'claro' || salvo === 'escuro' ? salvo : 'sistema';
  } catch {
    return 'sistema';
  }
}

const aparelhoEscuro = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.(ESCURO_DO_APARELHO).matches);

/** Se o modo noturno está valendo agora. */
export const estaEscuro = (tema = lerTema()) =>
  tema === 'escuro' || (tema === 'sistema' && aparelhoEscuro());

/** Liga ou desliga a classe .dark no <html> (as cores estão em packages/ui/src/styles.css). */
export function aplicarTema() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', estaEscuro());
}

export function salvarTema(tema: Tema) {
  try {
    if (tema === 'sistema') localStorage.removeItem(CHAVE_TEMA);
    else localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // Sem localStorage: o tema vale até recarregar a página.
  }
  aplicarTema();
  ouvintes.forEach((f) => f());
}

/** Segue o aparelho quando o tema é 'sistema' (ex.: o celular entra no modo noturno à noite). */
export function acompanharAparelho() {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  window.matchMedia(ESCURO_DO_APARELHO).addEventListener('change', () => {
    aplicarTema();
    ouvintes.forEach((f) => f());
  });
}

function assinar(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  return () => ouvintes.delete(aoMudar);
}

/** Se o modo noturno está ligado, atualizado quando o tema muda. */
export function useModoEscuro() {
  return useSyncExternalStore(
    assinar,
    () => estaEscuro(),
    () => false,
  );
}
