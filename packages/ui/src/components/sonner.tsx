import type { CSSProperties } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** Toasts no padrão do shadcn/ui, com as cores da Ampara. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      richColors
      toastOptions={{ className: 'font-sans text-sm' }}
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { toast } from 'sonner';
export { Toaster };
