import {
  getMeusPedidosQueryKey,
  useAtualizarPedido,
  useMeusPedidos,
  type AtribuicaoResponse,
  type StatusPedido,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { toast } from '@ampara/ui/components/sonner';
import { MapPin } from 'lucide-react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { dataHora } from '@/shared/lib/formatar';

const STATUS_PEDIDO: Record<
  StatusPedido,
  { rotulo: string; variante: 'success' | 'warning' | 'info' | 'neutral' }
> = {
  PENDENTE: { rotulo: 'Aguardando aceite', variante: 'warning' },
  ACEITO: { rotulo: 'Aceito', variante: 'info' },
  EM_PREPARO: { rotulo: 'Em preparo', variante: 'warning' },
  ENTREGUE: { rotulo: 'Entregue', variante: 'success' },
  RECUSADO: { rotulo: 'Recusado', variante: 'neutral' },
  CANCELADO: { rotulo: 'Cancelado', variante: 'neutral' },
};

const PROXIMO: Partial<Record<StatusPedido, { para: StatusPedido; acao: string }>> = {
  ACEITO: { para: 'EM_PREPARO', acao: 'Comecei a preparar' },
  EM_PREPARO: { para: 'ENTREGUE', acao: 'Marcar como entregue' },
};

/** Pedido para o fornecedor: itens, local e horário da entrega e o andamento (FE-TER-01, FUN-09). */
export function ServicoPedido({ atribuicao }: { atribuicao: AtribuicaoResponse }) {
  const consulta = useMeusPedidos();
  const atualizar = useAtualizarPedido({
    mutation: { meta: { invalida: [getMeusPedidosQueryKey()] } },
  });

  return (
    <EstadoConsulta consulta={consulta}>
      {(pedidos) => {
        const p = pedidos.find((x) => x.id_pedido === atribuicao.id_origem);
        if (!p) return <Vazio titulo="Pedido não encontrado" />;
        const proximo = PROXIMO[p.status];
        return (
          <div className="flex flex-col gap-5">
            <Card className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{dataHora(p.data_hora_entrega)}</span>
                <Badge variant={STATUS_PEDIDO[p.status].variante}>
                  {STATUS_PEDIDO[p.status].rotulo}
                </Badge>
              </div>
              <p className="flex gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                {p.local_entrega}
              </p>
              <ul className="flex flex-col divide-y divide-border/60 text-sm">
                {p.itens.map((i) => (
                  <li key={i.id_funeral_item} className="flex justify-between gap-3 py-2">
                    <span>
                      {i.nome}
                      {i.variacao && <span className="text-muted-foreground"> · {i.variacao}</span>}
                    </span>
                    <span className="font-semibold">{i.quantidade}×</span>
                  </li>
                ))}
              </ul>
              {p.observacoes && <p className="text-xs text-muted-foreground">{p.observacoes}</p>}
            </Card>
            {proximo && (
              <Button
                size="lg"
                disabled={atualizar.isPending}
                onClick={() =>
                  atualizar.mutate(
                    { id: p.id_pedido, data: { status: proximo.para, observacao: null } },
                    {
                      onSuccess: () =>
                        toast.success(
                          `Pedido ${STATUS_PEDIDO[proximo.para].rotulo.toLowerCase()}.`,
                        ),
                    },
                  )
                }
              >
                {proximo.acao}
              </Button>
            )}
          </div>
        );
      }}
    </EstadoConsulta>
  );
}
