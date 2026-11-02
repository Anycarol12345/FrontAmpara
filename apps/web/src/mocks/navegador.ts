import { setupWorker } from 'msw/browser';
import { handlersDemo } from './demo/handlers';
import { lerSessaoDemo, salvarSessaoDemo } from './demo/sessao';
import { handlersFicticios } from './handlers';

// Telas de login: quem chega nelas quer entrar de verdade, com o backend.
const TELAS_DE_LOGIN = ['/entrar', '/equipe/entrar', '/admin/entrar'];

/**
 * Liga a demonstração da página /demo (só em desenvolvimento): a API inteira é simulada,
 * sem login e sem backend. Fora da demonstração nada é simulado e tudo vai para a API real.
 * Abrir uma tela de login encerra a demonstração, para o login usar os usuários do backend.
 * Para desligar de vez: VITE_DADOS_FICTICIOS=false no .env.local.
 */
export async function iniciarDadosFicticios() {
  if (TELAS_DE_LOGIN.includes(window.location.pathname)) salvarSessaoDemo(null);
  const demo = lerSessaoDemo();
  if (!demo) return;
  await setupWorker(...handlersDemo(demo), ...handlersFicticios).start({
    onUnhandledFrame: 'bypass',
    quiet: true,
  });
  console.info(
    `[Ampara] Demonstração ligada (${demo.perfil}): a API inteira é simulada. Saia pelo botão "Sair".`,
  );
}
