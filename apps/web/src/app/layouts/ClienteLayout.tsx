import { Logo } from '@ampara/ui/components/logo';
import { ArrowLeft } from 'lucide-react';
import { Link, Outlet } from 'react-router';

/** Layout da área do cliente (FE-03): topo simples, conteúdo e rodapé. */
export function ClienteLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-surface px-5 sm:px-10">
        <Link to="/minha-conta" aria-label="Início da área do cliente">
          <Logo className="text-lg" />
        </Link>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Voltar para o início
        </a>
      </header>

      <main className="flex-1 px-5 pt-10 pb-12 sm:px-10">
        <Outlet />
      </main>

      <footer className="pb-12 text-center text-[11px] text-subtle-foreground">
        Portal Ampara · Área do cliente
      </footer>
    </div>
  );
}
