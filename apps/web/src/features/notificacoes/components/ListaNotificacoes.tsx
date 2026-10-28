import { cn } from '@ampara/ui/lib/utils';
import { Link } from 'react-router';
import { quando, type NotificacaoResponse } from '../hooks/notificacoes';

type Props = {
  notificacoes: NotificacaoResponse[];
  aoAbrir: (notificacao: NotificacaoResponse) => void;
  className?: string;
};

/** Itens da central de notificações (FE-CLI-09). Não lidas ficam destacadas. */
export function ListaNotificacoes({ notificacoes, aoAbrir, className }: Props) {
  return (
    <ul className={cn('flex flex-col', className)}>
      {notificacoes.map((n) => {
        const conteudo = (
          <>
            <span
              aria-hidden
              className={cn(
                'mt-1.5 size-2 shrink-0 rounded-full',
                n.lida ? 'bg-transparent' : 'bg-brand-800',
              )}
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cn('text-sm', !n.lida && 'font-semibold')}>
                {n.titulo}
                {!n.lida && <span className="sr-only"> (não lida)</span>}
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">{n.mensagem}</span>
              <span className="mt-1 text-[11px] text-subtle-foreground">{quando(n.criada_em)}</span>
            </span>
          </>
        );
        const classe =
          'flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted';
        return (
          <li key={n.id_notificacao}>
            {n.link ? (
              <Link to={n.link} className={classe} onClick={() => aoAbrir(n)}>
                {conteudo}
              </Link>
            ) : (
              <button type="button" className={classe} onClick={() => aoAbrir(n)}>
                {conteudo}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
