import {
  ehApiError,
  getItensFuneralQueryKey,
  getObterOrcamentoFuneralQueryKey,
  useAdicionarItemFuneral,
  useListarCatalogoGestao,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { useState, type FormEvent } from 'react';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { real } from '@/shared/lib/formatar';

const CLASSE_SELECT =
  'h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Montador: escolhe um item do catálogo, a variação e a quantidade (FE-ADM-05, POST /funerais/{id}/itens). */
export function AdicionarItemAoFuneral({ idFuneral }: { idFuneral: string }) {
  const catalogo = useListarCatalogoGestao();
  const adicionar = useAdicionarItemFuneral({
    mutation: {
      meta: {
        invalida: [
          getItensFuneralQueryKey(idFuneral),
          getObterOrcamentoFuneralQueryKey(idFuneral),
        ],
      },
    },
  });
  const [idItem, setIdItem] = useState('');
  const [idVariacao, setIdVariacao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [erro, setErro] = useState<string>();

  const itens = (catalogo.data ?? []).filter((item) => item.ativo);
  const escolhido = itens.find((item) => item.id_item === idItem);
  const variacoes = escolhido?.variacoes.filter((variacao) => variacao.ativo) ?? [];
  const quantidadeNumerica = Number.parseInt(quantidade, 10);
  const valido = idItem !== '' && Number.isInteger(quantidadeNumerica) && quantidadeNumerica >= 1;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setErro(undefined);
    try {
      await adicionar.mutateAsync({
        id: idFuneral,
        data: {
          id_item_catalogo: idItem,
          id_variacao: idVariacao === '' ? null : idVariacao,
          quantidade: quantidadeNumerica,
        },
      });
      toast.success('Item adicionado.');
      setIdItem('');
      setIdVariacao('');
      setQuantidade('1');
    } catch (e) {
      setErro(ehApiError(e) ? e.message : 'Não foi possível adicionar o item. Tente novamente.');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold">Adicionar item do catálogo</h2>
      <p className="text-[11px] text-subtle-foreground">
        O sistema separa sozinho o que o plano cobre do que é adicional.
      </p>
      <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
        <ErroFormulario mensagem={erro} />
        <div className="grid gap-4 sm:grid-cols-[2fr_1.5fr_1fr]">
          <Campo id="item-catalogo" label="Item">
            <select
              className={CLASSE_SELECT}
              value={idItem}
              onChange={(e) => {
                setIdItem(e.target.value);
                setIdVariacao('');
              }}
            >
              <option value="">Escolha um item</option>
              {itens.map((item) => {
                const semEstoque = item.controla_estoque && (item.quantidade_estoque ?? 0) < 1;
                return (
                  <option key={item.id_item} value={item.id_item} disabled={semEstoque}>
                    {item.nome} · {real(item.preco)}
                    {semEstoque ? ' (sem estoque)' : ''}
                  </option>
                );
              })}
            </select>
          </Campo>
          <Campo id="item-variacao" label="Variação">
            <select
              className={CLASSE_SELECT}
              value={idVariacao}
              disabled={variacoes.length === 0}
              onChange={(e) => setIdVariacao(e.target.value)}
            >
              <option value="">{variacoes.length === 0 ? 'Sem variações' : 'Padrão'}</option>
              {variacoes.map((variacao) => (
                <option key={variacao.id_variacao} value={variacao.id_variacao}>
                  {variacao.nome} (+{real(variacao.acrescimo_preco)})
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="item-quantidade" label="Quantidade">
            <Input
              type="number"
              min={1}
              step={1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </Campo>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={!valido} carregando={adicionar.isPending}>
            Adicionar ao funeral
          </Button>
        </div>
      </form>
    </Card>
  );
}