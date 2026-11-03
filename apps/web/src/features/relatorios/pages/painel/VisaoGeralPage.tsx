import { useDashboardFuneraria } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { cn } from '@ampara/ui/lib/utils';
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Percent,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { NOME_PERFIL, useAuth, usePermissao } from '@/features/auth';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { numero } from '@/shared/lib/formatar';
import { GraficosFinanceiros } from '@/features/relatorios/components/GraficosFinanceiros';
import { FuneraisEmAndamento } from '@/features/relatorios/components/FuneraisEmAndamento';

// Atividades e prioridades ainda são dados fixos do protótipo.

type Status = 'Concluído' | 'Em andamento' | 'Agendado';

const VARIANTE_STATUS = {
  Concluído: 'success',
  'Em andamento': 'warning',
  Agendado: 'info',
} as const satisfies Record<Status, string>;

const ATIVIDADES: {
  familia: string;
  descricao: string;
  status: Status;
  quando: string;
  icone: LucideIcon;
}[] = [
  {
    familia: 'Família Martins',
    descricao: 'Documentação recebida',
    status: 'Concluído',
    quando: 'há 12 min',
    icone: UsersRound,
  },
  {
    familia: 'Família Oliveira',
    descricao: 'Ornamentação confirmada',
    status: 'Concluído',
    quando: 'há 35 min',
    icone: FileText,
  },
  {
    familia: 'Família Santos',
    descricao: 'Aguardando traslado',
    status: 'Em andamento',
    quando: 'há 1 hora',
    icone: UsersRound,
  },
  {
    familia: 'Família Lima',
    descricao: 'Cerimônia agendada',
    status: 'Agendado',
    quando: 'há 2 horas',
    icone: FileText,
  },
];

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
            : 'Seus clientes e contratações, e os funerais em andamento na funerária.'
        }
        acoes={
          ehEquipe ? (
            <Button asChild>
              <Link to="/painel/beneficiarios/novo">
                Novo atendimento <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/painel/clientes">
                Atender um cliente <ArrowRight />
              </Link>
            </Button>
          )
        }
      />

      {ehEquipe ? (
        <>
          <Indicadores />
          <GraficosFinanceiros />
        </>
      ) : (
        <AtalhosDoConsultor />
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

/** Início do consultor: os atalhos do que ele faz no dia a dia (DEC-11). */
function AtalhosDoConsultor() {
  const atalhos = [
    {
      titulo: 'Clientes',
      descricao: 'Cadastre clientes e consulte os dados de quem você atende.',
      para: '/painel/clientes',
      icone: UsersRound,
    },
    {
      titulo: 'Contratos',
      descricao: 'Acompanhe as contratações e a situação de cada plano.',
      para: '/painel/contratos',
      icone: FileText,
    },
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {atalhos.map(({ titulo, descricao, para, icone: Icone }) => (
        <Link key={para} to={para} className="group">
          <Card className="flex h-full items-center gap-4 p-6 transition-colors group-hover:bg-muted/40">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Icone className="size-5" strokeWidth={1.75} />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-base font-bold">{titulo}</span>
              <span className="text-xs text-muted-foreground">{descricao}</span>
            </span>
            <ChevronRight className="size-4 text-subtle-foreground" />
          </Card>
        </Link>
      ))}
    </div>
  );
}

function AtividadesRecentes() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold">Atividades recentes</h2>
          <p className="text-[11px] text-subtle-foreground">Atualizado há poucos minutos</p>
        </div>
        <Link to="/painel/clientes" className="mt-1 text-xs font-semibold hover:underline">
          Ver todas
        </Link>
      </div>

      <ul className="mt-4 flex flex-col">
        {ATIVIDADES.map(({ familia, descricao, status, quando, icone: Icone }) => (
          <li key={familia}>
            <a
              href="#"
              className="flex items-center gap-4 rounded-lg py-3.5 transition-colors hover:bg-muted/50"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icone className="size-4" strokeWidth={1.75} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-bold">{familia}</span>
                <span className="text-xs text-muted-foreground">{descricao}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <Badge variant={VARIANTE_STATUS[status]}>{status}</Badge>
                <span className="text-[10px] text-subtle-foreground">{quando}</span>
              </span>
              <ChevronRight className="size-4 text-subtle-foreground" />
            </a>
          </li>
        ))}
      </ul>
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
