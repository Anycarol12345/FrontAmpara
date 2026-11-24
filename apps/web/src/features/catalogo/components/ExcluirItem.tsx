import {
  alterarStatusCategoria,
  alterarStatusItemCatalogo,
  atualizarItemCatalogo,
  criarCategoria,
  getListarCatalogoGestaoQueryKey,
  getListarCategoriasGestaoQueryKey,
  type CategoriaResponse,
  type ItemResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { toast } from '@ampara/ui/components/sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Campo } from '@/shared/components/Campo';
import { CATEGORIA_EXCLUIDOS, ehExcluidos } from './excluidos';

const dadosDoItem = (item: ItemResponse, idCategoria: string) => ({
  id_categoria: idCategoria,
  nome: item.nome,
  descricao: item.descricao,
  preco: item.preco,
  controla_estoque: item.controla_estoque,
  quantidade_estoque: item.quantidade_estoque,
  id_terceiro_fornecedor: item.id_terceiro_fornecedor,
});

function useRecarregar() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getListarCatalogoGestaoQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListarCategoriasGestaoQueryKey() }),
    ]);
}

/** Confirma e exclui (arquiva) o item. */
export function ExcluirItemDialog({
  item,
  categorias,
  aoFechar,
}: {
  item: ItemResponse;
  categorias: CategoriaResponse[];
  aoFechar: () => void;
}) {
  const recarregar = useRecarregar();
  const [salvando, setSalvando] = useState(false);

  async function excluir() {
    setSalvando(true);
    try {
      let lixeira = categorias.find(ehExcluidos);
      if (!lixeira) {
        const ordem = Math.max(0, ...categorias.map((c) => c.ordem)) + 1;
        lixeira = await criarCategoria({ nome: CATEGORIA_EXCLUIDOS, ordem });
        await alterarStatusCategoria(lixeira.id_categoria, { ativo: false });
      }
      await atualizarItemCatalogo(item.id_item, dadosDoItem(item, lixeira.id_categoria));
      if (item.ativo) await alterarStatusItemCatalogo(item.id_item, { ativo: false });
      await recarregar();
      toast.success(`"${item.nome}" foi excluído.`);
      aoFechar();
    } catch {
      toast.error('Não foi possível excluir o item. Tente novamente.');
      setSalvando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Excluir "{item.nome}"?</DialogTitle>
        <DialogDescription>
          O item sai do catálogo e da área do cliente. Planos e funerais que já usam ele continuam
          como estão. Dá para restaurar em "Mostrar excluídos".
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            carregando={salvando}
            onClick={() => void excluir()}
          >
            Excluir item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const classeSelect =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Devolve o item excluído a uma categoria e o ativa de novo. */
export function RestaurarItemDialog({
  item,
  categorias,
  aoFechar,
}: {
  item: ItemResponse;
  /** Categorias ativas, para onde o item pode voltar. */
  categorias: CategoriaResponse[];
  aoFechar: () => void;
}) {
  const recarregar = useRecarregar();
  const [idCategoria, setIdCategoria] = useState(categorias[0]?.id_categoria ?? '');
  const [salvando, setSalvando] = useState(false);

  async function restaurar() {
    if (!idCategoria) return;
    setSalvando(true);
    try {
      await atualizarItemCatalogo(item.id_item, dadosDoItem(item, idCategoria));
      await alterarStatusItemCatalogo(item.id_item, { ativo: true });
      await recarregar();
      toast.success(`"${item.nome}" voltou para o catálogo.`);
      aoFechar();
    } catch {
      toast.error('Não foi possível restaurar o item. Tente novamente.');
      setSalvando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Restaurar "{item.nome}"</DialogTitle>
        <DialogDescription>Escolha a categoria para onde o item volta.</DialogDescription>
        <div className="mt-5">
          <Campo id="restaurar-categoria" label="Categoria">
            <select
              className={classeSelect}
              value={idCategoria}
              onChange={(e) => setIdCategoria(e.target.value)}
            >
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button carregando={salvando} disabled={!idCategoria} onClick={() => void restaurar()}>
            Restaurar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
