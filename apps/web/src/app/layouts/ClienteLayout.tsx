import { Logo } from '@ampara/ui/components/logo';
import { ArrowLeft, LogOut } from 'lucide-react';
import { cn } from '@ampara/ui/lib/utils';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '@/features/auth';
import { SinoNotificacoes } from '@/features/notificacoes';
import { urlDoSite } from '@/shared/lib/tenant';

const MENU = [
  { rotulo: 'Início', para: '/minha-conta', fim: true },
  { rotulo: 'Meus contratos', para: '/minha-conta/contratos', fim: false },
  { rotulo: 'Pagamentos', para: '/minha-conta/faturas', fim: false },
  { rotulo: 'Pessoas protegidas', para: '/minha-conta/dependentes', fim: false },
  { rotulo: 'Preferências', para: '/minha-conta/preferencias', fim: false },
  { rotulo: 'Atendimentos', para: '/minha-conta/atendimentos', fim: false },
  { rotulo: 'Meus dados', para: '/minha-conta/dados', fim: false },
];

/** Layout da área do cliente (FE-03): topo simples, conteúdo e rodapé. */
export function ClienteLayout() {
  const { sair } = useAuth();
  const navigate = useNavigate();

  async function encerrar() {
    await sair();
    await navigate('/entrar', { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="shrink-0 bg-surface">
        <div className="flex h-[72px] items-center justify-between px-5 sm:px-10">
          <Link to="/minha-conta" aria-label="Início da área do cliente">
            <Logo className="text-lg" />
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <SinoNotificacoes todas="/minha-conta/notificacoes" />
            <a
              href={urlDoSite()}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Voltar para o início</span>
              <span className="sm:hidden">Site</span>
            </a>
            <button
              type="button"
              onClick={() => void encerrar()}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Sair
            </button>
          </div>
        </div>
        <nav
          aria-label="Área do cliente"
          className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 sm:px-9"
        >
          {MENU.map(({ rotulo, para, fim }) => (
            <NavLink
              key={para}
              to={para}
              end={fim}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-muted font-semibold text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {rotulo}
            </NavLink>
          ))}
        </nav>
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
