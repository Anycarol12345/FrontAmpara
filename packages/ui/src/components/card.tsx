import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-xl border border-border/60 bg-card text-card-foreground', className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 p-5', className)} {...props} />;
}

function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 className={cn('text-base font-bold', className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-xs text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
