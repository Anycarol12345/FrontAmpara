/** Chave da sessão de demonstração da página /demo (src/mocks/demo). */
export const CHAVE_DEMO = 'ampara:demo';

/**
 * Há uma demonstração ativa (só em desenvolvimento). Nela a API é simulada pelo MSW,
 * então o que não passa pelo fetch (como o hub do SignalR) fica desligado.
 */
export function emDemonstracao() {
  if (!import.meta.env.DEV) return false;
  try {
    return localStorage.getItem(CHAVE_DEMO) !== null;
  } catch {
    return false;
  }
}
