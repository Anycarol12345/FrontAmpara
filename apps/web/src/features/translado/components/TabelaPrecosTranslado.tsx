import {
  getTabelaPrecosTransladoQueryKey,
  useDefinirDocumentosExigidosTranslado,
  useDefinirTabelaPrecosTranslado,
  useTabelaPrecosTranslado,
  type ConfiguracaoTransladoResponse,
  type FaixaKm,
  type TipoTranslado,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ErroFormulario } from '@/shared/components/Campo';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { numero } from '@/shared/lib/formatar';
import { TIPO_TRANSLADO, validarFaixas, type Linha } from './faixas';

const paraLinha = (f: FaixaKm): Linha => ({
  de_km: String(numero(f.de_km)),
  ate_km: f.ate_km == null ? '' : String(numero(f.ate_km)),
  valor: String(numero(f.valor)),
  valor_km_excedente: f.valor_km_excedente == null ? '' : String(numero(f.valor_km_excedente)),
});

/** Tabela de preços por faixa de km e documentos exigidos por tipo de translado (FE-ADM-12, TRA-03). */
export function TabelaPrecosTranslado() {
  const consulta = useTabelaPrecosTranslado();
  return (
    <EstadoConsulta consulta={consulta}>
      {(config) => (
        <div className="flex flex-col gap-6">
          <Faixas config={config} />
          <DocumentosExigidos config={config} />
        </div>
      )}
    </EstadoConsulta>
  );
}

const invalida = { mutation: { meta: { invalida: [getTabelaPrecosTransladoQueryKey()] } } };

function Faixas({ config }: { config: ConfiguracaoTransladoResponse }) {
  // O erro da API (ex.: faixas sobrepostas) aparece no próprio cartão, sem toast.
  const definir = useDefinirTabelaPrecosTranslado({
    mutation: { meta: { invalida: [getTabelaPrecosTransladoQueryKey()], silenciarErro: true } },
  });
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    config.faixas.length
      ? config.faixas.map(paraLinha)
      : [{ de_km: '0', ate_km: '', valor: '', valor_km_excedente: '' }],
  );
  const [erro, setErro] = useState<string>();

  const mudar = (i: number, campo: keyof Linha, valor: string) =>
    setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));

  const salvar = () => {
    const resultado = validarFaixas(linhas);
    if ('erro' in resultado) {
      setErro(resultado.erro);
      return;
    }
    setErro(undefined);
    definir.mutate(
      { data: { faixas: resultado.faixas } },
      {
        onSuccess: () => toast.success('Tabela de km salva. Vale para os próximos translados.'),
        onError: (e) => setErro(e.message),
      },
    );
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-sm font-semibold">Preço por distância</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Cada faixa começa onde a anterior termina. Deixe o km final da última em branco para
          cobrar por km excedente a partir dela. Os km incluídos no plano são descontados antes.
        </p>
      </div>
      <ErroFormulario mensagem={erro} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="pb-2 font-medium">De (km)</th>
              <th className="pb-2 font-medium">Até (km)</th>
              <th className="pb-2 font-medium">Valor (R$)</th>
              <th className="pb-2 font-medium">Km excedente (R$)</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i}>
                {(['de_km', 'ate_km', 'valor', 'valor_km_excedente'] as const).map((campo) => (
                  <td key={campo} className="py-1 pr-2">
                    <Input
                      type="number"
                      min="0"
                      step={campo === 'de_km' || campo === 'ate_km' ? '1' : '0.01'}
                      aria-label={`Faixa ${i + 1}: ${ROTULO_CAMPO[campo]}`}
                      placeholder={campo === 'ate_km' ? 'sem limite' : undefined}
                      value={l[campo]}
                      onChange={(e) => mudar(i, campo, e.target.value)}
                    />
                  </td>
                ))}
                <td className="py-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remover faixa ${i + 1}`}
                    disabled={linhas.length === 1}
                    onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setLinhas((ls) => [
              ...ls,
              { de_km: ls.at(-1)?.ate_km ?? '', ate_km: '', valor: '', valor_km_excedente: '' },
            ])
          }
        >
          <Plus /> Adicionar faixa
        </Button>
        <Button type="button" onClick={salvar} disabled={definir.isPending}>
          {definir.isPending ? 'Salvando...' : 'Salvar tabela de km'}
        </Button>
      </div>
    </Card>
  );
}

const ROTULO_CAMPO: Record<keyof Linha, string> = {
  de_km: 'km inicial',
  ate_km: 'km final',
  valor: 'valor',
  valor_km_excedente: 'valor por km excedente',
};

function DocumentosExigidos({ config }: { config: ConfiguracaoTransladoResponse }) {
  const definir = useDefinirDocumentosExigidosTranslado(invalida);
  const [textos, setTextos] = useState<Record<TipoTranslado, string>>(() => ({
    MUNICIPAL: (config.documentos_exigidos.MUNICIPAL ?? []).join('\n'),
    INTERMUNICIPAL: (config.documentos_exigidos.INTERMUNICIPAL ?? []).join('\n'),
    INTERESTADUAL: (config.documentos_exigidos.INTERESTADUAL ?? []).join('\n'),
  }));

  const salvar = () => {
    const documentos = Object.fromEntries(
      Object.entries(textos).map(([tipo, texto]) => [
        tipo,
        texto
          .split('\n')
          .map((d) => d.trim())
          .filter(Boolean),
      ]),
    );
    definir.mutate(
      { data: { documentos } },
      { onSuccess: () => toast.success('Documentos exigidos salvos.') },
    );
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-sm font-semibold">Documentos exigidos por tipo</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Um documento por linha. O translado mostra o que ainda falta anexar.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(TIPO_TRANSLADO) as TipoTranslado[]).map((tipo) => (
          <label key={tipo} className="flex flex-col gap-2 text-sm font-medium">
            {TIPO_TRANSLADO[tipo]}
            <textarea
              rows={5}
              value={textos[tipo]}
              onChange={(e) => setTextos((t) => ({ ...t, [tipo]: e.target.value }))}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={salvar} disabled={definir.isPending}>
          {definir.isPending ? 'Salvando...' : 'Salvar documentos'}
        </Button>
      </div>
    </Card>
  );
}
