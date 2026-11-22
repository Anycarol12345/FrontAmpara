import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ampara/ui/styles.css';
import { App } from '@/app/App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento #root não encontrado');
}

// Depois de um deploy, uma aba aberta pode pedir um pedaço do app (assets/xxx-hash.js) que mudou
// de nome. Em vez da tela "Failed to fetch dynamically imported module", recarrega uma vez para
// pegar a versão nova. A marca na sessão evita recarregar em loop se o arquivo sumir de vez.
window.addEventListener('vite:preloadError', (evento) => {
  const chave = 'ampara:recarregou-por-versao';
  try {
    if (sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, '1');
  } catch {
    return;
  }
  evento.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => {
  // Carregou bem: libera um novo recarregamento automático no próximo deploy.
  setTimeout(() => {
    try {
      sessionStorage.removeItem('ampara:recarregou-por-versao');
    } catch {
      // Sem sessionStorage: nada a limpar.
    }
  }, 10_000);
});

// Em desenvolvimento, as rotas que o backend ainda não tem respondem com dados fictícios (src/mocks).
if (import.meta.env.DEV && import.meta.env.VITE_DADOS_FICTICIOS !== 'false') {
  const { iniciarDadosFicticios } = await import('@/mocks/navegador');
  await iniciarDadosFicticios();
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
