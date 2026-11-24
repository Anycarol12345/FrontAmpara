import type { ContratoResumoResponse } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Banknote, Pencil, Target, TrendingUp, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { STATUS_CONTRATO } from '@/features/contratos';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { real } from '@/shared/lib/formatar';
import { AjustarMetaDialog, MetaDoMes } from '../../components/MetaDoMes';
import {
  contarPorStatus,
  contratoPorCliente,
  mesAnterior,
  mesDe,
  semanaDoMes,
  useMetaMensal,
  useTodosContratos,
  valorMensal,
  variacao,
  vendasDoMes,
} from '../../hooks/carteira';

/**
 * Desempenho do consultor (protótipo "Desempenho"): meta do mês, contratos por semana,
 * planos mais vendidos e a situação da carteira. Calculado dos contratos da funerária.
 */
export function DesempenhoPage() {
  const contratos = useTodosContratos();
  const { meta, salvar } = useMetaMensal();
  const [ajustando, setAjustando] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Consultor"
        titulo="Desempenho"
        descricao="Acompanhe a meta do mês, as vendas por semana e os planos que mais fecham."
        acoes={
          <Button variant="outline" onClick={() => setAjustando(true)}>
            <Pencil /> Ajustar meta
          </Button>
        }
      />
      <EstadoConsulta consulta={contratos}>
        {(lista) => <Indicadores contratos={lista} meta={meta} />}
      </EstadoConsulta>
      {ajustando && (
        <AjustarMetaDialog meta={meta} aoSalvar={salvar} aoFechar={() => setAjustando(false)} />
      )}
    </div>
  );
}

function Indicadores({ contratos, meta }: { contratos: ContratoResumoResponse[]; meta: number }) {
  const mes = mesDe();
  const doMes = vendasDoMes(contratos, mes);
  const anterior = vendasDoMes(contratos, mesAnterior(mes));
  const delta = variacao(doMes.length, anterior.length);
  const receitaNova = doMes.reduce((s, c) => s + valorMensal(c), 0);
  const carteira = [...contratoPorCliente(contratos).values()];
  const status = contarPorStatus(carteira);
  const emVigor = status.ATIVO + status.SUSPENSO;
  const emDia = emVigor === 0 ? 0 : Math.round((status.ATIVO / emVigor) * 100);

  const semanas = [1, 2, 3, 4, 5].map((s) => ({
    semana: s,
    total: doMes.filter((c) => semanaDoMes(c.data_contratacao) === s).length,
  }));
  // A 5ª semana só aparece quando o mês já chegou nela.
  const semanasVisiveis = new Date().getDate() > 28 ? semanas : semanas.slice(0, 4);
  const maiorSemana = Math.max(1, ...semanasVisiveis.map((s) => s.total));

  const porPlano = [
    ...doMes.reduce(
      (m, c) => m.set(c.nome_plano, (m.get(c.nome_plano) ?? 0) + 1),
      new Map<string, number>(),
    ),
  ].sort((a, b) => b[1] - a[1]);

  const funil = (['A_PAGAR', 'ATIVO', 'SUSPENSO', 'CANCELADO'] as const).map((s) => ({
    rotulo: STATUS_CONTRATO[s].rotulo,
    total: status[s],
  }));
  const maiorFunil = Math.max(1, ...funil.map((f) => f.total));

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          rotulo="Contratos no mês"
          valor={String(doMes.length)}
          detalhe={
            delta === null
              ? `${anterior.length} no mês anterior`
              : `${delta >= 0 ? '+' : ''}${delta}% vs. mês anterior`
          }
          icone={TrendingUp}
        />
        <StatCard
          rotulo="Meta mensal"
          valor={`${Math.min(999, Math.round((doMes.length / meta) * 100))}%`}
          detalhe={`${doMes.length} de ${meta} contratos`}
          icone={Target}
        />
        <StatCard
          rotulo="Carteira em dia"
          valor={`${emDia}%`}
          detalhe={`${status.ATIVO} de ${emVigor} planos em vigor`}
          icone={UsersRound}
        />
        <StatCard
          rotulo="Receita nova por mês"
          valor={real(receitaNova)}
          detalhe="Planos fechados neste mês (anuais ÷ 12)"
          icone={Banknote}
        />
      </div>

      <MetaDoMes feitos={doMes.length} meta={meta} />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold">Situação da carteira</h2>
          <p className="text-[11px] text-subtle-foreground">
            Quantos clientes estão em cada situação do plano
          </p>
          <ul className="mt-5 flex flex-col gap-4">
            {funil.map((f) => (
              <li key={f.rotulo}>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{f.rotulo}</span>
                  <span className="text-muted-foreground">{f.total}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(f.total / maiorFunil) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold">Contratos por semana</h2>
          <p className="text-[11px] text-subtle-foreground">Total fechado em cada semana do mês</p>
          <div
            className="mt-5 flex h-44 items-end gap-4"
            role="img"
            aria-label="Contratos por semana"
          >
            {semanasVisiveis.map((s) => (
              <div
                key={s.semana}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="text-sm font-bold">{s.total}</span>
                <div
                  className="w-full rounded-lg bg-primary"
                  style={{ height: `${Math.max(4, (s.total / maiorSemana) * 100)}%` }}
                />
                <span className="text-[11px] text-subtle-foreground">Sem {s.semana}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold">Planos mais contratados</h2>
        <p className="text-[11px] text-subtle-foreground">Divisão dos contratos fechados no mês</p>
        {porPlano.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum contrato fechado neste mês.</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {porPlano.map(([nome, total]) => {
              const pct = Math.round((total / doMes.length) * 100);
              return (
                <div key={nome}>
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{nome}</span>
                    <span className="text-muted-foreground">
                      {total} {total === 1 ? 'contrato' : 'contratos'} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
