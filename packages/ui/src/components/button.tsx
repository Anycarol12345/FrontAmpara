import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-brand-800',
        brand:
          'bg-brand-800 text-primary-foreground shadow-lg shadow-brand-800/25 hover:bg-primary',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/85',
        outline: 'border bg-card text-foreground hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 rounded-full px-5 text-sm',
        sm: 'h-8 rounded-full px-3.5 text-xs',
        lg: 'h-12 rounded-full px-6 text-sm',
        icon: 'size-9 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
