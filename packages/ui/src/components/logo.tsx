import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

type LogoProps = ComponentProps<'span'> & {
  /** `sans` no portal da equipe, `serif` nas telas do cliente e na landing. */
  font?: 'sans' | 'serif';
};

function Logo({ className, font = 'sans', ...props }: LogoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-base',
        font === 'serif' ? 'font-serif font-medium' : 'font-bold',
        className,
      )}
      {...props}
    >
      <span className="grid size-6 place-items-center rounded-full border border-current text-[11px] font-semibold">
        V
      </span>
      Ampara
    </span>
  );
}

export { Logo };
