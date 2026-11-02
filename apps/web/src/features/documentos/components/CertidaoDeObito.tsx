import {
  ehApiError,
  getListarDocumentosQueryKey,
  getObterCertidaoQueryKey,
  useAlterarStatusCertidao,
  useAtribuirResponsavelCertidao,
  useChecklistCertidao,
  useListarEquipe,
  useListarTerceiros,
  useObterCertidao,
  useRegistrarCertidaoEmitida,
  useSolicitarCertidao,
  type CertidaoResponse,
  type PrazoRegistroResponse,
  type StatusCertidao,
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
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { cn } from '@ampara/ui/lib/utils';
import { Check, CircleAlert, Clock, Download } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { Carregando, Erro } from '@/shared/components/EstadoConsulta';
import { data, dataHora } from '@/shared/lib/formatar';
import { abrirDocumento, conferirArquivo, STATUS_CERTIDAO, TIPOS_ARQUIVO } from './rotulos';

const SILENCIOSO = { query: { meta: { silenciarErro: true }, retry: false } };
const classeSelect =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Certidão de óbito: o que falta para pedir e, depois do pedido, o andamento (FE-ADM-08, CER-01 a CER-04). */
export function CertidaoDeObito({ idBeneficiario }: { idBeneficiario: string }) {
  const certidao = useObterCertidao(idBeneficiario, SILENCIOSO);
  const naoPedida = ehApiError(certidao.error) && certidao.error.status === 404;

  return (
    <Card className="flex flex-col gap-5 p-6">
      <h2 className="text-lg font-bold">Certidão de óbito</h2>
      {certidao.isPending ? (
        <Carregando />
      ) : naoPedida ? (
        <Checklist idBeneficiario={idBeneficiario} />
      ) : certidao.data ? (
        <Andamento certidao={certidao.data} />
      ) : (
        <Erro
          mensagem={certidao.error?.message ?? 'Tente novamente.'}
          aoTentarNovamente={() => void certidao.refetch()}
        />
      )}
    </Card>
  );
}

function Prazo({ prazo, emitida }: { prazo: PrazoRegistroResponse; emitida?: boolean }) {
  if (emitida) return null;
  return (
    <p
      role={prazo.vencido ? 'alert' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
        prazo.vencido ? 'bg-destructive/10 text-destructive' : 'bg-warning text-warning-foreground',
      )}
    >
      <Clock className="size-3.5 shrink-0" aria-hidden />
      {prazo.vencido
        ? `O prazo legal para registrar o óbito venceu em ${data(prazo.data)}. Resolva com urgência.`
        : `Registrar o óbito até ${data(prazo.data)} (${prazo.dias_restantes} ${prazo.dias_restantes === 1 ? 'dia' : 'dias'}).`}
    </p>
  );
}

function Checklist({ idBeneficiario }: { idBeneficiario: string }) {
  const checklist = useChecklistCertidao(idBeneficiario);
  const solicitar = useSolicitarCertidao({
    mutation: { meta: { invalida: [getObterCertidaoQueryKey(idBeneficiario)] } },
  });
  if (checklist.isPending) return <Carregando />;
  if (!checklist.data) return <Erro mensagem={checklist.error?.message ?? 'Tente novamente.'} />;
  const { dados, documentos, prazo, pronto_para_solicitar } = checklist.data;

  return (
    <div className="flex flex-col gap-4">
      <Prazo prazo={prazo} />
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {(
          [
            ['Falecido(a)', dados.nome_falecido],
            ['Nascimento', data(dados.data_nascimento)],
            ['Falecimento', dataHora(dados.data_falecimento)],
            ['Local', dados.local_falecimento],
            ['Declarante', dados.nome_declarante],
            ['Telefone do declarante', dados.telefone_declarante],
          ] as const
        ).map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{rotulo}</dt>
            <dd className="text-right font-semibold">{valor || '—'}</dd>
          </div>
        ))}
      </dl>
      <div>
        <p className="mb-2 text-xs font-semibold">Documentos para o registro</p>
        <ul className="flex flex-col gap-1 text-sm">
          {documentos.map((d) => (
            <li key={d.tipo} className="flex items-center gap-2">
              {d.presente ? (
                <Check className="size-4 text-primary" aria-label="Anexado" />
              ) : (
                <CircleAlert className="size-4 text-warning-foreground" aria-label="Falta" />
              )}
              {d.descricao}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {!pronto_para_solicitar && (
          <span className="text-xs text-muted-foreground">
            Anexe os documentos que faltam para pedir a certidão.
          </span>
        )}
        <Button
          disabled={!pronto_para_solicitar || solicitar.isPending}
          onClick={() =>
            solicitar.mutate(
              { id: idBeneficiario },
              { onSuccess: () => toast.success('Pedido da certidão registrado.') },
            )
          }
        >
          Pedir a certidão
        </Button>
      </div>
    </div>
  );
}

function Andamento({ certidao: c }: { certidao: CertidaoResponse }) {
  const situacao = STATUS_CERTIDAO[c.status];
  const [etapa, setEtapa] = useState<StatusCertidao | null>(null);
  const emitida = c.status === 'EMITIDA';
  const mudancas = [...c.historico].sort((a, b) => b.em.localeCompare(a.em));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={situacao.variante}>{situacao.rotulo}</Badge>
        {c.protocolo && <span className="text-xs">Protocolo {c.protocolo}</span>}
        {c.numero_matricula && <span className="text-xs">Matrícula {c.numero_matricula}</span>}
        {c.modo === 'SIMULADO' && <Badge variant="neutral">Simulado</Badge>}
      </div>
      <Prazo prazo={c.prazo} emitida={emitida} />
      {c.pendencia && (c.status === 'REJEITADA' || c.status === 'ERRO') && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Pendência: {c.pendencia}
        </p>
      )}

      {!emitida && <Responsavel certidao={c} />}

      {emitida && c.id_documento_certidao && (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => void abrirDocumento(c.id_beneficiario, c.id_documento_certidao!)}
        >
          <Download /> Baixar a certidão
        </Button>
      )}

      {!emitida && (
        <div className="flex flex-wrap gap-2">
          {(c.status === 'SOLICITADA' || c.status === 'EM_PROCESSAMENTO') && (
            <Button variant="outline" size="sm" onClick={() => setEtapa('EM_PROCESSAMENTO')}>
              {c.status === 'SOLICITADA' ? 'Entregue no cartório' : 'Atualizar protocolo'}
            </Button>
          )}
          {(c.status === 'REJEITADA' || c.status === 'ERRO') && (
            <Button variant="outline" size="sm" onClick={() => setEtapa('SOLICITADA')}>
              Reenviar pedido
            </Button>
          )}
          {c.status !== 'REJEITADA' && c.status !== 'ERRO' && (
            <Button variant="outline" size="sm" onClick={() => setEtapa('REJEITADA')}>
              Registrar pendência
            </Button>
          )}
          <Button size="sm" onClick={() => setEtapa('EMITIDA')}>
            Registrar certidão emitida
          </Button>
        </div>
      )}

      {mudancas.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold">Histórico</p>
          <ol className="flex flex-col">
            {mudancas.map((m) => (
              <li
                key={`${m.em}-${m.para}`}
                className="flex flex-col gap-0.5 border-l-2 border-border/60 pb-3 pl-4 last:pb-0"
              >
                <span className="text-sm font-semibold">{STATUS_CERTIDAO[m.para].rotulo}</span>
                <span className="text-xs text-muted-foreground">{dataHora(m.em)}</span>
                {m.observacao && <span className="text-xs">{m.observacao}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {etapa === 'EMITIDA' && <EmitidaDialog certidao={c} aoFechar={() => setEtapa(null)} />}
      {etapa && etapa !== 'EMITIDA' && (
        <EtapaDialog certidao={c} para={etapa} aoFechar={() => setEtapa(null)} />
      )}
    </div>
  );
}

/** Quem cuida da certidão: um funcionário ou um despachante/cartório parceiro. */
function Responsavel({ certidao: c }: { certidao: CertidaoResponse }) {
  const equipe = useListarEquipe({ status: 'ATIVO', tamanho: 100 }, SILENCIOSO);
  const parceiros = useListarTerceiros(
    { tipo: 'CARTORIO_DESPACHANTE', status: 'ATIVO', tamanho: 100 },
    SILENCIOSO,
  );
  const atribuir = useAtribuirResponsavelCertidao({
    mutation: { meta: { invalida: [getObterCertidaoQueryKey(c.id_beneficiario)] } },
  });
  const listado =
    equipe.data?.itens.some((m) => m.id_usuario === c.responsavel?.id_usuario) ||
    parceiros.data?.itens.some((p) => p.id_terceiro === c.responsavel?.id_terceiro);
  const atual = c.responsavel
    ? c.responsavel.tipo === 'TERCEIRO'
      ? `TERCEIRO:${c.responsavel.id_terceiro}`
      : `FUNCIONARIO:${c.responsavel.id_usuario}`
    : '';

  return (
    <Campo
      id="certidao-responsavel"
      label="Responsável pelo registro"
      dica={c.responsavel ? undefined : 'Ninguém cuida desta certidão ainda.'}
    >
      <select
        className={classeSelect}
        value={atual}
        disabled={atribuir.isPending}
        onChange={(e) => {
          const [tipo, id] = e.target.value.split(':');
          if (!tipo || !id) return;
          atribuir.mutate(
            {
              id: c.id_beneficiario,
              data: {
                tipo,
                id_usuario: tipo === 'FUNCIONARIO' ? id : null,
                id_terceiro: tipo === 'TERCEIRO' ? id : null,
              },
            },
            { onSuccess: () => toast.success('Responsável definido.') },
          );
        }}
      >
        <option value="">Escolha</option>
        {equipe.data && (
          <optgroup label="Equipe">
            {equipe.data.itens
              .filter((m) => m.perfil !== 'CONSULTOR')
              .map((m) => (
                <option key={m.id_usuario} value={`FUNCIONARIO:${m.id_usuario}`}>
                  {m.nome}
                </option>
              ))}
          </optgroup>
        )}
        {parceiros.data && (
          <optgroup label="Despachantes e cartórios">
            {parceiros.data.itens.map((t) => (
              <option key={t.id_terceiro} value={`TERCEIRO:${t.id_terceiro}`}>
                {t.nome_razao_social}
              </option>
            ))}
          </optgroup>
        )}
        {/* O responsável atual aparece mesmo quando a lista dele não carregou. */}
        {c.responsavel && !listado && <option value={atual}>{c.responsavel.nome}</option>}
      </select>
    </Campo>
  );
}

const TEXTO_ETAPA: Partial<Record<StatusCertidao, { titulo: string; descricao: string }>> = {
  EM_PROCESSAMENTO: {
    titulo: 'Pedido entregue no cartório',
    descricao: 'Informe o protocolo para a família acompanhar.',
  },
  REJEITADA: {
    titulo: 'Registrar pendência',
    descricao: 'Descreva o que o cartório pediu. A equipe resolve e reenvia o pedido.',
  },
  SOLICITADA: {
    titulo: 'Reenviar o pedido',
    descricao: 'Use depois de resolver a pendência apontada pelo cartório.',
  },
};

function EtapaDialog({
  certidao: c,
  para,
  aoFechar,
}: {
  certidao: CertidaoResponse;
  para: StatusCertidao;
  aoFechar: () => void;
}) {
  const alterar = useAlterarStatusCertidao({
    mutation: { meta: { invalida: [getObterCertidaoQueryKey(c.id_beneficiario)] } },
  });
  const [protocolo, setProtocolo] = useState(c.protocolo ?? '');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string>();
  const texto = TEXTO_ETAPA[para]!;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (para === 'EM_PROCESSAMENTO' && !protocolo.trim()) return setErro('Informe o protocolo.');
    if (para === 'REJEITADA' && !observacao.trim()) return setErro('Descreva a pendência.');
    alterar.mutate(
      {
        id: c.id_beneficiario,
        data: {
          status: para,
          protocolo: para === 'EM_PROCESSAMENTO' ? protocolo.trim() : null,
          observacao: observacao.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Certidão atualizada.');
          aoFechar();
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-md">
        <DialogTitle>{texto.titulo}</DialogTitle>
        <DialogDescription>{texto.descricao}</DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-4 flex flex-col gap-4">
          <ErroFormulario mensagem={erro} />
          {para === 'EM_PROCESSAMENTO' && (
            <Campo id="certidao-protocolo" label="Protocolo">
              <Input value={protocolo} onChange={(e) => setProtocolo(e.target.value)} />
            </Campo>
          )}
          <Campo
            id="certidao-observacao"
            label={para === 'REJEITADA' ? 'Pendência' : 'Observação (opcional)'}
          >
            <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </Campo>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={alterar.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmitidaDialog({
  certidao: c,
  aoFechar,
}: {
  certidao: CertidaoResponse;
  aoFechar: () => void;
}) {
  const registrar = useRegistrarCertidaoEmitida({
    mutation: {
      meta: {
        invalida: [
          getObterCertidaoQueryKey(c.id_beneficiario),
          getListarDocumentosQueryKey(c.id_beneficiario),
        ],
      },
    },
  });
  const [matricula, setMatricula] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string>();

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!matricula.trim()) return setErro('Informe o número da matrícula.');
    if (!arquivo) return setErro('Anexe o arquivo da certidão.');
    const problema = conferirArquivo(arquivo);
    if (problema) return setErro(problema);
    registrar.mutate(
      { id: c.id_beneficiario, data: { arquivo, numero_matricula: matricula.trim() } },
      {
        onSuccess: () => {
          toast.success('Certidão registrada. A família foi avisada.');
          aoFechar();
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Registrar certidão emitida</DialogTitle>
        <DialogDescription>
          O titular do contrato recebe um aviso e pode baixar a certidão na área do cliente.
        </DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-4 flex flex-col gap-4">
          <ErroFormulario mensagem={erro} />
          <Campo id="certidao-matricula" label="Número da matrícula">
            <Input value={matricula} onChange={(e) => setMatricula(e.target.value)} />
          </Campo>
          <Campo
            id="certidao-arquivo"
            label="Arquivo da certidão"
            dica="PDF, JPEG ou PNG, até 10 MB."
          >
            <Input
              type="file"
              accept={TIPOS_ARQUIVO.join(',')}
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
          </Campo>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registrar.isPending}>
              {registrar.isPending ? 'Enviando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
