import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-11 w-full min-w-0 rounded-lg border border-input bg-card px-4 text-sm text-foreground transition-colors outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
