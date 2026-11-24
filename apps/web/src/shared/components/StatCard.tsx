import { Card } from '@ampara/ui/components/card';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  rotulo: string;
  valor: string;
  detalhe: string;
  icone: LucideIcon;
};

/** Cartão de indicador do topo dos painéis. */
export function StatCard({ rotulo, valor, detalhe, icone: Icone }: StatCardProps) {
  return (
    <Card className="flex flex-col p-6">
      <div className="flex items-start justify-between">
        <span className="text-[13px] text-muted-foreground">{rotulo}</span>
        <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icone className="size-4" strokeWidth={1.75} />
        </span>
      </div>
      <span className="mt-3 text-[34px] leading-none font-bold tracking-tight">{valor}</span>
      <span className="mt-3.5 text-xs text-muted-foreground">{detalhe}</span>
    </Card>
  );
}
