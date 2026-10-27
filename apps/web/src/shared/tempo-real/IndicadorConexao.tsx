import { cn } from '@ampara/ui/lib/utils';
import { useTempoReal } from './contexto';

/** Avisa quando a atualização em tempo real caiu e está reconectando (FE-08). */
export function IndicadorConexao({ className }: { className?: string }) {
  const { status } = useTempoReal();
  if (status !== 'reconectando') return null;

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-warning px-3 py-1 text-[11px] font-semibold text-warning-foreground',
        className,
      )}
    >
      <span className="size-1.5 animate-pulse rounded-full bg-current" />
      Reconectando…
    </span>
  );
}
