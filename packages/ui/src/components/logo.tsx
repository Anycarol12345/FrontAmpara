import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

type LogoProps = ComponentProps<'span'> & {
  /** `sans` no portal da equipe, `serif` nas telas do cliente e na landing. */
  font?: 'sans' | 'serif';
  /** Nome ao lado do símbolo. Na landing de cada funerária, o nome dela. */
  nome?: string;
};

function Logo({ className, font = 'sans', nome = 'Ampara', ...props }: LogoProps) {
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
        {/* O símbolo da Ampara no protótipo; outras marcas usam a inicial do nome. */}
        {nome === 'Ampara' ? 'V' : nome.charAt(0).toUpperCase()}
      </span>
      {nome}
    </span>
  );
}

export { Logo };
