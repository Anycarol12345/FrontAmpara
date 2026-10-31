import { useDashboardFuneraria } from '@ampara/api-client';
import { Card } from '@ampara/ui/components/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@ampara/ui/components/chart';
import { Bar, BarChart, LabelList, XAxis } from 'recharts';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { numero, real } from '@/shared/lib/formatar';

const CONFIG = { valor: { label: 'Valor' } } satisfies ChartConfig;

export function GraficosFinanceiros() {
  const dashboard = useDashboardFuneraria();

  return (
    <EstadoConsulta consulta={dashboard}>
      {(d) => {
        const dados = [
        { nome: 'Prevista', valor: numero(d.receita_prevista_no_mes) },
        { nome: 'Recebida', valor: numero(d.receita_recebida_no_mes) },
        ];
        const emAtraso = Math.min(100, Math.max(0, numero(d.taxa_inadimplencia)));
        const linhas = [
          { rotulo: 'Em atraso', percentual: emAtraso },
          { rotulo: 'Em dia', percentual: 100 - emAtraso },
        ];

        return (
          <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
            <Card className="p-6">
              <h2 className="text-lg font-bold">Receita do mês</h2>
              <p className="text-[11px] text-subtle-foreground">
                Faturas previstas e recebidas neste mês
              </p>
              <ChartContainer config={CONFIG} className="mt-4 h-56 w-full">
                <BarChart data={dados} margin={{ top: 24 }}>
                  <defs>
                    <linearGradient id="barra-receita" x1="0" y1="0" x2="1" y2="0">
                      <stop
                        offset="0%"
                        style={{ stopColor: 'color-mix(in oklab, var(--primary) 55%, white)' }}
                      />
                      <stop offset="100%" style={{ stopColor: 'var(--primary)' }} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="nome" tickLine={false} axisLine={false} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(valor) => real(Number(valor))}
                      />
                    }
                  />
                  <Bar dataKey="valor" fill="url(#barra-receita)" radius={10} maxBarSize={96}>
                    <LabelList
                      dataKey="valor"
                      position="top"
                      formatter={(valor: unknown) => real(Number(valor))}
                      className="fill-muted-foreground text-xs"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold">Inadimplência</h2>
              <p className="text-[11px] text-subtle-foreground">
                Contratos em vigor, ativos e suspensos
              </p>
              <ul className="mt-6 flex flex-col gap-5">
                {linhas.map(({ rotulo, percentual }) => (
                  <li key={rotulo}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold">{rotulo}</span>
                      <span className="text-muted-foreground">
                        {percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        );
      }}
    </EstadoConsulta>
  );
}