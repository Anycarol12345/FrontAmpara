import {
  getListarCatalogoGestaoQueryKey,
  getListarCategoriasGestaoQueryKey,
  useAlterarStatusCategoria,
  useAlterarStatusItemCatalogo,
  useAtualizarCategoria,
  useListarCatalogoGestao,
  useListarCategoriasGestao,
  type CategoriaResponse,
  type ItemResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { cn } from '@ampara/ui/lib/utils';
import { ArrowDown, ArrowUp, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Tabela, type Coluna } from '@/shared/components/Tabela';
import { real } from '@/shared/lib/formatar';
import { CategoriaDialog } from '../../components/CategoriaDialog';
import { ItemCatalogoDialog } from '../../components/ItemCatalogoDialog';

type Edicao =
  | { tipo: 'categoria'; categoria: CategoriaResponse | null }
  | { tipo: 'item'; item: ItemResponse | null };

/** Catálogo de produtos e serviços da funerária (FE-ADM-09, FUN-01). Tudo é personalizável (DEC-07). */
export function CatalogoPage() {
  const categorias = useListarCategoriasGestao();
  const [categoria, setCategoria] = useState<string | null>(null);
  const itens = useListarCatalogoGestao(categoria ? { categoria } : undefined);
  const [edicao, setEdicao] = useState<Edicao | null>(null);

  const ordenadas = [...(categorias.data ?? [])].sort((a, b) => a.ordem - b.ordem);
  const nomeDaCategoria = new Map(ordenadas.map((c) => [c.id_categoria, c.nome]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Gestão"
        titulo="Catálogo"
        descricao="Produtos e serviços da funerária: usados nos planos, nas preferências e nos funerais."
        acoes={
          <Button onClick={() => setEdicao({ tipo: 'item', item: null })}>
            <Plus /> Novo item
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <Card className="self-start p-4">
          <div className="flex items-center justify-between px-2 pb-3">
            <h2 className="text-sm font-bold">Categorias</h2>
            <Button
              variant="outline"
              size="sm"
              aria-label="Nova categoria"
              onClick={() => setEdicao({ tipo: 'categoria', categoria: null })}
            >
              <Plus />
            </Button>
          </div>
          <EstadoConsulta consulta={categorias}>
            {() => (
              <Categorias
                categorias={ordenadas}
                selecionada={categoria}
                aoSelecionar={setCategoria}
                aoEditar={(c) => setEdicao({ tipo: 'categoria', categoria: c })}
              />
            )}
          </EstadoConsulta>
        </Card>

        <Card className="overflow-hidden">
          <EstadoConsulta
            consulta={itens}
            estaVazio={(lista) => lista.length === 0}
            vazio={
              <Vazio
                titulo="Nenhum item nesta categoria"
                descricao="Crie o primeiro item para usá-lo nos planos e funerais."
              />
            }
          >
            {(lista) => (
              <TabelaItens
                itens={lista}
                nomeDaCategoria={nomeDaCategoria}
                aoEditar={(item) => setEdicao({ tipo: 'item', item })}
              />
            )}
          </EstadoConsulta>
        </Card>
      </div>

      {edicao?.tipo === 'categoria' && (
        <CategoriaDialog
          categoria={edicao.categoria}
          proximaOrdem={(ordenadas.at(-1)?.ordem ?? 0) + 1}
          aoFechar={() => setEdicao(null)}
        />
      )}
      {edicao?.tipo === 'item' && (
        <ItemCatalogoDialog
          // Ao salvar uma variação ou foto, a lista recarrega: o diálogo usa o item atualizado.
          item={
            edicao.item &&
            (itens.data?.find((i) => i.id_item === edicao.item!.id_item) ?? edicao.item)
          }
          categorias={ordenadas.filter((c) => c.ativo)}
          categoriaInicial={categoria ?? undefined}
          aoFechar={() => setEdicao(null)}
        />
      )}
    </div>
  );
}

function Categorias({
  categorias,
  selecionada,
  aoSelecionar,
  aoEditar,
}: {
  categorias: CategoriaResponse[];
  selecionada: string | null;
  aoSelecionar: (id: string | null) => void;
  aoEditar: (categoria: CategoriaResponse) => void;
}) {
  const invalida = { mutation: { meta: { invalida: [getListarCategoriasGestaoQueryKey()] } } };
  const atualizar = useAtualizarCategoria(invalida);
  const alterarStatus = useAlterarStatusCategoria(invalida);

  // Troca a ordem com a vizinha (para cima ou para baixo).
  async function mover(indice: number, passo: -1 | 1) {
    const atual = categorias[indice]!;
    const vizinha = categorias[indice + passo];
    if (!vizinha) return;
    await Promise.all([
      atualizar.mutateAsync({
        id: atual.id_categoria,
        data: { nome: atual.nome, ordem: vizinha.ordem },
      }),
      atualizar.mutateAsync({
        id: vizinha.id_categoria,
        data: { nome: vizinha.nome, ordem: atual.ordem },
      }),
    ]);
  }

  const classe = (ativa: boolean) =>
    cn(
      'flex-1 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted',
      ativa && 'bg-muted font-semibold',
    );

  return (
    <ul className="flex flex-col gap-0.5" aria-label="Categorias">
      <li>
        <button
          type="button"
          className={classe(selecionada === null)}
          onClick={() => aoSelecionar(null)}
        >
          Todas
        </button>
      </li>
      {categorias.map((c, i) => (
        <li key={c.id_categoria} className="group flex items-center gap-1">
          <button
            type="button"
            className={cn(
              classe(selecionada === c.id_categoria),
              !c.ativo && 'text-muted-foreground',
            )}
            onClick={() => aoSelecionar(c.id_categoria)}
          >
            {c.nome}
            {!c.ativo && <span className="ml-1.5 text-[11px]">(inativa)</span>}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Subir ${c.nome}`}
            disabled={i === 0 || atualizar.isPending}
            onClick={() => void mover(i, -1)}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Descer ${c.nome}`}
            disabled={i === categorias.length - 1 || atualizar.isPending}
            onClick={() => void mover(i, 1)}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Editar ${c.nome}`}
            onClick={() => aoEditar(c)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => alterarStatus.mutate({ id: c.id_categoria, data: { ativo: !c.ativo } })}
          >
            {c.ativo ? 'Desativar' : 'Ativar'}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function TabelaItens({
  itens,
  nomeDaCategoria,
  aoEditar,
}: {
  itens: ItemResponse[];
  nomeDaCategoria: Map<string, string>;
  aoEditar: (item: ItemResponse) => void;
}) {
  const alterarStatus = useAlterarStatusItemCatalogo({
    mutation: { meta: { invalida: [getListarCatalogoGestaoQueryKey()] } },
  });

  const colunas: Coluna<ItemResponse>[] = [
    {
      titulo: 'Item',
      celula: (i) => (
        <span className="flex flex-col">
          <span className="font-semibold">{i.nome}</span>
          <span className="text-xs text-muted-foreground">
            {nomeDaCategoria.get(i.id_categoria)}
          </span>
        </span>
      ),
    },
    { titulo: 'Preço', celula: (i) => real(i.preco) },
    { titulo: 'Variações', celula: (i) => i.variacoes.filter((v) => v.ativo).length },
    {
      titulo: 'Estoque',
      celula: (i) => (i.controla_estoque ? (i.quantidade_estoque ?? 0) : 'Sem controle'),
    },
    {
      titulo: 'Situação',
      celula: (i) => (
        <Badge variant={i.ativo ? 'success' : 'neutral'}>{i.ativo ? 'Ativo' : 'Inativo'}</Badge>
      ),
    },
    {
      titulo: 'Ações',
      celula: (i) => (
        <span className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => aoEditar(i)}>
            <Pencil /> Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alterarStatus.mutate({ id: i.id_item, data: { ativo: !i.ativo } })}
          >
            {i.ativo ? 'Desativar' : 'Ativar'}
          </Button>
        </span>
      ),
    },
  ];

  return <Tabela colunas={colunas} linhas={itens} chave={(i) => i.id_item} />;
}
