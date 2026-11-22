import {
  getAgendaLocalQueryOptions,
  type LocalResponse,
  type ReservaAgendaResponse,
} from '@ampara/api-client';
import { Card } from '@ampara/ui/components/card';
import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Carregando } from '@/shared/components/EstadoConsulta';
import { diasUtcDoDia, hora, limitesDoDia, posicaoNoDia, tocaODia } from './locais';

const MARCAS = [0, 6, 12, 18, 24];

/**
 * Ocupação de cada sala no dia: a reserva em cor cheia e o intervalo de preparação listrado,
 * porque a sala só fica livre depois dele (FE-ADM-06).
 */
export function AgendaDoDia({
  dia,
  locais,
  destacar,
}: {
  /** "aaaa-mm-dd" */
  dia: string;
  locais: LocalResponse[];
  /** Funeral que está sendo agendado: as reservas dele aparecem destacadas. */
  destacar?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="ml-[150px] hidden justify-between text-[10px] text-subtle-foreground sm:flex">
        {MARCAS.map((h) => (
          <span key={h}>{String(h).padStart(2, '0')}h</span>
        ))}
      </div>
      {locais.map((local) => (
        <LinhaDaSala key={local.id_local} dia={dia} local={local} destacar={destacar} />
      ))}
    </div>
  );
}

function LinhaDaSala({
  dia,
  local,
  destacar,
}: {
  dia: string;
  local: LocalResponse;
  destacar: string | undefined;
}) {
  const agenda = useReservasDoDia(local.id_local, dia);
  const reservas = agenda.reservas;
  const inicioDoDia = limitesDoDia(dia).inicio;
  // Reserva que começou num dia anterior mostra a data junto da hora.
  const horario = (iso: string) =>
    new Date(iso) < inicioDoDia
      ? `${new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hora(iso)}`
      : hora(iso);
  return (
    <Card key={local.id_local} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="w-[134px] shrink-0">
        <p className="text-sm font-semibold">{local.nome}</p>
        <p className="text-[11px] text-muted-foreground">
          {reservas.length === 0
            ? 'Livre o dia todo'
            : `${reservas.length} ${reservas.length === 1 ? 'reserva' : 'reservas'}`}
        </p>
      </div>
      {agenda.carregando ? (
        <Carregando className="py-2" />
      ) : (
        <div className="flex flex-1 flex-col gap-2">
          <div
            className="relative h-9 rounded-lg bg-muted"
            role="img"
            aria-label={`Ocupação de ${local.nome}`}
          >
            {reservas.map((r) => {
              const ini = posicaoNoDia(r.inicio, dia);
              const fim = posicaoNoDia(r.fim, dia);
              const livre = posicaoNoDia(r.ocupado_ate, dia);
              const minha = r.id_funeral === destacar;
              return (
                <span key={r.id_reserva}>
                  <span
                    className={`absolute inset-y-1 rounded ${minha ? 'bg-primary' : 'bg-primary/60'}`}
                    style={{ left: `${ini}%`, width: `${Math.max(fim - ini, 0.6)}%` }}
                  />
                  <span
                    className="absolute inset-y-1 rounded-r bg-[repeating-linear-gradient(45deg,var(--color-primary)_0_2px,transparent_2px_6px)] opacity-30"
                    style={{ left: `${fim}%`, width: `${Math.max(livre - fim, 0)}%` }}
                  />
                </span>
              );
            })}
          </div>
          {reservas.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs">
              {reservas.map((r) => (
                <li key={r.id_reserva} className="flex flex-wrap gap-x-2">
                  <span className="font-semibold">
                    {horario(r.inicio)}–{hora(r.fim)}
                  </span>
                  <Link
                    to={`/painel/funerais/${r.id_funeral}?aba=local`}
                    className="hover:underline"
                  >
                    {r.nome_falecido}
                  </Link>
                  <span className="text-muted-foreground">
                    · livre a partir de {hora(r.ocupado_ate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Reservas que ocupam a sala no dia local, contando o intervalo de preparação.
 * A API consulta por dia em UTC; aqui juntamos os dias UTC que cobrem o dia local e
 * descartamos o que não toca nele (sem isso, a reserva das 22h aparecia também no dia seguinte).
 */
function useReservasDoDia(idLocal: string, dia: string) {
  const consultas = useQueries({
    queries: diasUtcDoDia(dia).map((data) => getAgendaLocalQueryOptions(idLocal, { data })),
  });
  const vistas = new Set<string>();
  const reservas: ReservaAgendaResponse[] = [];
  for (const r of consultas.flatMap((c) => c.data?.reservas ?? [])) {
    if (vistas.has(r.id_reserva) || !tocaODia(r.inicio, r.ocupado_ate, dia)) continue;
    vistas.add(r.id_reserva);
    reservas.push(r);
  }
  reservas.sort((a, b) => a.inicio.localeCompare(b.inicio));
  return { reservas, carregando: consultas.some((c) => c.isPending) };
}
