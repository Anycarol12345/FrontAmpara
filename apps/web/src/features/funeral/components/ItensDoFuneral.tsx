import {
  getItensFuneralQueryKey,
  getObterOrcamentoFuneralQueryKey,
  useImportarPreferenciasFuneral,
  useItensFuneral,
  useListarCatalogoGestao,
  useRemoverItemFuneral,
  type ImportacaoPreferenciasResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { toast } from '@ampara/ui/components/sonner';
import { ClipboardList, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { real } from '@/shared/lib/formatar';

type Props = { idFuneral: string; somenteLeitura: boolean };

/** Itens do funeral separados em cobertos pelo plano e adicionais, com o total a cobrar (FE-ADM-05, FUN-03). */
export function ItensDoFuneral({ idFuneral, somenteLeitura }: Props) {
  const itens = useItensFuneral(idFuneral);
  const catalogo = useListarCatalogoGestao();
  const [importacao, setImportacao] = useState<ImportacaoPreferenciasResponse | null>(null);

  const invalida = [
    getItensFuneralQueryKey(idFuneral),
    getObterOrcamentoFuneralQueryKey(idFuneral),
  ];
  const importar = useImportarPreferenciasFuneral({ mutation: { meta: { invalida } } });
  const remover = useRemoverItemFuneral({ mutation: { meta: { invalida } } });

  const nomeDoItem = (idItem: string) =>
    catalogo.data?.find((item) => item.id_item === idItem)?.nome ?? 'Item do catálogo';

  const importarPreferencias = async () => {
    try {
      const resultado = await importar.mutateAsync({ id: idFuneral });
      setImportacao(resultado);
      toast.success(
        resultado.importados === 1 ? '1 item importado.' : `${resultado.importados} itens importados.`,
      );
    } catch {
      // O aviso de erro já aparece na tela.
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Itens do funeral</h2>
          <p className="text-[11px] text-subtle-foreground">
            O que o plano cobre e o que a família paga a mais
          </p>
        </div>
        {!somenteLeitura && (
          <Button
            type="button"
            variant="outline"
            onClick={importarPreferencias}
            carregando={importar.isPending}
          >
            <ClipboardList /> Importar preferências da família
          </Button>
        )}
      </div>

      {importacao && importacao.ignorados.length > 0 && (
        <div className="mt-4 rounded-lg bg-muted/60 p-4 text-sm">
          <p className="font-semibold">
            {importacao.importados} importado(s). Não entraram:
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
            {importacao.ignorados.map((ignorado) => (
              <li key={ignorado.id_item_catalogo}>
                {nomeDoItem(ignorado.id_item_catalogo)}: {ignorado.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      <EstadoConsulta
        consulta={itens}
        estaVazio={(c) => c.itens_cobertos.length === 0 && c.itens_adicionais.length === 0}
        vazio={
          <Vazio
            titulo="Nenhum item ainda"
            descricao="Importe as preferências da família ou adicione itens do catálogo."
          />
        }
      >
        {(composicao) => (
          <>
            <section className="mt-6">
              <h3 className="text-sm font-bold">Cobertos pelo plano</h3>
              {composicao.itens_cobertos.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nenhum item coberto.</p>
              ) : (
                <ul className="mt-1">
                  {composicao.itens_cobertos.map((item) => (
                    <Linha
                      key={item.id_funeral_item}
                      titulo={item.nome}
                      detalhe={`${item.categoria}${item.variacao ? ` · ${item.variacao}` : ''}`}
                      valor={`×${item.quantidade}`}
                      removendo={remover.isPending}
                      aoRemover={
                        somenteLeitura
                          ? undefined
                          : () => remover.mutate({ id: idFuneral, idItem: item.id_funeral_item })
                      }
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-bold">Adicionais (pagos pela família)</h3>
              {composicao.itens_adicionais.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nenhum item adicional.</p>
              ) : (
                <ul className="mt-1">
                  {composicao.itens_adicionais.map((item) => (
                    <Linha
                      key={item.id_funeral_item}
                      titulo={item.nome}
                      detalhe={`${item.categoria}${item.variacao ? ` · ${item.variacao}` : ''} · ${item.quantidade} × ${real(item.preco_unitario)}${item.somente_diferenca_variacao ? ' · só a diferença da variação' : ''}`}
                      valor={real(item.subtotal)}
                      removendo={remover.isPending}
                      aoRemover={
                        somenteLeitura
                          ? undefined
                          : () => remover.mutate({ id: idFuneral, idItem: item.id_funeral_item })
                      }
                    />
                  ))}
                </ul>
              )}
              <p className="mt-3 flex justify-between border-t border-border/60 pt-3 text-sm font-bold">
                <span>Total adicional</span>
                <span>{real(composicao.total_adicional)}</span>
              </p>
            </section>
          </>
        )}
      </EstadoConsulta>
    </Card>
  );
}

function Linha({
  titulo,
  detalhe,
  valor,
  aoRemover,
  removendo,
}: {
  titulo: string;
  detalhe: string;
  valor: ReactNode;
  aoRemover?: () => void;
  removendo: boolean;
}) {
  return (
    <li className="flex items-center gap-4 border-b border-border/60 py-3 last:border-b-0">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-bold">{titulo}</span>
        <span className="text-xs text-muted-foreground">{detalhe}</span>
      </span>
      <span className="text-sm font-semibold">{valor}</span>
      {aoRemover && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Remover ${titulo}`}
          disabled={removendo}
          onClick={aoRemover}
        >
          <Trash2 />
        </Button>
      )}
    </li>
  );
}