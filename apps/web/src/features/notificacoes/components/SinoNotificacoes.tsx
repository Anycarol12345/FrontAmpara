import { Button } from '@ampara/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ampara/ui/components/dropdown-menu';
import { cn } from '@ampara/ui/lib/utils';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  quando,
  useMarcarComoLida,
  useNotificacoes,
  useNotificacoesTempoReal,
} from '../hooks/notificacoes';

const NO_SINO = 5;

/** Sino com contador e as últimas notificações (FE-CLI-09). `todas` é a página com a lista completa. */
export function SinoNotificacoes({ todas }: { todas: string }) {
  const navigate = useNavigate();
  const consulta = useNotificacoes();
  const marcar = useMarcarComoLida();
  useNotificacoesTempoReal();

  const lista = consulta.data ?? [];
  const naoLidas = lista.filter((n) => !n.lida).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={naoLidas ? `Notificações (${naoLidas} não lidas)` : 'Notificações'}
        >
          <Bell />
          {naoLidas > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground"
            >
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between">
          <DropdownMenuLabel>Notificações</DropdownMenuLabel>
          {naoLidas > 0 && (
            <button
              type="button"
              className="px-2 text-[11px] font-semibold hover:underline"
              onClick={() => marcar.mutate(undefined)}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {lista.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {consulta.isPending ? 'Carregando...' : 'Nenhuma notificação por enquanto.'}
          </p>
        ) : (
          lista.slice(0, NO_SINO).map((n) => (
            <DropdownMenuItem
              key={n.id_notificacao}
              className="items-start gap-3 py-2.5"
              onSelect={() => {
                if (!n.lida) marcar.mutate(n.id_notificacao);
                if (n.link) void navigate(n.link);
              }}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  n.lida ? 'bg-transparent' : 'bg-brand-800',
                )}
              />
              <span className="flex min-w-0 flex-col">
                <span className={cn('text-xs', !n.lida && 'font-semibold')}>{n.titulo}</span>
                <span className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                  {n.mensagem}
                </span>
                <span className="mt-1 text-[10px] text-subtle-foreground">
                  {quando(n.criada_em)}
                </span>
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-xs font-semibold"
          onSelect={() => void navigate(todas)}
        >
          Ver todas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
