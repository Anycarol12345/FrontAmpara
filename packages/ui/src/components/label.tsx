import { Label as LabelPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-semibold text-foreground select-none', className)}
      {...props}
    />
  );
}

export { Label };
