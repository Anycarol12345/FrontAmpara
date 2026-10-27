import { Logo } from '@ampara/ui/components/logo';
import { cn } from '@ampara/ui/lib/utils';
import { ArrowLeft, Check } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthSplitLayoutProps = {
  /** `cliente` usa a fonte serifada; `equipe` usa a sans do portal interno. */
  variante: 'cliente' | 'equipe';
  sobretitulo: string;
  titulo: ReactNode;
  descricao: string;
  itens: string[];
  children: ReactNode;
};

const URL_SITE = '/';
const ATENDIMENTO = 'Atendimento 24h · 0800 000 2025';

/** Tela dividida usada no login e no cadastro: painel azul à esquerda e formulário à direita. */
export function AuthSplitLayout({
  variante,
  sobretitulo,
  titulo,
  descricao,
  itens,
  children,
}: AuthSplitLayoutProps) {
  const serif = variante === 'cliente';

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside
        className={cn(
          'relative hidden overflow-hidden bg-linear-to-b from-brand-900 to-brand-600 py-14 text-white lg:flex lg:flex-col',
          serif ? 'px-12' : 'px-16',
        )}
      >
        <Circulos variante={variante} />

        <Logo font={serif ? 'serif' : 'sans'} className="relative" />

        <div className={cn('relative my-auto', serif ? 'max-w-[500px]' : 'max-w-[480px]')}>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-white/60 uppercase">
            {sobretitulo}
          </p>
          <h1
            className={cn(
              'mt-4',
              serif
                ? 'font-serif text-[42px]/[1.15] font-normal'
                : 'text-[56px]/[1.1] font-bold tracking-tight',
            )}
          >
            {titulo}
          </h1>
          <p
            className={cn('mt-5 leading-relaxed text-white/75', serif ? 'text-sm' : 'text-[15px]')}
          >
            {descricao}
          </p>
          <ul className="mt-7 flex flex-col gap-3.5">
            {itens.map((item) => (
              <li
                key={item}
                className={cn(
                  'flex items-center gap-3 text-white/85',
                  serif ? 'text-[13px]' : 'text-sm',
                )}
              >
                <span className="grid size-5 place-items-center rounded-full bg-white/15">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">{ATENDIMENTO}</p>
      </aside>

      <main className="relative flex flex-col bg-surface px-6 py-10 sm:px-12">
        <a
          href={URL_SITE}
          className="inline-flex items-center gap-2 self-start text-sm font-semibold text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" />
          Voltar ao site
        </a>
        <div
          className={cn('mx-auto my-auto w-full py-10', serif ? 'max-w-[360px]' : 'max-w-[448px]')}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

function Circulos({ variante }: { variante: AuthSplitLayoutProps['variante'] }) {
  // Círculos concêntricos decorativos do protótipo.
  const centro = variante === 'cliente' ? 'left-full top-1/2' : 'left-[80%] top-[47%]';
  return (
    <div aria-hidden className={cn('pointer-events-none absolute', centro)}>
      <span className="absolute size-[460px] -translate-1/2 rounded-full border border-white/10" />
      <span className="absolute size-[300px] -translate-1/2 rounded-full border border-white/10" />
    </div>
  );
}

/** Texto de apoio no rodapé do formulário. */
export function AuthAtendimento({ className }: { className?: string }) {
  return (
    <p className={cn('text-center text-xs text-subtle-foreground', className)}>
      Precisa de ajuda? {ATENDIMENTO}
    </p>
  );
}
