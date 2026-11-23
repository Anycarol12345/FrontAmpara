import { useDashboardFuneraria, useListarFunerais } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { cn } from '@ampara/ui/lib/utils';
import {
  ArrowRight,
  Banknote,
  Calculator,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Percent,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { NOME_PERFIL, useAuth, usePermissao } from '@/features/auth';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { dataHora, numero } from '@/shared/lib/formatar';
import { DESTINACAO, STATUS_DO_FUNERAL } from '@/features/funeral';
import { GraficosFinanceiros } from '@/features/relatorios/components/GraficosFinanceiros';
import { FuneraisEmAndamento } from '@/features/relatorios/components/FuneraisEmAndamento';
import { PainelDoConsultor } from '@/features/vendas';

// As prioridades do dia ainda são dados fixos do protótipo.

const PRIORIDADES = [
  'Confirmar flores da cerimônia Martins',
  'Revisar documentos da família Santos',
  'Ligar para responsável pelo traslado',
];

export function VisaoGeralPage() {
  const { usuario } = useAuth();
  // Indicadores, gráficos e registro de atendimento são da equipe (gestor e funcionário):
  // o backend nega ao consultor (política EquipeFuneraria).
  const { ehEquipe } = usePermissao();
  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo={`${usuario ? NOME_PERFIL[usuario.perfil] : ''} · Painel`}
        titulo={`${saudacao()}, ${primeiroNome}`}
        descricao={
          ehEquipe
            ? 'Aqui está um resumo dos atendimentos e atividades da sua equipe.'
            : 'Acompanhe suas vendas e mantenha cada família bem orientada.'
        }
        acoes={
          ehEquipe ? (
            <Button asChild>
              <Link to="/painel/beneficiarios/novo">
                Novo atendimento <ArrowRight />
              </Link>
            </Button>
          ) : (
            <span className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to="/painel/simulador">
                  <Calculator /> Simular plano
                </Link>
              </Button>
              <Button asChild>
                <Link to="/painel/clientes">
                  Atender um cliente <ArrowRight />
                </Link>
              </Button>
            </span>
          )
        }
      />

      {ehEquipe ? (
        <>
          <Indicadores />
          <GraficosFinanceiros />
        </>
      ) : (
        <PainelDoConsultor />
      )}

      <FuneraisEmAndamento />

      {ehEquipe && (
        <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <AtividadesRecentes />
          <PrioridadesDoDia />
        </div>
      )}
    </div>
  );
}

function AtividadesRecentes() {
  const consulta = useListarFunerais({ pagina: 1, tamanho: 20 });
  const funerais = [...(consulta.data?.itens ?? [])]
    .sort((a, b) => b.data_hora_prevista.localeCompare(a.data_hora_prevista))
    .slice(0, 5);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold">Atividades recentes</h2>
          <p className="text-[11px] text-subtle-foreground">
            Últimos funerais registrados. Clique para abrir.
          </p>
        </div>
        <Link to="/painel/documentos" className="mt-1 text-xs font-semibold hover:underline">
          Ver todas
        </Link>
      </div>

      {consulta.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
      ) : consulta.isError ? (
        <p className="mt-4 text-sm text-destructive">Não foi possível carregar as atividades.</p>
      ) : funerais.length === 0 ? (
        <Vazio
          className="py-8"
          titulo="Nenhuma atividade ainda"
          descricao="Quando a equipe registrar um atendimento, ele aparece aqui."
          acao={
            <Button asChild size="sm">
              <Link to="/painel/beneficiarios/novo">
                Novo atendimento <ArrowRight />
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-4 flex flex-col">
          {funerais.map((f) => {
            const status = STATUS_DO_FUNERAL[f.status];
            const Icone = f.status === 'CONCLUIDO' ? FileText : UsersRound;
            return (
              <li key={f.id_funeral}>
                <Link
                  to={`/painel/funerais/${f.id_funeral}`}
                  className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3.5 transition-colors hover:bg-muted/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icone className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-bold">{f.nome_falecido}</span>
                    <span className="text-xs text-muted-foreground">
                      {DESTINACAO[f.destinacao]} · cerimônia {dataHora(f.data_hora_prevista)}
                    </span>
                  </span>
                  <Badge variant={status.variante}>{status.rotulo}</Badge>
                  <ChevronRight className="size-4 text-subtle-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function PrioridadesDoDia() {
  const [concluidas, setConcluidas] = useState<string[]>([]);

  function alternar(tarefa: string) {
    setConcluidas((atual) =>
      atual.includes(tarefa) ? atual.filter((t) => t !== tarefa) : [...atual, tarefa],
    );
  }

  return (
    <Card className="flex flex-col self-start p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Prioridades do dia</h2>
        <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Check className="size-4" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-1 text-[11px] text-subtle-foreground">
        {concluidas.length} de {PRIORIDADES.length} concluídas
      </p>

      <ul className="mt-4 flex flex-col gap-2.5">
        {PRIORIDADES.map((tarefa) => {
          const feita = concluidas.includes(tarefa);
          return (
            <li key={tarefa}>
              <button
                type="button"
                onClick={() => alternar(tarefa)}
                aria-pressed={feita}
                className="flex w-full items-center gap-3 rounded-xl border border-border/80 px-4 py-3.5 text-left text-[13px] transition-colors hover:bg-muted/40"
              >
                <span
                  className={cn(
                    'grid size-4 shrink-0 place-items-center rounded-full border',
                    feita ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                  )}
                >
                  {feita && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                <span className={cn(feita && 'text-muted-foreground line-through')}>{tarefa}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <Button variant="outline" className="mt-2.5 h-11 rounded-xl border-border/80 text-xs" asChild>
        <Link to="/painel/agenda">
          Ver agenda completa <ArrowRight />
        </Link>
      </Button>
    </Card>
  );
}

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

const realCompacto = (valor: number | string) =>
  numero(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  });

function Indicadores() {
  const dashboard = useDashboardFuneraria();

  return (
    <EstadoConsulta consulta={dashboard}>
      {(d) => (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            rotulo="Contratos ativos"
            valor={numero(d.contratos_ativos).toLocaleString('pt-BR')}
            detalhe={`Novos no mês: ${numero(d.novos_contratos_no_mes)}`}
            icone={FileText}
          />
          <StatCard
            rotulo="Receita recebida"
            valor={realCompacto(d.receita_recebida_no_mes)}
            detalhe={`Prevista no mês: ${realCompacto(d.receita_prevista_no_mes)}`}
            icone={Banknote}
          />
          <StatCard
            rotulo="Inadimplência"
            valor={`${numero(d.taxa_inadimplencia).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
            detalhe="Dos contratos em vigor"
            icone={Percent}
          />
          <StatCard
            rotulo="Funerais em andamento"
            valor={numero(d.funerais_em_andamento).toLocaleString('pt-BR')}
            detalhe={`Translados em andamento: ${numero(d.translados_em_andamento)}`}
            icone={CalendarDays}
          />
        </div>
      )}
    </EstadoConsulta>
  );
}
