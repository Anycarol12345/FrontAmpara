import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { useState } from 'react';
import { Link } from 'react-router';
import { Carregando } from '@/shared/components/EstadoConsulta';
import { data, real } from '@/shared/lib/formatar';
import { faturaEmDestaque, useFaturasDoContrato, type FaturaResponse } from '../hooks/faturas';
import { PagarFaturaDialog } from './PagarFaturaDialog';
import { competencia, podePagar, STATUS_FATURA } from './rotulos';

/** Card de próxima fatura com o botão de pagar, no início da área do cliente (FE-CLI-01). */
export function ProximaFatura({ idContrato, plano }: { idContrato: string; plano: string }) {
  const faturas = useFaturasDoContrato(idContrato);
  const [pagando, setPagando] = useState<FaturaResponse | null>(null);
  const proxima = faturas.data ? faturaEmDestaque(faturas.data) : undefined;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="text-base font-bold">Próxima fatura</h2>
          <p className="mt-0.5 text-[11px] text-subtle-foreground">Plano {plano}</p>
        </div>
        <Link to="/minha-conta/faturas" className="mt-1 text-xs font-semibold hover:underline">
          Ver todas
        </Link>
      </div>
      <div className="border-t border-border/70 px-6 py-5">
        {faturas.isPending ? (
          <Carregando className="py-2" />
        ) : faturas.isError ? (
          <p className="text-xs text-muted-foreground">
            Não foi possível carregar as faturas agora.
          </p>
        ) : !proxima ? (
          <p className="text-xs text-muted-foreground">Tudo pago. Nenhuma fatura em aberto.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex-1">
              <p className="text-sm font-semibold first-letter:uppercase">
                {competencia(proxima.competencia)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Vence em {data(proxima.data_vencimento)}
              </p>
            </div>
            <span className="text-lg font-bold">{real(proxima.valor)}</span>
            <Badge variant={STATUS_FATURA[proxima.status].variante}>
              {STATUS_FATURA[proxima.status].rotulo}
            </Badge>
            {podePagar(proxima.status) && (
              <Button onClick={() => setPagando(proxima)} disabled={!proxima.link_pagamento}>
                Pagar
              </Button>
            )}
          </div>
        )}
      </div>
      <PagarFaturaDialog fatura={pagando} aoFechar={() => setPagando(null)} />
    </Card>
  );
}
