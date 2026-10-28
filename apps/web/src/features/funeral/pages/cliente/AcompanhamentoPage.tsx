import { useIdentidadeVisual } from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { ArrowLeft, Download, FileText, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { IndicadorConexao } from '@/shared/tempo-real/IndicadorConexao';
import { dataHora, dataLonga } from '@/shared/lib/formatar';
import { LinhaDoTempo } from '../../components/LinhaDoTempo';
import {
  ETAPAS_FUNERAL,
  ETAPAS_TRANSLADO,
  STATUS_CERTIDAO,
  STATUS_FUNERAL,
} from '../../components/rotulos';
import { useFuneral, type FuneralResponse } from '../../hooks/funerais';

/**
 * Acompanhamento do funeral e do translado pela família (FE-CLI-08, GET /funerais/{id}).
 * Os textos seguem o cuidado do FDEC-03: a família está em luto.
 */
export function AcompanhamentoPage() {
  const { id = '' } = useParams();
  const consulta = useFuneral(id);

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
                  historico={funeral.historico}
                />
              )}
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Local
              titulo="Velório"
              vazio="O local e o horário do velório aparecem aqui assim que forem definidos."
            >
              {funeral.velorio && (
                <>
                  <p className="text-sm font-semibold">{funeral.velorio.local}</p>
                  {funeral.velorio.sala && (
                    <p className="text-xs text-muted-foreground">{funeral.velorio.sala}</p>
                  )}
                  <EnderecoMapa endereco={funeral.velorio.endereco} />
                  <p className="mt-3 text-xs">
                    De {dataHora(funeral.velorio.inicio)} até {dataHora(funeral.velorio.fim)}
                  </p>
                </>
              )}
            </Local>
            <Local
              titulo={funeral.despedida?.tipo === 'CREMACAO' ? 'Cremação' : 'Sepultamento'}
              vazio="O local e o horário aparecem aqui assim que forem definidos."
            >
              {funeral.despedida && (
                <>
                  <p className="text-sm font-semibold">{funeral.despedida.local}</p>
                  <EnderecoMapa endereco={funeral.despedida.endereco} />
                  <p className="mt-3 text-xs">{dataHora(funeral.despedida.data_hora)}</p>
                </>
              )}
            </Local>
          </div>

          {funeral.translado && funeral.translado.status !== 'CANCELADO' && (
            <Card className="p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">Translado</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    De {funeral.translado.origem} para {funeral.translado.destino}
                  </p>
                </div>
                <IndicadorConexao />
              </div>
              <p className="mt-1 text-[11px] text-subtle-foreground">
                Esta etapa se atualiza sozinha.
              </p>
              <div className="mt-5">
                <LinhaDoTempo
                  rotulo="Etapas do translado"
                  etapas={ETAPAS_TRANSLADO}
                  atual={funeral.translado.status}
                  historico={funeral.translado.historico}
                />
              </div>
            </Card>
          )}

          {funeral.itens.length > 0 && (
            <Card className="p-7">
              <h2 className="text-sm font-bold">O que foi preparado</h2>
              <ul className="mt-4 divide-y divide-border/70">
                {funeral.itens.map((item) => (
                  <li
                    key={`${item.categoria}-${item.nome}`}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span>
                      {item.nome}
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
          )}
        </div>

        <aside className="flex flex-col gap-5 self-start">
          <Contato funeral={funeral} />
          <Documentos funeral={funeral} />
        </aside>
      </div>
    </>
  );
}

function Local({
  titulo,
  vazio,
  children,
}: {
  titulo: string;
  vazio: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <MapPin className="size-4 text-brand-800" aria-hidden /> {titulo}
      </h2>
      <div className="mt-3">
        {children || <p className="text-xs text-muted-foreground">{vazio}</p>}
      </div>
    </Card>
  );
}

function EnderecoMapa({ endereco }: { endereco: string }) {
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`}
      target="_blank"
      rel="noreferrer"
      className="mt-1 block text-xs text-muted-foreground underline-offset-2 hover:underline"
    >
      {endereco}
    </a>
  );
}

function Contato({ funeral }: { funeral: FuneralResponse }) {
  const funeraria = useIdentidadeVisual({ query: { meta: { silenciarErro: true } } });
  const visual = funeraria.data?.identidade_visual;
  const telefone = funeral.responsavel?.telefone ?? visual?.telefone ?? null;
  const whatsapp = visual?.whatsapp ?? null;

  return (
    <Card className="p-6">
      <h2 className="text-sm font-bold">Precisa falar com a funerária?</h2>
      {funeral.responsavel && (
        <p className="mt-2 text-xs text-muted-foreground">
          Quem está cuidando do atendimento:{' '}
          <span className="font-semibold text-foreground">{funeral.responsavel.nome}</span>
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

function Documentos({ funeral }: { funeral: FuneralResponse }) {
  const { certidao, documentos } = funeral;

  return (
    <Card className="p-6">
      <h2 className="text-sm font-bold">Documentos</h2>
      <ul className="mt-4 flex flex-col gap-3">
        <li className="flex items-start gap-3">
          <FileText className="mt-0.5 size-4 shrink-0 text-brand-800" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-semibold">Certidão de óbito</p>
            <p className="text-xs text-muted-foreground">
              {certidao
                ? STATUS_CERTIDAO[certidao.status]
                : 'A funerária vai solicitar ao cartório.'}
              {certidao?.numero_matricula && ` · Matrícula ${certidao.numero_matricula}`}
            </p>
          </div>
          {certidao?.status === 'EMITIDA' && certidao.url && (
            <Baixar url={certidao.url} nome="Certidão de óbito" />
          )}
        </li>
        {documentos.map((doc) => (
          <li key={doc.id_documento} className="flex items-start gap-3">
            <FileText className="mt-0.5 size-4 shrink-0 text-brand-800" aria-hidden />
            <p className="flex-1 text-sm font-semibold">{doc.nome}</p>
            <Baixar url={doc.url} nome={doc.nome} />
          </li>
        ))}
      </ul>
      {certidao?.status !== 'EMITIDA' && (
        <p className="mt-4 text-[11px] text-subtle-foreground">
          Avisamos você assim que a certidão for emitida.
        </p>
      )}
      <p className="mt-2 text-[11px] text-subtle-foreground">
        Falecimento em {dataLonga(funeral.data_falecimento)}.
      </p>
    </Card>
  );
}

function Baixar({ url, nome }: { url: string; nome: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={url} download target="_blank" rel="noreferrer" aria-label={`Baixar ${nome}`}>
        <Download /> Baixar
      </a>
    </Button>
  );
}
