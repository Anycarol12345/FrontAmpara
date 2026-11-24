import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[90svh] w-[calc(100%-2rem)] max-w-lg -translate-1/2 overflow-y-auto rounded-2xl bg-card p-7 text-card-foreground shadow-xl outline-none',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-5 right-5 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <XIcon className="size-4" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('pr-8 text-lg font-bold', className)} {...props} />;
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('mt-1 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-6 flex justify-end gap-3', className)} {...props} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
