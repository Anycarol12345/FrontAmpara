import {
  baixarDocumento,
  useIdentidadeVisual,
  useItensFuneral,
  useListarDocumentos,
  useObterCertidao,
  useObterFuneral,
  useTransladosDoFuneral,
  type FuneralResponse,
  type ReservaResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { toast } from '@ampara/ui/components/sonner';
import { ArrowLeft, Download, FileText, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useTransladoTempoReal } from '@/features/translado';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { dataHora } from '@/shared/lib/formatar';
import { IndicadorConexao } from '@/shared/tempo-real/IndicadorConexao';
import { LinhaDoTempo } from '../../components/LinhaDoTempo';
import {
  ETAPAS_FUNERAL,
  ETAPAS_TRANSLADO,
  STATUS_CERTIDAO,
  STATUS_FUNERAL,
} from '../../components/rotulos';

// Partes que a família pode não ter permissão de ver: sem toast de erro, a seção só não aparece.
const SILENCIOSO = { query: { meta: { silenciarErro: true }, retry: false } };

/**
 * Acompanhamento do funeral e do translado pela família (FE-CLI-08, GET /funerais/{id}).
 * Os textos seguem o cuidado do FDEC-03: a família está em luto.
 */
export function AcompanhamentoPage() {
  const { id = '' } = useParams();
  const consulta = useObterFuneral(id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/minha-conta/atendimentos"
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Atendimentos
      </Link>
      <EstadoConsulta consulta={consulta}>
        {(funeral) => <Detalhe funeral={funeral} />}
      </EstadoConsulta>
    </div>
  );
}

function Detalhe({ funeral }: { funeral: FuneralResponse }) {
  const cancelado = funeral.status === 'CANCELADO';
  const velorio = funeral.reservas.find((r) => r.tipo_local === 'SALA_VELORIO');
  const despedida = funeral.reservas.find(
    (r) => r.tipo_local === 'CEMITERIO' || r.tipo_local === 'CREMATORIO',
  );
  const historico = funeral.historico.map((h) => ({
    status: h.para,
    data_hora: h.em,
    observacao: h.observacao,
  }));

  return (
    <>
      <PageHeader
        sobretitulo="Acompanhamento"
        titulo={`Despedida de ${funeral.nome_falecido}`}
        descricao="Sentimos muito pela sua perda. Aqui você acompanha cada etapa, sem precisar ligar."
        acoes={
          <Badge variant={cancelado ? 'neutral' : 'info'}>{STATUS_FUNERAL[funeral.status]}</Badge>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Card className="p-7">
            <h2 className="text-sm font-bold">Etapas do atendimento</h2>
            <div className="mt-5">
              {cancelado ? (
                <p className="text-sm text-muted-foreground">
                  Este atendimento foi cancelado. Em caso de dúvida, fale com a funerária.
                </p>
              ) : (
                <LinhaDoTempo
                  rotulo="Etapas do atendimento"
                  etapas={ETAPAS_FUNERAL}
                  atual={funeral.status}
                  historico={historico}
                />
              )}
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Local
              titulo="Velório"
              reserva={velorio}
              vazio="O local e o horário do velório aparecem aqui assim que forem definidos."
            />
            <Local
              titulo={funeral.destinacao === 'CREMACAO' ? 'Cremação' : 'Sepultamento'}
              reserva={despedida}
              vazio={`Previsto para ${dataHora(funeral.data_hora_prevista)}. O local aparece aqui assim que for definido.`}
            />
          </div>

          <Translado idFuneral={funeral.id_funeral} />
          <Itens idFuneral={funeral.id_funeral} />
        </div>

        <aside className="flex flex-col gap-5 self-start">
          <Contato funeral={funeral} />
          <Documentos idBeneficiario={funeral.id_beneficiario} />
        </aside>
      </div>
    </>
  );
}

function Local({
  titulo,
  reserva,
  vazio,
}: {
  titulo: string;
  reserva: ReservaResponse | undefined;
  vazio: string;
}) {
  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <MapPin className="size-4 text-brand-800" aria-hidden /> {titulo}
      </h2>
      <div className="mt-3">
        {reserva ? (
          <>
            <p className="text-sm font-semibold">{reserva.nome_local}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reserva.nome_local)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Ver no mapa
            </a>
            <p className="mt-3 text-xs">
              De {dataHora(reserva.inicio)} até {dataHora(reserva.fim)}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{vazio}</p>
        )}
      </div>
    </Card>
  );
}

function Translado({ idFuneral }: { idFuneral: string }) {
  const consulta = useTransladosDoFuneral(idFuneral, SILENCIOSO);
  const translado = consulta.data?.find((t) => t.status !== 'CANCELADO');
  // A mudança de status chega pelo SignalR (TRA-06) e a lista é recarregada.
  useTransladoTempoReal(translado?.id_translado, () => void consulta.refetch());

  if (!translado) return null;
  return (
    <Card className="p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold">Translado</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            De {translado.origem.cidade} para {translado.destino.cidade}
          </p>
        </div>
        <IndicadorConexao />
      </div>
      <p className="mt-1 text-[11px] text-subtle-foreground">Esta etapa se atualiza sozinha.</p>
      <div className="mt-5">
        <LinhaDoTempo
          rotulo="Etapas do translado"
          etapas={ETAPAS_TRANSLADO}
          atual={translado.status}
          historico={[]}
        />
      </div>
      {translado.motorista && (
        <p className="mt-4 text-xs text-muted-foreground">
          Motorista: {translado.motorista.nome} · {translado.motorista.modelo},{' '}
          {translado.motorista.placa}
        </p>
      )}
    </Card>
  );
}

function Itens({ idFuneral }: { idFuneral: string }) {
  const consulta = useItensFuneral(idFuneral, SILENCIOSO);
  const itens = [
    ...(consulta.data?.itens_cobertos ?? []).map((i) => ({ ...i, coberto: true })),
    ...(consulta.data?.itens_adicionais ?? []).map((i) => ({ ...i, coberto: false })),
  ];

  if (itens.length === 0) return null;
  return (
    <Card className="p-7">
      <h2 className="text-sm font-bold">O que foi preparado</h2>
      <ul className="mt-4 divide-y divide-border/70">
        {itens.map((item) => (
          <li
            key={item.id_funeral_item}
            className="flex items-center justify-between gap-4 py-3 text-sm"
          >
            <span>
              {item.nome}
              {item.variacao && <span className="text-muted-foreground"> · {item.variacao}</span>}
              {item.quantidade > 1 && (
                <span className="text-muted-foreground"> × {item.quantidade}</span>
              )}
              <span className="block text-xs text-muted-foreground">{item.categoria}</span>
            </span>
            {item.coberto && <Badge variant="success">Coberto pelo plano</Badge>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Contato({ funeral }: { funeral: FuneralResponse }) {
  const funeraria = useIdentidadeVisual({ query: { meta: { silenciarErro: true } } });
  const visual = funeraria.data?.identidade_visual;
  const responsavel = funeral.equipe.find((m) => m.ativo) ?? null;
  const telefone = responsavel?.telefone ?? visual?.telefone ?? null;
  const whatsapp = visual?.whatsapp ?? null;

  return (
    <Card className="p-6">
      <h2 className="text-sm font-bold">Precisa falar com a funerária?</h2>
      {responsavel && (
        <p className="mt-2 text-xs text-muted-foreground">
          Quem está cuidando do atendimento:{' '}
          <span className="font-semibold text-foreground">{responsavel.nome}</span>
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {whatsapp && (
          <Button asChild>
            <a
              href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle /> Conversar pelo WhatsApp
            </a>
          </Button>
        )}
        {telefone && (
          <Button variant="outline" asChild>
            <a href={`tel:${telefone.replace(/\D/g, '')}`}>
              <Phone /> Ligar para {telefone}
            </a>
          </Button>
        )}
        {!whatsapp && !telefone && (
          <p className="text-xs text-muted-foreground">
            {visual?.email ?? 'Os contatos da funerária aparecem aqui.'}
          </p>
        )}
      </div>
    </Card>
  );
}

function Documentos({ idBeneficiario }: { idBeneficiario: string }) {
  const certidao = useObterCertidao(idBeneficiario, SILENCIOSO);
  const documentos = useListarDocumentos(idBeneficiario, SILENCIOSO);
  const emitida = certidao.data?.status === 'EMITIDA';
  const idCertidao = certidao.data?.id_documento_certidao;
  const outros = (documentos.data ?? []).filter((d) => d.id_documento !== idCertidao);

  return (
    <Card className="p-6">
      <h2 className="text-sm font-bold">Documentos</h2>
      <ul className="mt-4 flex flex-col gap-3">
        <ItemDocumento
          nome="Certidão de óbito"
          detalhe={
            certidao.data
              ? `${STATUS_CERTIDAO[certidao.data.status]}${
                  certidao.data.numero_matricula
                    ? ` · Matrícula ${certidao.data.numero_matricula}`
                    : ''
                }`
              : 'A funerária vai solicitar ao cartório.'
          }
          baixar={
            emitida && idCertidao ? (
              <Baixar ids={[idBeneficiario, idCertidao]} nome="Certidão de óbito" />
            ) : null
          }
        />
        {outros.map((doc) => (
          <ItemDocumento
            key={doc.id_documento}
            nome={doc.nome_original}
            baixar={<Baixar ids={[idBeneficiario, doc.id_documento]} nome={doc.nome_original} />}
          />
        ))}
      </ul>
      {!emitida && (
        <p className="mt-4 text-[11px] text-subtle-foreground">
          Avisamos você assim que a certidão for emitida.
        </p>
      )}
    </Card>
  );
}

function ItemDocumento({
  nome,
  detalhe,
  baixar,
}: {
  nome: string;
  detalhe?: string;
  baixar: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <FileText className="mt-0.5 size-4 shrink-0 text-brand-800" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold break-words">{nome}</p>
        {detalhe && <p className="text-xs text-muted-foreground">{detalhe}</p>}
      </div>
      {baixar}
    </li>
  );
}

/** O download usa um link temporário pedido na hora (GET .../documentos/{id}/download). */
function Baixar({
  ids: [idBeneficiario, idDocumento],
  nome,
}: {
  ids: [string, string];
  nome: string;
}) {
  async function abrir() {
    try {
      const { url } = await baixarDocumento(idBeneficiario, idDocumento);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Não foi possível baixar o documento agora. Tente novamente.');
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void abrir()} aria-label={`Baixar ${nome}`}>
      <Download /> Baixar
    </Button>
  );
}
