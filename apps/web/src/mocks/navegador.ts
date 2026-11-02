import { setupWorker } from 'msw/browser';
import { handlersDemo } from './demo/handlers';
import { lerSessaoDemo } from './demo/sessao';
import { handlersFicticios } from './handlers';

/**
 * Liga a demonstração da página /demo (só em desenvolvimento): a API inteira é simulada,
 * sem login e sem backend. Fora da demonstração nada é simulado e tudo vai para a API real.
 * Para desligar de vez: VITE_DADOS_FICTICIOS=false no .env.local.
 */
export async function iniciarDadosFicticios() {
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
