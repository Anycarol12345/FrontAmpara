import { cn } from '@ampara/ui/lib/utils';
import type { ComponentProps } from 'react';

/** Largura máxima do conteúdo da landing (protótipo em 1920px). */
export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-[1340px] px-6', className)} {...props} />;
}

/** Sobretítulo + título serifado + descrição, centralizados no topo das seções. */
export function SectionHeading({
  sobretitulo,
  titulo,
  descricao,
  className,
}: {
  sobretitulo: string;
  titulo: string;
  descricao?: string;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-3xl text-center', className)}>
      <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {sobretitulo}
      </p>
      <h2 className="mt-3 font-serif text-[46px]/[1.15] text-primary">{titulo}</h2>
      {descricao && (
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
          {descricao}
        </p>
      )}
    </div>
  );
}
