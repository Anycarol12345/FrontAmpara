import {
  useBuscarClientes,
  useListarCatalogo,
  useListarPlanos,
  type Periodicidade,
  type PlanoResumoResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { cn } from '@ampara/ui/lib/utils';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Carregando, EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { numero, real } from '@/shared/lib/formatar';

const classeCampo =
  'h-11 w-full rounded-lg border border-white/15 bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30';

/**
 * Simulador do consultor (protótipo "Simulador"): monta o plano com a família, com os valores
 * publicados, e leva à contratação para o cliente escolhido.
 */
export function SimuladorPage() {
  const planos = useListarPlanos();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Consultor"
        titulo="Simulador"
        descricao="Monte o plano com a família, some os serviços avulsos e siga para a contratação."
      />
      <EstadoConsulta
        consulta={planos}
        estaVazio={(lista) => lista.every((p) => p.ativo === false)}
        vazio={
          <Card>
            <Vazio titulo="Nenhum plano ativo" descricao="Cadastre os planos em Planos." />
          </Card>
        }
      >
        {(lista) => (
          <Simulacao
            planos={lista
              .filter((p) => p.ativo !== false && p.id_plano)
              .sort((a, b) => numero(a.valor_mensal) - numero(b.valor_mensal))}
          />
        )}
      </EstadoConsulta>
    </div>
  );
}

function Simulacao({ planos }: { planos: PlanoResumoResponse[] }) {
  const navigate = useNavigate();
  const catalogo = useListarCatalogo();
  const clientes = useBuscarClientes({ tamanho: 100, ordenarPor: 'nome' });
  // Começa no plano do meio, o mais escolhido nas funerárias.
  const [idPlano, setIdPlano] = useState(planos[Math.floor((planos.length - 1) / 2)]!.id_plano!);
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>('ANUAL');
  const [dependentes, setDependentes] = useState(0);
  const [servicos, setServicos] = useState<string[]>([]);
  const [idCliente, setIdCliente] = useState('');

  const plano = planos.find((p) => p.id_plano === idPlano) ?? planos[0]!;
  const anual = periodicidade === 'ANUAL';
  const limite = numero(plano.limite_dependentes);
  const qtdDependentes = Math.min(dependentes, limite);
  const valorPlano =
    (anual ? numero(plano.valor_anual) : numero(plano.valor_mensal)) +
    qtdDependentes *
      (anual ? numero(plano.valor_dependente_anual) : numero(plano.valor_dependente_mensal));
  const itens = (catalogo.data ?? []).filter((i) => i.ativo);
  const escolhidos = itens.filter((i) => servicos.includes(i.id_item));
  const totalServicos = escolhidos.reduce((s, i) => s + numero(i.preco), 0);

  const alternar = (id: string) =>
    setServicos((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));

  const contratar = () =>
    void navigate(
      `/painel/clientes/${idCliente}/contratar?plano=${encodeURIComponent(plano.id_plano!)}&periodicidade=${periodicidade}`,
    );

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        <Card className="p-6">
          <h2 className="text-lg font-bold">1. Escolha o plano</h2>
          <p className="text-[11px] text-subtle-foreground">
            Os valores seguem a tabela publicada no site
          </p>
          <div role="radiogroup" aria-label="Plano" className="mt-4 grid gap-3 sm:grid-cols-3">
            {planos.map((p) => {
              const ativo = p.id_plano === plano.id_plano;
              return (
                <button
                  key={p.id_plano}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setIdPlano(p.id_plano!)}
                  className={cn(
                    'flex flex-col rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
                    ativo
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:bg-muted/50',
                  )}
                >
                  <span className="text-lg font-bold">{p.nome}</span>
                  <span
                    className={cn(
                      'mt-1 line-clamp-2 text-xs',
                      ativo ? 'text-primary-foreground/75' : 'text-muted-foreground',
                    )}
                  >
                    {p.descricao}
                  </span>
                  <span className="mt-3 text-sm font-semibold">{real(p.valor_mensal)}/mês</span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border/60 pt-5">
            <span className="text-xs font-semibold">Pagamento</span>
            <div role="radiogroup" aria-label="Pagamento" className="flex gap-1.5">
              {(['ANUAL', 'MENSAL'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={periodicidade === p}
                  onClick={() => setPeriodicidade(p)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                    periodicidade === p
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border hover:bg-muted',
                  )}
                >
                  {p === 'ANUAL' ? 'Anual' : 'Mensal'}
                </button>
              ))}
            </div>
            {anual && (
              <span className="text-xs text-muted-foreground">
                Equivale a {real(valorPlano / 12)} por mês
              </span>
            )}
            <span className="ml-auto flex items-center gap-3">
              <span className="text-xs font-semibold">Dependentes</span>
              <Button
                variant="outline"
                size="sm"
                aria-label="Menos um dependente"
                disabled={qtdDependentes === 0}
                onClick={() => setDependentes(qtdDependentes - 1)}
              >
                <Minus />
              </Button>
              <span className="w-5 text-center text-sm font-bold" aria-live="polite">
                {qtdDependentes}
              </span>
              <Button
                variant="outline"
                size="sm"
                aria-label="Mais um dependente"
                disabled={qtdDependentes >= limite}
                onClick={() => setDependentes(qtdDependentes + 1)}
              >
                <Plus />
              </Button>
              <span className="text-[11px] text-subtle-foreground">até {limite}</span>
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold">2. Serviços avulsos</h2>
          <p className="text-[11px] text-subtle-foreground">
            Itens do catálogo que a família quer incluir na estimativa
          </p>
          {catalogo.isPending ? (
            <Carregando />
          ) : itens.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">O catálogo ainda não tem itens.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {itens.map((i) => (
                <label
                  key={i.id_item}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/40 has-[[data-state=checked]]:border-primary"
                >
                  <Checkbox
                    checked={servicos.includes(i.id_item)}
                    onCheckedChange={() => alternar(i.id_item)}
                  />
                  <span className="flex-1 font-medium">{i.nome}</span>
                  <span className="text-xs font-semibold">+ {real(i.preco)}</span>
                </label>
              ))}
            </div>
          )}
        </Card>
      </div>

      <aside className="self-start rounded-2xl bg-primary p-6 text-primary-foreground lg:sticky lg:top-6">
        <p className="text-[10px] font-semibold tracking-wider text-white/60 uppercase">
          Resumo da simulação
        </p>
        <p className="mt-2 text-2xl font-bold">Plano {plano.nome}</p>
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs text-white/60">
            Pagamento {anual ? 'anual' : 'mensal'}
            {qtdDependentes > 0 &&
              ` · ${qtdDependentes} ${qtdDependentes === 1 ? 'dependente' : 'dependentes'}`}
          </p>
          <p className="mt-1 text-4xl font-bold">
            {real(valorPlano)}
            <span className="text-sm font-normal text-white/60"> /{anual ? 'ano' : 'mês'}</span>
          </p>
        </div>
        <div className="mt-4 border-t border-white/10 pt-4 text-sm">
          <p className="text-xs text-white/60">Serviços avulsos</p>
          {escolhidos.length === 0 ? (
            <p className="mt-1">Nenhum serviço selecionado.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-xs">
              {escolhidos.map((i) => (
                <li key={i.id_item} className="flex justify-between gap-3">
                  <span>{i.nome}</span>
                  <span>{real(i.preco)}</span>
                </li>
              ))}
              <li className="mt-1 flex justify-between gap-3 font-semibold">
                <span>Total avulsos</span>
                <span>{real(totalServicos)}</span>
              </li>
            </ul>
          )}
        </div>
        <label className="mt-5 flex flex-col gap-2 text-xs font-semibold">
          Contratar para
          <select
            className={classeCampo}
            value={idCliente}
            onChange={(e) => setIdCliente(e.target.value)}
          >
            <option value="">
              {clientes.isPending ? 'Carregando clientes…' : 'Escolha o cliente'}
            </option>
            {clientes.data?.itens.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <Button
          className="mt-4 w-full bg-linear-to-r from-accent to-[#d4b16c] text-accent-foreground hover:opacity-90"
          disabled={!idCliente}
          onClick={contratar}
        >
          Seguir para a contratação <ArrowRight />
        </Button>
        <p className="mt-3 text-[11px] leading-relaxed text-white/60">
          Estimativa inicial. Os serviços avulsos são cobrados à parte, no atendimento. A equipe
          confirma todos os detalhes com a família.
        </p>
      </aside>
    </div>
  );
}
