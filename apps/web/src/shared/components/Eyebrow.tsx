import { cn } from '@ampara/ui/lib/utils';
import type { ComponentProps } from 'react';

/** Texto pequeno em caixa alta que aparece acima dos títulos ("PORTAL DA EQUIPE"). */
export function Eyebrow({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase',
        className,
      )}
      {...props}
    />
  );
}
