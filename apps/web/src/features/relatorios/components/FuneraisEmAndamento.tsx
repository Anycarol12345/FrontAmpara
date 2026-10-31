import { useListarFunerais } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import { UsersRound } from 'lucide-react';
import { dataHora } from '@/shared/lib/formatar';

const STATUS = {
  REGISTRADO: { rotulo: 'Registrado', variante: 'info' },
  EM_PREPARACAO: { rotulo: 'Em preparação', variante: 'warning' },
  VELORIO: { rotulo: 'Velório', variante: 'warning' },
} as const;

type StatusAberto = keyof typeof STATUS;

const DESTINACAO: Record<string, string> = {
  NAO_DEFINIDA: 'Destinação a definir',
  SEPULTAMENTO: 'Sepultamento',
  CREMACAO: 'Cremação',
};

export function FuneraisEmAndamento() {
  const consultas = [
    useListarFunerais({ status: 'REGISTRADO', tamanho: 5 }),
    useListarFunerais({ status: 'EM_PREPARACAO', tamanho: 5 }),
    useListarFunerais({ status: 'VELORIO', tamanho: 5 }),
  ];

  const carregando = consultas.some((c) => c.isPending);
  const comErro = consultas.some((c) => c.isError);
  const funerais = consultas
    .flatMap((c) => c.data?.itens ?? [])
    .sort((a, b) => a.data_hora_prevista.localeCompare(b.data_hora_prevista))
    .slice(0, 6);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold">Funerais em andamento</h2>
      <p className="text-[11px] text-subtle-foreground">
        Registrados, em preparação ou em velório, do mais próximo ao mais distante
      </p>

      {carregando ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
      ) : comErro ? (
        <p className="mt-4 text-sm text-destructive">Não foi possível carregar os funerais.</p>
      ) : funerais.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nenhum funeral em andamento.</p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {funerais.map((f) => {
            const status = STATUS[f.status as StatusAberto];
            return (
              <li key={f.id_funeral} className="flex items-center gap-4 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <UsersRound className="size-4" strokeWidth={1.75} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold">{f.nome_falecido}</span>
                  <span className="text-xs text-muted-foreground">
                    {DESTINACAO[f.destinacao] ?? f.destinacao} · {dataHora(f.data_hora_prevista)}
                  </span>
                </span>
                <Badge variant={status.variante}>{status.rotulo}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}