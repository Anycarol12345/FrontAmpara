import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ampara/ui/components/dropdown-menu';
import { Logo } from '@ampara/ui/components/logo';
import { cn } from '@ampara/ui/lib/utils';
import { ChevronRight, LogOut, Search } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { NOME_PERFIL, useAuth, type Perfil } from '@/features/auth';
import { IndicadorConexao } from '@/shared/tempo-real/IndicadorConexao';
import { ETIQUETA_DO_PERFIL, MENU_DO_PERFIL } from './menus';

// Os três perfis da equipe mostrados no topo do protótipo. O ativo é o da sessão.
const PERFIS_DA_EQUIPE: { rotulo: string; perfis: Perfil[] }[] = [
  { rotulo: 'Funcionário', perfis: ['FUNCIONARIO'] },
  { rotulo: 'Consultor', perfis: ['CONSULTOR'] },
  { rotulo: 'Administrador', perfis: ['FUNERARIA'] },
];

/**
 * Layout da área interna (FE-03): topo com busca e usuário, menu lateral e conteúdo.
 * Usado pela área da funerária (/painel), pelo portal do terceiro (/parceiro) e pela plataforma (/admin).
 */
export function PainelLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  // A RotaProtegida garante a sessão; este retorno só acontece durante o logout.
  if (!usuario) return null;

  const menu = MENU_DO_PERFIL[usuario.perfil] ?? [];
  const daEquipe = ['FUNERARIA', 'FUNCIONARIO', 'CONSULTOR'].includes(usuario.perfil);
  async function encerrar() {
    await sair();
    await navigate('/equipe/entrar', { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="flex h-[132px] shrink-0 items-center gap-6 px-5">
        <div className="flex w-[194px] items-center gap-2.5">
          <Logo className="text-lg" />
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {ETIQUETA_DO_PERFIL[usuario.perfil]}
          </span>
        </div>

        <label className="relative hidden w-[340px] md:block">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle-foreground" />
          <input
            type="search"
            placeholder="Buscar cliente, contrato..."
            className="h-10 w-full rounded-full border border-border/70 bg-[#f4f7fb] pr-4 pl-10 text-sm outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
          />
        </label>

        {daEquipe && (
          <ul aria-label="Perfis da equipe" className="ml-auto hidden items-center gap-1 lg:flex">
            {PERFIS_DA_EQUIPE.map(({ rotulo, perfis }) => {
              const ativo = perfis.includes(usuario.perfil);
              return (
                <li
                  key={rotulo}
                  aria-current={ativo || undefined}
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-semibold',
                    ativo ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                  )}
                >
                  {rotulo}
                </li>
              );
            })}
          </ul>
        )}

        <IndicadorConexao className={daEquipe ? undefined : 'ml-auto'} />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'flex items-center gap-2.5 rounded-full border border-border/70 bg-card py-1.5 pr-3 pl-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/20',
              !daEquipe ? 'ml-auto' : 'max-lg:ml-auto',
            )}
          >
            <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              {usuario.nome.charAt(0)}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-bold">{usuario.nome}</span>
              <span className="text-[10px] text-muted-foreground">
                {NOME_PERFIL[usuario.perfil]}
              </span>
            </span>
            <ChevronRight className="size-3.5 text-subtle-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{usuario.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void encerrar()}>
              <LogOut /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-[214px] shrink-0 px-2.5 pt-6 lg:block">
          <p className="px-2.5 text-[10px] font-semibold tracking-[0.14em] text-subtle-foreground uppercase">
            Menu principal
          </p>
          <nav className="mt-4 flex flex-col gap-1">
            {menu.map(({ rotulo, para, icone: Icone }) => (
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
