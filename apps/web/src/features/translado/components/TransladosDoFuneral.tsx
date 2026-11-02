import {
  getTransladosDoFuneralQueryKey,
  useAlterarStatusTranslado,
  useAtribuirFrotaTranslado,
  useEmpresasDisponiveisTranslado,
  useHistoricoTranslado,
  usePendenciasDocumentosTranslado,
  useTransladosDoFuneral,
  type StatusTranslado,
  type TransladoResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { toast } from '@ampara/ui/components/sonner';
import { ArrowRight, Check, CircleAlert, Plus, Truck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { dataHora, numero, real } from '@/shared/lib/formatar';
import { useTransladoTempoReal } from '../hooks/useTransladoTempoReal';
import { TIPO_TRANSLADO } from './faixas';
import { NovoTransladoDialog } from './NovoTransladoDialog';
import { ACEITE, encerrado, PROXIMO_STATUS, STATUS_TRANSLADO } from './rotulos';

const classeSelect =
  'h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Aba "Translado" do funeral: registro, empresa, andamento e documentos (FE-ADM-07, TRA-01 a TRA-06). */
export function TransladosDoFuneral({
  idFuneral,
  dataPrevista,
}: {
  idFuneral: string;
  /** Data do funeral, sugerida no novo translado. */
  dataPrevista: string;
}) {
  const consulta = useTransladosDoFuneral(idFuneral);
  const [novo, setNovo] = useState(false);
  useTransladoTempoReal();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          O valor sai da tabela de km da funerária; os km incluídos no plano já vêm descontados.
        </p>
        <Button onClick={() => setNovo(true)}>
          <Plus /> Novo translado
        </Button>
      </div>
      <EstadoConsulta
        consulta={consulta}
        estaVazio={(ts) => ts.length === 0}
        vazio={
          <Card>
            <Vazio
              titulo="Nenhum translado registrado"
              descricao="Registre a remoção do corpo até a funerária ou o traslado até o local da cerimônia."
            />
          </Card>
        }
      >
        {(translados) => (
          <div className="flex flex-col gap-5">
            {translados.map((t) => (
              <CartaoDoTranslado key={t.id_translado} translado={t} />
            ))}
          </div>
        )}
      </EstadoConsulta>
      {novo && (
        <NovoTransladoDialog
          idFuneral={idFuneral}
          dataPrevista={dataPrevista}
          aoFechar={() => setNovo(false)}
        />
      )}
    </>
  );
}

function CartaoDoTranslado({ translado: t }: { translado: TransladoResponse }) {
  const situacao = STATUS_TRANSLADO[t.status];
  const invalida = {
    mutation: { meta: { invalida: [getTransladosDoFuneralQueryKey(t.id_funeral)] } },
  };
  const alterarStatus = useAlterarStatusTranslado(invalida);
  const [confirmar, setConfirmar] = useState<StatusTranslado | null>(null);
  const proximo = PROXIMO_STATUS[t.status];

  const mudar = (status: StatusTranslado) =>
    alterarStatus.mutate(
      { id: t.id_translado, data: { status, observacao: null } },
      {
        onSuccess: () => {
          toast.success(`Translado: ${STATUS_TRANSLADO[status].rotulo.toLowerCase()}.`);
          setConfirmar(null);
        },
      },
    );

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
            {TIPO_TRANSLADO[t.tipo]} · {numero(t.distancia_km)} km
            {t.distancia_manual && ' (informado)'}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-base font-bold">
            {t.origem.cidade}-{t.origem.uf} <ArrowRight className="size-4" aria-hidden />{' '}
            {t.destino.cidade}-{t.destino.uf}
          </p>
          <p className="text-xs text-muted-foreground">Previsto para {dataHora(t.data_prevista)}</p>
        </div>
        <Badge variant={situacao.variante}>{situacao.rotulo}</Badge>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <Valor rotulo="Valor do translado" valor={real(t.valor)} />
        <Valor rotulo="Coberto pelo plano" valor={real(t.valor_coberto_plano)} />
        <Valor rotulo="A pagar pela família" valor={real(t.valor_a_pagar)} destaque />
      </dl>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Empresa translado={t} />
          <dl className="grid gap-1 text-sm">
            <dt className="text-xs text-muted-foreground">Retirada</dt>
            <dd>
              {t.origem.endereco}, {t.origem.cidade}-{t.origem.uf}
            </dd>
            <dt className="mt-2 text-xs text-muted-foreground">Entrega</dt>
            <dd>
              {t.destino.endereco}, {t.destino.cidade}-{t.destino.uf}
            </dd>
          </dl>
          <Documentos idTranslado={t.id_translado} />
        </div>
        <Historico idTranslado={t.id_translado} />
      </div>

      {!encerrado(t.status) && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="outline" onClick={() => setConfirmar('CANCELADO')}>
            Cancelar translado
          </Button>
          {proximo && (
            <Button onClick={() => setConfirmar(proximo.para)} disabled={!t.id_terceiro_frota}>
              {proximo.acao}
            </Button>
          )}
        </div>
      )}

      {confirmar && (
        <Dialog open onOpenChange={(aberto) => !aberto && setConfirmar(null)}>
          <DialogContent className="max-w-md">
            <DialogTitle>
              {confirmar === 'CANCELADO'
                ? 'Cancelar o translado?'
                : `Mudar para "${STATUS_TRANSLADO[confirmar].rotulo}"?`}
            </DialogTitle>
            <DialogDescription>
              {confirmar === 'CANCELADO'
                ? 'A empresa é avisada e o translado não pode ser retomado. Para refazer, registre um novo.'
                : 'A família e a empresa de translado acompanham a mudança em tempo real.'}
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmar(null)}>
                Voltar
              </Button>
              <Button disabled={alterarStatus.isPending} onClick={() => mudar(confirmar)}>
                {confirmar === 'CANCELADO' ? 'Cancelar translado' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

function Valor({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className={destaque ? 'text-lg font-bold' : 'text-lg font-semibold'}>{valor}</dd>
    </div>
  );
}

/** Empresa de frota: atribuir (ou trocar depois da recusa), o aceite e o motorista. */
function Empresa({ translado: t }: { translado: TransladoResponse }) {
  const podeAtribuir =
    !encerrado(t.status) && (!t.id_terceiro_frota || t.status_aceite === 'RECUSADO');
  const empresas = useEmpresasDisponiveisTranslado(t.id_translado, {
    query: { enabled: podeAtribuir },
  });
  const atribuir = useAtribuirFrotaTranslado({
    mutation: { meta: { invalida: [getTransladosDoFuneralQueryKey(t.id_funeral)] } },
  });
  const [escolhida, setEscolhida] = useState('');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Truck className="size-4 text-muted-foreground" aria-hidden />
          {t.nome_frota ?? 'Sem empresa de translado'}
        </span>
        {t.status_aceite && (
          <Badge variant={ACEITE[t.status_aceite].variante}>{ACEITE[t.status_aceite].rotulo}</Badge>
        )}
      </div>
      {t.status_aceite === 'RECUSADO' && t.motivo_recusa && (
        <p className="text-xs text-muted-foreground">Motivo da recusa: {t.motivo_recusa}</p>
      )}
      {t.motorista && (
        <p className="flex items-start gap-2 text-xs">
          <UserRound className="mt-0.5 size-3.5 text-muted-foreground" aria-hidden />
          <span>
            {t.motorista.nome} · {t.motorista.telefone}
            <br />
            {t.motorista.modelo}, placa {t.motorista.placa}
          </span>
        </p>
      )}
      {podeAtribuir && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Empresa de translado"
            className={classeSelect}
            value={escolhida}
            onChange={(e) => setEscolhida(e.target.value)}
          >
            <option value="">
              {empresas.isPending
                ? 'Carregando empresas...'
                : empresas.data?.length
                  ? 'Escolha a empresa'
                  : 'Nenhuma empresa atende a origem'}
            </option>
            {empresas.data?.map((e) => (
              <option key={e.id_terceiro} value={e.id_terceiro}>
                {e.nome}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!escolhida || atribuir.isPending}
            onClick={() =>
              atribuir.mutate(
                { id: t.id_translado, data: { id_terceiro: escolhida } },
                {
                  onSuccess: () => {
                    toast.success('Empresa avisada. Ela precisa aceitar o translado.');
                    setEscolhida('');
                  },
                },
              )
            }
          >
            {t.status_aceite === 'RECUSADO' ? 'Enviar para outra empresa' : 'Enviar para a empresa'}
          </Button>
        </div>
      )}
    </div>
  );
}

function Documentos({ idTranslado }: { idTranslado: string }) {
  const consulta = usePendenciasDocumentosTranslado(idTranslado);
  if (!consulta.data || consulta.data.documentos.length === 0) return null;
  const { documentos, completo } = consulta.data;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold">
        Documentos exigidos {completo ? '· completos' : '· faltam documentos'}
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        {documentos.map((d) => (
          <li key={d.tipo} className="flex items-center gap-2">
            {d.presente ? (
              <Check className="size-4 text-primary" aria-label="Anexado" />
            ) : (
              <CircleAlert className="size-4 text-warning-foreground" aria-label="Falta" />
            )}
            {d.tipo}
          </li>
        ))}
      </ul>
      {!completo && (
        <p className="text-[11px] text-subtle-foreground">
          Anexe os documentos que faltam na aba Documentos do funeral.
        </p>
      )}
    </div>
  );
}

function Historico({ idTranslado }: { idTranslado: string }) {
  const consulta = useHistoricoTranslado(idTranslado);
  const mudancas = [...(consulta.data ?? [])].sort((a, b) => b.em.localeCompare(a.em));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold">Andamento</p>
      {mudancas.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem mudanças ainda.</p>
      ) : (
        <ol aria-label="Andamento do translado" className="flex flex-col">
          {mudancas.map((m) => (
            <li
              key={`${m.em}-${m.para}`}
              className="flex flex-col gap-0.5 border-l-2 border-border/60 pb-4 pl-4 last:pb-0"
            >
              <span className="text-sm font-semibold">{STATUS_TRANSLADO[m.para].rotulo}</span>
              <span className="text-xs text-muted-foreground">{dataHora(m.em)}</span>
              {m.observacao && <span className="text-xs">{m.observacao}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
