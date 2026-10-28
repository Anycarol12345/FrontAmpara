import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ampara/ui/styles.css';
import { App } from '@/app/App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento #root não encontrado');
}

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
