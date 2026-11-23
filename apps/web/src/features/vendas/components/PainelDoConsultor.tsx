import type { ContratoResumoResponse } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Card } from '@ampara/ui/components/card';
import {
  CalendarClock,
  ChevronRight,
  CircleAlert,
  FileText,
  Target,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router';
import { STATUS_CONTRATO } from '@/features/contratos';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { StatCard } from '@/shared/components/StatCard';
import { data, real } from '@/shared/lib/formatar';
import {
  contarPorStatus,
  contratoPorCliente,
  mesAnterior,
  mesDe,
  renovacoesProximas,
  useMetaMensal,
  useTodosContratos,
  valorMensal,
  variacao,
  vendasDoMes,
} from '../hooks/carteira';
import { MetaDoMes } from './MetaDoMes';

/**
 * Início do consultor (protótipo "Painel do Consultor"): vendas do mês, carteira, meta,
 * contratações recentes e quem precisa de retorno. Tudo calculado dos contratos reais.
 */
export function PainelDoConsultor() {
  const contratos = useTodosContratos();
  const { meta } = useMetaMensal();
  return (
    <EstadoConsulta consulta={contratos}>
      {(lista) => <Conteudo contratos={lista} meta={meta} />}
    </EstadoConsulta>
  );
}

function Conteudo({ contratos, meta }: { contratos: ContratoResumoResponse[]; meta: number }) {
  const mes = mesDe();
  const doMes = vendasDoMes(contratos, mes);
  const doMesAnterior = vendasDoMes(contratos, mesAnterior(mes));
  const delta = variacao(doMes.length, doMesAnterior.length);
  const carteira = [...contratoPorCliente(contratos).values()];
  const status = contarPorStatus(carteira);
  const acompanhar = carteira.filter((c) => c.status === 'A_PAGAR' || c.status === 'SUSPENSO');
  const percentual = Math.round((doMes.length / meta) * 100);
  const renovacoes = renovacoesProximas(carteira);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          rotulo="Vendas no mês"
          valor={String(doMes.length)}
          detalhe={
            delta === null
              ? `${doMesAnterior.length} no mês anterior`
              : `${delta >= 0 ? '+' : ''}${delta}% vs. mês anterior`
          }
          icone={TrendingUp}
        />
        <StatCard
          rotulo="Clientes com plano em dia"
          valor={String(status.ATIVO)}
          detalhe={`${carteira.length} clientes na carteira`}
          icone={UsersRound}
        />
        <StatCard
          rotulo="Aguardando pagamento"
          valor={String(status.A_PAGAR)}
          detalhe={`${real(doMes.reduce((s, c) => s + valorMensal(c), 0))}/mês em novos planos`}
          icone={FileText}
        />
        <StatCard
          rotulo="Meta mensal"
          valor={`${Math.min(percentual, 999)}%`}
          detalhe={doMes.length >= meta ? 'Meta batida' : `Faltam ${meta - doMes.length} contratos`}
          icone={Target}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">Contratações recentes</h2>
              <p className="text-[11px] text-subtle-foreground">
                Últimos planos fechados na funerária
              </p>
            </div>
            <Link to="/painel/contratos" className="mt-1 text-xs font-semibold hover:underline">
              Ver todas
            </Link>
          </div>
          {contratos.length === 0 ? (
            <Vazio
              className="py-8"
              titulo="Nenhuma contratação ainda"
              descricao="Use o simulador para montar o plano com a família."
            />
          ) : (
            <ul className="mt-4 flex flex-col">
              {contratos.slice(0, 5).map((c) => (
                <li key={c.id_contrato}>
                  <Link
                    to={`/painel/contratos/${c.id_contrato}`}
                    className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <UsersRound className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-bold">{c.nome_titular}</span>
                      <span className="text-xs text-muted-foreground">
                        Plano {c.nome_plano} · {data(c.data_contratacao)}
                      </span>
                    </span>
                    <Badge variant={STATUS_CONTRATO[c.status].variante}>
                      {STATUS_CONTRATO[c.status].rotulo}
                    </Badge>
                    <ChevronRight className="size-4 text-subtle-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col self-start p-6">
          <h2 className="text-lg font-bold">Para acompanhar</h2>
          <p className="mt-1 text-[11px] text-subtle-foreground">
            Clientes que ainda não pagaram ou estão com o plano suspenso
          </p>
          {acompanhar.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Ninguém pendente. Tudo em dia.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {acompanhar.slice(0, 4).map((c) => (
                <li key={c.id_contrato}>
                  <Link
                    to={`/painel/clientes/${c.id_cliente}`}
                    className="flex items-center gap-3 rounded-xl border border-border/80 px-4 py-3 text-[13px] transition-colors hover:bg-muted/40"
                  >
                    <CircleAlert className="size-4 shrink-0 text-warning-foreground" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{c.nome_titular}</span>
                      <span className="text-xs text-muted-foreground">
                        {STATUS_CONTRATO[c.status].rotulo} · Plano {c.nome_plano}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/painel/clientes"
            className="mt-2.5 rounded-xl border border-border/80 py-3 text-center text-xs font-semibold transition-colors hover:bg-muted/40"
          >
            Ver carteira completa
          </Link>
        </Card>
      </div>

      <MetaDoMes feitos={doMes.length} meta={meta} />

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Renovações próximas</h2>
            <p className="text-[11px] text-subtle-foreground">
              Planos anuais que renovam nos próximos 30 dias: boa hora para falar com a família
            </p>
          </div>
          <CalendarClock className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </div>
        {renovacoes.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum plano anual renova nos próximos 30 dias.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col">
            {renovacoes.slice(0, 6).map(({ contrato: c, dias }) => (
              <li key={c.id_contrato}>
                <Link
                  to={`/painel/clientes/${c.id_cliente}`}
                  className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-bold">{c.nome_titular}</span>
                    <span className="text-xs text-muted-foreground">
                      Plano {c.nome_plano} · {real(c.valor_total)}/ano · desde{' '}
                      {data(c.data_contratacao)}
                    </span>
                  </span>
                  <Badge variant={dias <= 7 ? 'warning' : 'info'}>
                    {dias === 0
                      ? 'Renova hoje'
                      : `Renova em ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
                  </Badge>
                  <ChevronRight className="size-4 text-subtle-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
