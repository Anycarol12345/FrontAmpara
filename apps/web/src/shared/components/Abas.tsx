import { cn } from '@ampara/ui/lib/utils';
import type { ReactNode } from 'react';

export type Aba = { id: string; titulo: string };

/** Abas acessíveis (tablist): quem usa guarda a aba ativa e mostra o conteúdo dentro de <PainelDaAba>. */
export function Abas({
  abas,
  ativa,
  aoMudar,
  rotulo,
}: {
  abas: readonly Aba[];
  ativa: string;
  aoMudar: (id: string) => void;
  rotulo: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={rotulo}
      className="flex gap-1 overflow-x-auto border-b border-border/60"
    >
      {abas.map((aba) => {
        const selecionada = aba.id === ativa;
        return (
          <button
            key={aba.id}
            type="button"
            role="tab"
            id={`aba-${aba.id}`}
            aria-selected={selecionada}
            aria-controls={`painel-${aba.id}`}
            onClick={() => aoMudar(aba.id)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/15',
              selecionada
                ? 'border-primary font-semibold text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {aba.titulo}
          </button>
        );
      })}
    </div>
  );
}

export function PainelDaAba({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={`painel-${id}`}
      aria-labelledby={`aba-${id}`}
      className="flex flex-col gap-6"
    >
      {children}
    </div>
  );
}
