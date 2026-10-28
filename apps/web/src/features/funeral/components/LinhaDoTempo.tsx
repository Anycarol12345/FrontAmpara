import { cn } from '@ampara/ui/lib/utils';
import { Check } from 'lucide-react';
import { dataHora } from '@/shared/lib/formatar';
import type { EtapaHistorico } from '../hooks/funerais';

type Props<S extends string> = {
  etapas: { status: S; rotulo: string; descricao?: string }[];
  atual: S;
  historico: EtapaHistorico<S>[];
  rotulo: string;
};

/** Linha do tempo de etapas: feitas, a atual e as próximas, com a hora de cada mudança. */
export function LinhaDoTempo<S extends string>({ etapas, atual, historico, rotulo }: Props<S>) {
  const indiceAtual = etapas.findIndex((e) => e.status === atual);

  return (
    <ol aria-label={rotulo} className="flex flex-col">
      {etapas.map((etapa, i) => {
        const feita = i < indiceAtual;
        const corrente = i === indiceAtual;
        const quando = historico.findLast((h) => h.status === etapa.status);
        return (
          <li
            key={etapa.status}
            aria-current={corrente ? 'step' : undefined}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {i < etapas.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-6 left-[11px] h-[calc(100%-24px)] w-px',
                  feita ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                'relative grid size-6 shrink-0 place-items-center rounded-full border text-[10px]',
                feita && 'border-primary bg-primary text-primary-foreground',
                corrente && 'border-primary bg-card ring-4 ring-primary/15',
                !feita && !corrente && 'border-border bg-card',
              )}
            >
              {feita ? (
                <Check className="size-3" strokeWidth={3} />
              ) : corrente ? (
                <span className="size-2 rounded-full bg-primary" />
              ) : null}
            </span>
            <div className="-mt-0.5">
              <p
                className={cn(
                  'text-sm',
                  corrente ? 'font-bold' : feita ? 'font-semibold' : 'text-muted-foreground',
                )}
              >
                {etapa.rotulo}
                {corrente && <span className="sr-only"> (etapa atual)</span>}
              </p>
              {(feita || corrente) && quando && (
                <p className="text-[11px] text-subtle-foreground">{dataHora(quando.data_hora)}</p>
              )}
              {corrente && etapa.descricao && (
                <p className="mt-1 text-xs text-muted-foreground">{etapa.descricao}</p>
              )}
              {quando?.observacao && (feita || corrente) && (
                <p className="mt-1 text-xs text-muted-foreground italic">{quando.observacao}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
