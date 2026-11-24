import { cn } from '@ampara/ui/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { salvarTema, useModoEscuro } from '../lib/tema';

/** Alterna entre o modo claro e o noturno. A escolha fica salva neste navegador. */
export function BotaoTema({ className }: { className?: string }) {
  const escuro = useModoEscuro();
  const rotulo = escuro ? 'Usar o modo claro' : 'Usar o modo noturno';
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      onClick={() => salvarTema(escuro ? 'claro' : 'escuro')}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {escuro ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
