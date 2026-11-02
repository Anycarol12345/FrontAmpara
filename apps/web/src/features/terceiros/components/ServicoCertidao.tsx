import {
  baixarDocumentoCertidaoTerceiro,
  getMinhasAtribuicoesQueryKey,
  useAlterarStatusCertidaoTerceiro,
  useRegistrarCertidaoEmitidaTerceiro,
  type AtribuicaoResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { Download } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Abas, PainelDaAba } from '@/shared/components/Abas';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { data } from '@/shared/lib/formatar';
import { resumoDe, type ResumoCertidao } from './atribuicoes';

const TIPOS_ARQUIVO = ['application/pdf', 'image/jpeg', 'image/png'];
const ABAS = [
  { id: 'cartorio', titulo: 'No cartório' },
  { id: 'pendencia', titulo: 'Pendência' },
  { id: 'emitida', titulo: 'Certidão emitida' },
] as const;

async function abrir(idCertidao: string, idDocumento: string) {
  try {
    const { url } = await baixarDocumentoCertidaoTerceiro(idCertidao, idDocumento);
    window.open(url, '_blank', 'noopener');
  } catch {
    toast.error('Não foi possível abrir o documento.');
  }
}

/** Certidão para o despachante ou cartório: dados do óbito, documentos e as etapas do registro (FE-TER-01, CER-04). */
export function ServicoCertidao({ atribuicao }: { atribuicao: AtribuicaoResponse }) {
  const r = resumoDe<ResumoCertidao>(atribuicao);
  const id = atribuicao.id_origem;
  const [aba, setAba] = useState<string>('cartorio');

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-3 p-5">
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Data do óbito</dt>
            <dd className="font-semibold">{data(r.data_obito)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Local</dt>
            <dd className="text-right font-semibold">{r.local_obito ?? '—'}</dd>
          </div>
        </dl>
        {(r.documentos ?? []).length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold">Documentos para o registro</p>
            {r.documentos!.map((d) => (
              <Button
                key={d.id_documento}
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => void abrir(id, d.id_documento)}
              >
                <Download /> {d.nome}
              </Button>
            ))}
          </div>
        )}
      </Card>
      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold">Registrar andamento</h2>
        <Abas abas={ABAS} ativa={aba} aoMudar={setAba} rotulo="Etapas da certidão" />
        <PainelDaAba id={aba}>
          {aba === 'cartorio' && <Etapa id={id} status="EM_PROCESSAMENTO" />}
          {aba === 'pendencia' && <Etapa id={id} status="REJEITADA" />}
          {aba === 'emitida' && <Emitida id={id} />}
        </PainelDaAba>
      </Card>
    </div>
  );
}

function Etapa({ id, status }: { id: string; status: 'EM_PROCESSAMENTO' | 'REJEITADA' }) {
  const alterar = useAlterarStatusCertidaoTerceiro();
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string>();
  const cartorio = status === 'EM_PROCESSAMENTO';

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return setErro(cartorio ? 'Informe o protocolo.' : 'Descreva a pendência.');
    setErro(undefined);
    alterar.mutate(
      {
        id,
        data: {
          status,
          protocolo: cartorio ? texto.trim() : null,
          observacao: cartorio ? null : texto.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Andamento registrado. A funerária foi avisada.');
          setTexto('');
        },
      },
    );
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <ErroFormulario mensagem={erro} />
      <Campo
        id={`certidao-${status}`}
        label={cartorio ? 'Protocolo do cartório' : 'O que o cartório pediu'}
      >
        <Input value={texto} onChange={(e) => setTexto(e.target.value)} />
      </Campo>
      <Button type="submit" disabled={alterar.isPending}>
        {cartorio ? 'Registrar protocolo' : 'Registrar pendência'}
      </Button>
    </form>
  );
}

function Emitida({ id }: { id: string }) {
  const registrar = useRegistrarCertidaoEmitidaTerceiro({
    mutation: { meta: { invalida: [getMinhasAtribuicoesQueryKey()] } },
  });
  const [matricula, setMatricula] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string>();

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!matricula.trim()) return setErro('Informe o número da matrícula.');
    if (!arquivo || !TIPOS_ARQUIVO.includes(arquivo.type))
      return setErro('Anexe a certidão em PDF, JPEG ou PNG.');
    setErro(undefined);
    registrar.mutate(
      { id, data: { arquivo, numero_matricula: matricula.trim() } },
      { onSuccess: () => toast.success('Certidão enviada. A família foi avisada.') },
    );
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <ErroFormulario mensagem={erro} />
      <Campo id="certidao-matricula" label="Número da matrícula">
        <Input value={matricula} onChange={(e) => setMatricula(e.target.value)} />
      </Campo>
      <Campo id="certidao-arquivo" label="Arquivo da certidão">
        <Input
          type="file"
          accept={TIPOS_ARQUIVO.join(',')}
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
        />
      </Campo>
      <Button type="submit" disabled={registrar.isPending}>
        {registrar.isPending ? 'Enviando...' : 'Enviar certidão'}
      </Button>
    </form>
  );
}
