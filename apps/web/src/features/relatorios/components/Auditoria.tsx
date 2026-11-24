import { useAuditoriaFuneraria, type RegistroAuditoriaResponse } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { useDeferredValue, useState } from 'react';
import { Campo } from '@/shared/components/Campo';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { Paginacao } from '@/shared/components/Tabela';
import { dataHora } from '@/shared/lib/formatar';

const TAMANHO = 20;

/** CONTRATO_CRIADO → "Contrato criado". */
const legivel = (codigo: string) => {
  const texto = codigo.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/** Campos que mudaram entre os valores anteriores e os novos. */
function mudancas(r: RegistroAuditoriaResponse) {
  const antes = (r.valores_anteriores ?? {}) as Record<string, unknown>;
  const depois = (r.valores_novos ?? {}) as Record<string, unknown>;
  const campos = [...new Set([...Object.keys(antes), ...Object.keys(depois)])];
  const texto = (v: unknown) =>
    v === undefined || v === null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return campos
    .filter((c) => texto(antes[c]) !== texto(depois[c]))
    .map((c) => ({ campo: c, antes: texto(antes[c]), depois: texto(depois[c]) }));
}

/** Quem fez o quê na funerária, do mais recente para o mais antigo (FE-ADM-13, REL-03). */
export function Auditoria() {
  const [acao, setAcao] = useState('');
  const [entidade, setEntidade] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [pagina, setPagina] = useState(1);
  const filtros = useDeferredValue({ acao, entidade, de, ate });
  const consulta = useAuditoriaFuneraria({
    acao: filtros.acao.trim().toUpperCase().replace(/\s+/g, '_') || undefined,
    entidade: filtros.entidade.trim() || undefined,
    de: filtros.de || undefined,
    ate: filtros.ate || undefined,
    pagina,
    tamanho: TAMANHO,
  });
  const [aberto, setAberto] = useState<string | null>(null);

  const filtrar = (mudar: (v: string) => void) => (e: { target: { value: string } }) => {
    mudar(e.target.value);
    setPagina(1);
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="grid gap-4 p-5 sm:grid-cols-4">
        <Campo id="aud-acao" label="Ação" dica="Ex.: CONTRATO_CRIADO">
          <Input value={acao} onChange={filtrar(setAcao)} />
        </Campo>
        <Campo id="aud-entidade" label="Registro" dica="Ex.: Contrato, Fatura">
          <Input value={entidade} onChange={filtrar(setEntidade)} />
        </Campo>
        <Campo id="aud-de" label="De">
          <Input type="date" value={de} onChange={filtrar(setDe)} />
        </Campo>
        <Campo id="aud-ate" label="Até">
          <Input type="date" value={ate} onChange={filtrar(setAte)} />
        </Campo>
      </Card>
      <Card className="overflow-hidden">
        <EstadoConsulta
          consulta={consulta}
          estaVazio={(p) => p.itens.length === 0}
          vazio={<Vazio titulo="Nenhuma ação encontrada" descricao="Ajuste os filtros." />}
        >
          {(p) => (
            <>
              <ul className="flex flex-col divide-y divide-border/60">
                {p.itens.map((r) => {
                  const lista = mudancas(r);
                  const expandido = aberto === r.id_auditoria;
                  return (
                    <li key={r.id_auditoria} className="flex flex-col gap-2 px-5 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm">
                          <strong className="font-semibold">{r.nome_usuario ?? 'Sistema'}</strong> ·{' '}
                          {legivel(r.acao)}{' '}
                          <span className="text-muted-foreground">({r.entidade})</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dataHora(r.data_hora)}
                          {r.ip && ` · IP ${r.ip}`}
                        </span>
                      </div>
                      {lista.length > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto self-start px-0"
                          aria-expanded={expandido}
                          onClick={() => setAberto(expandido ? null : r.id_auditoria)}
                        >
                          {expandido
                            ? 'Esconder mudanças'
                            : `Ver ${lista.length} ${lista.length === 1 ? 'mudança' : 'mudanças'}`}
                        </Button>
                      )}
                      {expandido && (
                        <table className="w-full text-xs">
                          <thead className="text-left text-muted-foreground">
                            <tr>
                              <th className="pb-1 font-medium">Campo</th>
                              <th className="pb-1 font-medium">Antes</th>
                              <th className="pb-1 font-medium">Depois</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lista.map((m) => (
                              <tr key={m.campo} className="align-top">
                                <td className="py-1 pr-3 font-mono">{m.campo}</td>
                                <td className="py-1 pr-3 break-all text-muted-foreground">
                                  {m.antes}
                                </td>
                                <td className="py-1 break-all">{m.depois}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Paginacao
                pagina={p.pagina}
                tamanho={p.tamanho}
                total={p.total}
                aoMudar={setPagina}
              />
            </>
          )}
        </EstadoConsulta>
      </Card>
    </div>
  );
}
