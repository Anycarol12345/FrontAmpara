import { Input } from '@ampara/ui/components/input';
import { cn } from '@ampara/ui/lib/utils';
import { useState, type ComponentProps } from 'react';

/** Campo de senha com o botão "Mostrar" dentro do input. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative">
      <Input type={visivel ? 'text' : 'password'} className={cn('pr-20', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        className="absolute inset-y-0 right-4 text-xs font-semibold text-foreground hover:underline"
        aria-pressed={visivel}
      >
        {visivel ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  );
}
