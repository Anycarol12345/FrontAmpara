import { setupWorker } from 'msw/browser';
import { handlersDemo } from './demo/handlers';
import { lerSessaoDemo } from './demo/sessao';
import { handlersFicticios } from './handlers';

/**
 * Liga os dados fictícios no navegador (só em desenvolvimento).
 * Sem demonstração, só as rotas que o backend ainda não tem são simuladas; o resto vai para a API real.
 * Com a demonstração da página /demo, a API inteira é simulada e não é preciso login nem backend.
 * Para desligar tudo: VITE_DADOS_FICTICIOS=false no .env.local.
 */
export async function iniciarDadosFicticios() {
  const demo = lerSessaoDemo();
  await setupWorker(...(demo ? handlersDemo(demo) : []), ...handlersFicticios).start({
    onUnhandledFrame: 'bypass',
    quiet: true,
  });
  console.info(
    demo
      ? `[Ampara] Demonstração ligada (${demo.perfil}): a API inteira é simulada. Saia pelo botão "Sair".`
      : '[Ampara] Dados fictícios ligados para faturas, preferências, funerais e notificações.',
  );
}
