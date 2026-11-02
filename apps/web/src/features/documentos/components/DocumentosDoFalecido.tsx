import {
  getChecklistCertidaoQueryKey,
  getListarDocumentosQueryKey,
  useAnexarDocumento,
  useListarDocumentos,
  useRemoverDocumento,
  type DocumentoResponse,
  type TipoDocumento,
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
import { toast } from '@ampara/ui/components/sonner';
import { cn } from '@ampara/ui/lib/utils';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { dataHora } from '@/shared/lib/formatar';
import {
  abrirDocumento,
  conferirArquivo,
  tamanhoArquivo,
  TIPO_DOCUMENTO,
  TIPOS_ARQUIVO,
} from './rotulos';

const classeSelect =
  'h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Documentos do falecido: enviar (arrastando ou escolhendo), baixar e remover (FE-ADM-08, CER-01). */
export function DocumentosDoFalecido({ idBeneficiario }: { idBeneficiario: string }) {
  const consulta = useListarDocumentos(idBeneficiario);
  const invalida = {
    mutation: {
      meta: {
        invalida: [
          getListarDocumentosQueryKey(idBeneficiario),
          getChecklistCertidaoQueryKey(idBeneficiario),
        ],
      },
    },
  };
  const anexar = useAnexarDocumento(invalida);
  const remover = useRemoverDocumento(invalida);
  const [tipo, setTipo] = useState<TipoDocumento>('DECLARACAO_OBITO');
  const [arrastando, setArrastando] = useState(false);
  const [removendo, setRemovendo] = useState<DocumentoResponse | null>(null);

  const enviar = (arquivo: File | undefined) => {
    if (!arquivo) return;
    const erro = conferirArquivo(arquivo);
    if (erro) return toast.error(erro);
    anexar.mutate(
      { id: idBeneficiario, data: { arquivo, tipo } },
      { onSuccess: () => toast.success(`${TIPO_DOCUMENTO[tipo]} anexado.`) },
    );
  };

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    enviar(e.dataTransfer.files[0]);
  };

  return (
    <Card className="flex flex-col gap-5 p-6">
      <h2 className="text-lg font-bold">Documentos do falecido</h2>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Tipo do documento
          <select
            className={classeSelect}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoDocumento)}
          >
            {Object.entries(TIPO_DOCUMENTO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={soltar}
        className={cn(
          'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          arrastando ? 'border-primary bg-primary/5' : 'border-border',
        )}
      >
        <Upload className="size-5 text-muted-foreground" aria-hidden />
        <p className="text-sm">{anexar.isPending ? 'Enviando...' : 'Arraste o arquivo aqui ou'}</p>
        <Button type="button" variant="outline" size="sm" asChild disabled={anexar.isPending}>
          <label className="cursor-pointer">
            Escolher arquivo
            <input
              type="file"
              accept={TIPOS_ARQUIVO.join(',')}
              aria-label="Arquivo do documento"
              className="sr-only"
              onChange={(e) => {
                enviar(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
        </Button>
        <p className="text-[11px] text-subtle-foreground">PDF, JPEG ou PNG, até 10 MB.</p>
      </div>

      <EstadoConsulta
        consulta={consulta}
        estaVazio={(ds) => ds.length === 0}
        vazio={<Vazio titulo="Nenhum documento ainda" />}
      >
        {(documentos) => (
          <ul className="flex flex-col divide-y divide-border/60">
            {documentos.map((d) => (
              <li key={d.id_documento} className="flex flex-wrap items-center gap-3 py-3">
                <FileText className="size-4 text-muted-foreground" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold">{TIPO_DOCUMENTO[d.tipo]}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {d.nome_original} · {tamanhoArquivo(d.tamanho)} · {dataHora(d.enviado_em)}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void abrirDocumento(idBeneficiario, d.id_documento)}
                >
                  <Download /> Baixar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remover ${d.nome_original}`}
                  onClick={() => setRemovendo(d)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </EstadoConsulta>

      {removendo && (
        <Dialog open onOpenChange={(aberto) => !aberto && setRemovendo(null)}>
          <DialogContent className="max-w-md">
            <DialogTitle>Remover o documento?</DialogTitle>
            <DialogDescription>
              {TIPO_DOCUMENTO[removendo.tipo]} ({removendo.nome_original}). O arquivo é apagado e
              não pode ser recuperado.
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemovendo(null)}>
                Manter
              </Button>
              <Button
                disabled={remover.isPending}
                onClick={() =>
                  remover.mutate(
                    { id: idBeneficiario, idDocumento: removendo.id_documento },
                    {
                      onSuccess: () => {
                        toast.success('Documento removido.');
                        setRemovendo(null);
                      },
                    },
                  )
                }
              >
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
