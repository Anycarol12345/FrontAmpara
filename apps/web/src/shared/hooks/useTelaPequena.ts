import { useSyncExternalStore } from 'react';

const CONSULTA = '(max-width: 639px)';

function assinar(aoMudar: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const lista = window.matchMedia(CONSULTA);
  lista.addEventListener('change', aoMudar);
  return () => lista.removeEventListener('change', aoMudar);
}

/** Tela de celular (abaixo de 640 px, o "sm" do Tailwind). Sem matchMedia (testes), é tela grande. */
export function useTelaPequena() {
  return useSyncExternalStore(
    assinar,
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.(CONSULTA).matches),
    () => false,
  );
}
