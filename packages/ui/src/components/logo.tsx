import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

type LogoProps = ComponentProps<'span'> & {
  /** `sans` no portal da equipe, `serif` nas telas do cliente e na landing. */
  font?: 'sans' | 'serif';
  /** Nome ao lado do símbolo. Na landing de cada funerária, o nome dela. */
  nome?: string;
};

/**
 * Símbolo da Ampara do protótipo do Figma: um círculo com duas metades de folha.
 * Usa a cor do texto (currentColor), então acompanha o fundo claro ou escuro de cada tela.
 */
function SimboloAmpara({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden className={className}>
      <circle
        cx="18"
        cy="18"
        r="17.1"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.31"
      />
      <path
        d="M18 7.04C14.32 9.9 12.44 13.91 12.44 18.08C12.44 22.5 14.73 25.94 18 27.41V7.04Z"
        fill="currentColor"
        fillOpacity="0.42"
      />
      <path
        d="M18 7.04C21.68 9.9 23.56 13.91 23.56 18.08C23.56 22.5 21.27 25.94 18 27.41V7.04Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
      <SimboloAmpara className="size-[1.6em] shrink-0" />
      {nome}
    </span>
  );
}

export { Logo };
