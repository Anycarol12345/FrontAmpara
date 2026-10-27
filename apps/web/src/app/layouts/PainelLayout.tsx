import { Logo } from '@ampara/ui/components/logo';
import { cn } from '@ampara/ui/lib/utils';
import {
  CalendarDays,
  ChevronRight,
  FileText,
  House,
  Search,
  Settings,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

type ItemMenu = { rotulo: string; para: string; icone: LucideIcon };

// Menu do perfil FUNCIONARIO. Os menus de gestor e plataforma entram junto com as telas deles.
const MENU: ItemMenu[] = [
  { rotulo: 'Visão geral', para: '/painel', icone: House },
  { rotulo: 'Atendimentos', para: '/painel/atendimentos', icone: UsersRound },
  { rotulo: 'Agenda', para: '/painel/agenda', icone: CalendarDays },
  { rotulo: 'Documentos', para: '/painel/documentos', icone: FileText },
  { rotulo: 'Configurações', para: '/painel/configuracoes', icone: Settings },
];

// Seletor de perfil do protótipo. Some quando o login real (FE-07) definir o perfil.
const PERFIS = [
  { rotulo: 'Funcionário', para: '/painel' },
  { rotulo: 'Consultor', para: '/consultor' },
  { rotulo: 'Administrador', para: '/admin' },
];

const USUARIO = { nome: 'Ana Souza', perfil: 'Funcionário' };

/** Layout da área interna (FE-03): topo com busca e perfil, menu lateral e conteúdo. */
export function PainelLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="flex h-[132px] shrink-0 items-center gap-6 px-5">
        <div className="flex w-[194px] items-center gap-2.5">
          <Logo className="text-lg" />
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Equipe
          </span>
        </div>

        <label className="relative hidden w-[340px] md:block">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle-foreground" />
          <input
            type="search"
            placeholder="Buscar cliente, contrato..."
            className="h-10 w-full rounded-full border border-border/70 bg-[#f4f7fb] pr-4 pl-10 text-sm outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
          />
        </label>

        <nav
          aria-label="Perfil de demonstração"
          className="ml-auto hidden items-center gap-1 lg:flex"
        >
          {PERFIS.map((perfil) => (
            <NavLink
              key={perfil.para}
              to={perfil.para}
              end
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {perfil.rotulo}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="flex items-center gap-2.5 rounded-full border border-border/70 bg-card py-1.5 pr-3 pl-1.5 text-left max-lg:ml-auto"
        >
          <span className="size-8 rounded-full bg-muted" />
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-bold">{USUARIO.nome}</span>
            <span className="text-[10px] text-muted-foreground">{USUARIO.perfil}</span>
          </span>
          <ChevronRight className="size-3.5 text-subtle-foreground" />
        </button>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-[214px] shrink-0 px-2.5 pt-6 lg:block">
          <p className="px-2.5 text-[10px] font-semibold tracking-[0.14em] text-subtle-foreground uppercase">
            Menu principal
          </p>
          <nav className="mt-4 flex flex-col gap-1">
            {MENU.map(({ rotulo, para, icone: Icone }) => (
              <NavLink
                key={para}
                to={para}
                end
                className={({ isActive }) =>
                  cn(
                    'flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                    isActive
                      ? 'bg-[#e8edf6] font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icone className="size-[18px]" strokeWidth={1.75} />
                {rotulo}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 bg-background px-5 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
