import {
  ehApiError,
  getObterFuneralQueryKey,
  useCancelarReserva,
  useListarLocais,
  useReservarLocal,
  type FuneralResponse,
  type ReservaResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { CalendarPlus, MapPin } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { Vazio } from '@/shared/components/EstadoConsulta';
import { dataLonga } from '@/shared/lib/formatar';
import { AgendaDoDia } from './AgendaDoDia';
import { hora, paraIso, TIPO_LOCAL } from './locais';

const classeSelect =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** "aaaa-mm-dd" e "hh:mm" locais de um ISO. */
const partes = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    dia: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    horario: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
};

/** Aba "Local e agenda": reservas do funeral, com a agenda do dia para evitar conflito (FE-ADM-06). */
export function LocalEAgenda({ funeral }: { funeral: FuneralResponse }) {
  const invalida = {
    mutation: { meta: { invalida: [getObterFuneralQueryKey(funeral.id_funeral)] } },
  };
  const cancelar = useCancelarReserva(invalida);
  const [reservando, setReservando] = useState(false);
  const [cancelando, setCancelando] = useState<ReservaResponse | null>(null);
  const encerrado = funeral.status === 'CONCLUIDO' || funeral.status === 'CANCELADO';

  return (
    <>
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Locais reservados</h2>
          {!encerrado && (
            <Button onClick={() => setReservando(true)}>
              <CalendarPlus /> Reservar local
            </Button>
          )}
        </div>
        {funeral.reservas.length === 0 ? (
          <Vazio
            titulo="Nenhum local reservado"
            descricao="Reserve a sala de velório e o local da cerimônia para este funeral."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {funeral.reservas.map((r) => (
              <li key={r.id_reserva} className="flex flex-wrap items-center gap-3 py-3">
                <MapPin className="size-4 text-muted-foreground" aria-hidden />
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold">{r.nome_local}</span>
                  <span className="text-xs text-muted-foreground">
                    {TIPO_LOCAL[r.tipo_local]} · {dataLonga(partes(r.inicio).dia)}, {hora(r.inicio)}{' '}
                    às {hora(r.fim)}
                  </span>
                </span>
                {!encerrado && (
                  <Button variant="ghost" size="sm" onClick={() => setCancelando(r)}>
                    Cancelar reserva
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {reservando && <ReservarDialog funeral={funeral} aoFechar={() => setReservando(false)} />}

      {cancelando && (
        <Dialog open onOpenChange={(aberto) => !aberto && setCancelando(null)}>
          <DialogContent className="max-w-md">
            <DialogTitle>Cancelar a reserva?</DialogTitle>
            <DialogDescription>
              {cancelando.nome_local}, {hora(cancelando.inicio)} às {hora(cancelando.fim)}. O
              horário fica livre para outros funerais.
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelando(null)}>
                Manter
              </Button>
              <Button
                disabled={cancelar.isPending}
                onClick={() =>
                  cancelar.mutate(
                    { id: funeral.id_funeral, idReserva: cancelando.id_reserva },
                    {
                      onSuccess: () => {
                        toast.success('Reserva cancelada.');
                        setCancelando(null);
                      },
                    },
                  )
                }
              >
                Cancelar reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function ReservarDialog({ funeral, aoFechar }: { funeral: FuneralResponse; aoFechar: () => void }) {
  const locais = useListarLocais({ ativos: true });
  const reservar = useReservarLocal({
    mutation: {
      meta: { invalida: [getObterFuneralQueryKey(funeral.id_funeral)], silenciarErro: true },
    },
  });
  const previsto = partes(funeral.data_hora_prevista);
  const [idLocal, setIdLocal] = useState('');
  const [dia, setDia] = useState(previsto.dia);
  const [inicio, setInicio] = useState(previsto.horario);
  const [fim, setFim] = useState('');
  const [erro, setErro] = useState<string>();
  const local = locais.data?.find((l) => l.id_local === idLocal);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!idLocal) return setErro('Escolha o local.');
    if (!dia || !inicio || !fim) return setErro('Informe o dia, o início e o fim.');
    if (fim <= inicio) return setErro('O fim precisa ser depois do início.');
    setErro(undefined);
    reservar.mutate(
      {
        id: funeral.id_funeral,
        data: { id_local: idLocal, inicio: paraIso(dia, inicio), fim: paraIso(dia, fim) },
      },
      {
        onSuccess: () => {
          toast.success('Local reservado.');
          aoFechar();
        },
        onError: (erroApi) =>
          setErro(
            ehApiError(erroApi) && erroApi.status === 409
              ? 'Esse horário já está ocupado, contando o intervalo de preparação da sala. Veja a agenda abaixo e escolha outro.'
              : erroApi.message,
          ),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Reservar local</DialogTitle>
        <DialogDescription>
          Velório previsto para {dataLonga(previsto.dia)}, às {previsto.horario}.
        </DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <ErroFormulario mensagem={erro} />
          <div className="grid gap-4 sm:grid-cols-4">
            <Campo id="reserva-local" label="Local" className="sm:col-span-4">
              <select
                className={classeSelect}
                value={idLocal}
                onChange={(e) => setIdLocal(e.target.value)}
              >
                <option value="">Escolha</option>
                {locais.data?.map((l) => (
                  <option key={l.id_local} value={l.id_local}>
                    {l.nome} ({TIPO_LOCAL[l.tipo]})
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id="reserva-dia" label="Dia" className="sm:col-span-2">
              <Input type="date" value={dia} onChange={(e) => setDia(e.target.value)} />
            </Campo>
            <Campo id="reserva-inicio" label="Início">
              <Input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </Campo>
            <Campo id="reserva-fim" label="Fim">
              <Input type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
            </Campo>
          </div>
          {local?.proprio && dia && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Agenda de {local.nome} no dia (com {local.intervalo_preparacao_minutos} min de
                preparação entre usos)
              </p>
              <AgendaDoDia dia={dia} locais={[local]} destacar={funeral.id_funeral} />
            </div>
          )}
          {local && !local.proprio && (
            <p className="text-xs text-muted-foreground">
              Este local não é da funerária: a reserva fica registrada, sem conferir a agenda.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={reservar.isPending}>
              {reservar.isPending ? 'Reservando...' : 'Reservar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
