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
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImageOff,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Tabela, type Coluna } from '@/shared/components/Tabela';
import { real } from '@/shared/lib/formatar';
import { CategoriaDialog } from '../../components/CategoriaDialog';
import { ExcluirItemDialog, RestaurarItemDialog } from '../../components/ExcluirItem';
import { ehExcluidos } from '../../components/excluidos';
import { ItemCatalogoDialog } from '../../components/ItemCatalogoDialog';

type Edicao =
  | { tipo: 'categoria'; categoria: CategoriaResponse | null }
  | { tipo: 'item'; item: ItemResponse | null }
  | { tipo: 'excluir' | 'restaurar'; item: ItemResponse };

/** Catálogo de produtos e serviços da funerária (FE-ADM-09, FUN-01). Tudo é personalizável (DEC-07). */
export function CatalogoPage() {
  const categorias = useListarCategoriasGestao();
  const [categoria, setCategoria] = useState<string | null>(null);
  // Itens excluídos ficam numa categoria escondida (ver ExcluirItem): só aparecem neste modo.
  const [mostrarExcluidos, setMostrarExcluidos] = useState(false);
  const itens = useListarCatalogoGestao(categoria && !mostrarExcluidos ? { categoria } : undefined);
  const [edicao, setEdicao] = useState<Edicao | null>(null);

  const todas = [...(categorias.data ?? [])].sort((a, b) => a.ordem - b.ordem);
  const lixeira = todas.find(ehExcluidos);
  const ordenadas = todas.filter((c) => !ehExcluidos(c));
  const nomeDaCategoria = new Map(ordenadas.map((c) => [c.id_categoria, c.nome]));
  const naLixeira = (i: ItemResponse) => i.id_categoria === lixeira?.id_categoria;
  const daVez = (i: ItemResponse) => (mostrarExcluidos ? naLixeira(i) : !naLixeira(i));
  const totalExcluidos = (itens.data ?? []).filter(naLixeira).length;

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

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
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
                selecionada={mostrarExcluidos ? '' : categoria}
                aoSelecionar={(c) => {
                  setMostrarExcluidos(false);
                  setCategoria(c);
                }}
                aoEditar={(c) => setEdicao({ tipo: 'categoria', categoria: c })}
              />
            )}
          </EstadoConsulta>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <p className="text-sm font-semibold">
              {mostrarExcluidos ? 'Itens excluídos' : 'Itens do catálogo'}
            </p>
            {(mostrarExcluidos || lixeira) && (
              <Button variant="ghost" size="sm" onClick={() => setMostrarExcluidos((m) => !m)}>
                {mostrarExcluidos ? (
                  'Voltar ao catálogo'
                ) : (
                  <>
                    <Trash2 /> Mostrar excluídos{totalExcluidos > 0 && ` (${totalExcluidos})`}
                  </>
                )}
              </Button>
            )}
          </div>
          <EstadoConsulta
            consulta={itens}
            estaVazio={(lista) => !lista.some(daVez)}
            vazio={
              mostrarExcluidos ? (
                <Vazio titulo="Nenhum item excluído" />
              ) : (
                <Vazio
                  titulo="Nenhum item nesta categoria"
                  descricao="Crie o primeiro item para usá-lo nos planos e funerais."
                />
              )
            }
          >
            {(lista) => (
              <TabelaItens
                itens={lista.filter(daVez)}
                nomeDaCategoria={nomeDaCategoria}
                excluidos={mostrarExcluidos}
                aoEditar={(item) => setEdicao({ tipo: 'item', item })}
                aoExcluir={(item) => setEdicao({ tipo: 'excluir', item })}
                aoRestaurar={(item) => setEdicao({ tipo: 'restaurar', item })}
              />
            )}
          </EstadoConsulta>
        </Card>
      </div>

      {edicao?.tipo === 'excluir' && (
        <ExcluirItemDialog item={edicao.item} categorias={todas} aoFechar={() => setEdicao(null)} />
      )}
      {edicao?.tipo === 'restaurar' && (
        <RestaurarItemDialog
          item={edicao.item}
          categorias={ordenadas.filter((c) => c.ativo)}
          aoFechar={() => setEdicao(null)}
        />
      )}
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
      'min-w-0 flex-1 rounded-lg px-2.5 py-2 text-left text-sm leading-snug break-words transition-colors hover:bg-muted',
      ativa && 'bg-muted font-semibold',
    );
  const icone = 'size-7 shrink-0 text-muted-foreground hover:text-foreground';

  return (
    <ul className="flex flex-col gap-0.5" aria-label="Categorias">
      <li>
        <button
          type="button"
          className={cn(classe(selecionada === null), 'w-full')}
          onClick={() => aoSelecionar(null)}
        >
          Todas
        </button>
      </li>
      {categorias.map((c, i) => (
        <li key={c.id_categoria} className="flex items-center gap-1">
          <button
            type="button"
            title={c.nome}
            className={cn(
              classe(selecionada === c.id_categoria),
              !c.ativo && 'text-muted-foreground line-through decoration-1',
            )}
            onClick={() => aoSelecionar(c.id_categoria)}
          >
            {c.nome}
          </button>
          {/* Ações em ícones do mesmo tamanho, numa coluna fixa: os nomes ficam alinhados. */}
          <span className="flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon"
              className={icone}
              aria-label={`Subir ${c.nome}`}
              title="Subir"
              disabled={i === 0 || atualizar.isPending}
              onClick={() => void mover(i, -1)}
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={icone}
              aria-label={`Descer ${c.nome}`}
              title="Descer"
              disabled={i === categorias.length - 1 || atualizar.isPending}
              onClick={() => void mover(i, 1)}
            >
              <ArrowDown />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={icone}
              aria-label={`Editar ${c.nome}`}
              title="Editar"
              onClick={() => aoEditar(c)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={icone}
              aria-label={`${c.ativo ? 'Desativar' : 'Ativar'} ${c.nome}`}
              title={c.ativo ? 'Desativar' : 'Ativar'}
              onClick={() =>
                alterarStatus.mutate({ id: c.id_categoria, data: { ativo: !c.ativo } })
              }
            >
              {c.ativo ? <Eye /> : <EyeOff />}
            </Button>
          </span>
        </li>
      ))}
    </ul>
  );
}

function TabelaItens({
  itens,
  nomeDaCategoria,
  excluidos,
  aoEditar,
  aoExcluir,
  aoRestaurar,
}: {
  itens: ItemResponse[];
  nomeDaCategoria: Map<string, string>;
  /** Lista dos itens excluídos: só dá para restaurar. */
  excluidos: boolean;
  aoEditar: (item: ItemResponse) => void;
  aoExcluir: (item: ItemResponse) => void;
  aoRestaurar: (item: ItemResponse) => void;
}) {
  const alterarStatus = useAlterarStatusItemCatalogo({
    mutation: { meta: { invalida: [getListarCatalogoGestaoQueryKey()] } },
  });

  const colunas: Coluna<ItemResponse>[] = [
    {
      titulo: 'Item',
      celula: (i) => (
        <span className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
            {i.imagem_url ? (
              <img src={i.imagem_url} alt="" className="size-full object-cover" />
            ) : (
              <ImageOff className="size-4 text-subtle-foreground" aria-label="Sem foto" />
            )}
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">{i.nome}</span>
            <span className="text-xs text-muted-foreground">
              {excluidos ? 'Excluído' : nomeDaCategoria.get(i.id_categoria)}
            </span>
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
      celula: (i) =>
        excluidos ? (
          <Badge variant="neutral">Excluído</Badge>
        ) : (
          <Badge variant={i.ativo ? 'success' : 'neutral'}>{i.ativo ? 'Ativo' : 'Inativo'}</Badge>
        ),
    },
    {
      titulo: 'Ações',
      celula: (i) =>
        excluidos ? (
          <Button variant="outline" size="sm" onClick={() => aoRestaurar(i)}>
            <RotateCcw /> Restaurar
          </Button>
        ) : (
          // Ícones lado a lado (o nome aparece ao passar o mouse), como nas categorias.
          <span className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar"
              title="Editar"
              onClick={() => aoEditar(i)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={i.ativo ? 'Desativar' : 'Ativar'}
              title={i.ativo ? 'Desativar' : 'Ativar'}
              onClick={() => alterarStatus.mutate({ id: i.id_item, data: { ativo: !i.ativo } })}
            >
              {i.ativo ? <Eye /> : <EyeOff />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir"
              title="Excluir"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => aoExcluir(i)}
            >
              <Trash2 />
            </Button>
          </span>
        ),
    },
  ];

  return <Tabela colunas={colunas} linhas={itens} chave={(i) => i.id_item} />;
}
