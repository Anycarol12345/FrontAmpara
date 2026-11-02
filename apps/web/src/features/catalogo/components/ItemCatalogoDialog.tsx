import {
  getListarCatalogoGestaoQueryKey,
  useAdicionarVariacao,
  useAlterarStatusVariacao,
  useAtualizarItemCatalogo,
  useCriarItemCatalogo,
  useEnviarImagemItemCatalogo,
  useListarTerceiros,
  type CategoriaResponse,
  type ItemResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Checkbox } from '@ampara/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { Label } from '@ampara/ui/components/label';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { numero, real } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';

const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

const itemSchema = z.object({
  id_categoria: z.string().min(1, 'Escolha a categoria.'),
  nome: z.string().trim().min(1, 'Nome é obrigatório.').max(120, 'Use no máximo 120 caracteres.'),
  descricao: z.string().trim().max(500, 'Use no máximo 500 caracteres.'),
  preco: z.coerce.number<string>().min(0, 'Informe um preço positivo.'),
  controla_estoque: z.boolean(),
  quantidade_estoque: z.string(),
  id_terceiro_fornecedor: z.string(),
});
type ItemForm = z.input<typeof itemSchema>;
type ItemValidado = z.output<typeof itemSchema>;
const CAMPOS = ['id_categoria', 'nome', 'descricao', 'preco', 'quantidade_estoque'] as const;

const classeSelect =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Criação e edição de item do catálogo, com variações, imagem e fornecedor (FE-ADM-09, FUN-01). */
export function ItemCatalogoDialog({
  item,
  categorias,
  categoriaInicial,
  aoFechar,
}: {
  /** null = novo item. */
  item: ItemResponse | null;
  categorias: CategoriaResponse[];
  categoriaInicial?: string;
  aoFechar: () => void;
}) {
  const invalida = { mutation: { meta: { invalida: [getListarCatalogoGestaoQueryKey()] } } };
  const criar = useCriarItemCatalogo(invalida);
  const atualizar = useAtualizarItemCatalogo(invalida);
  const fornecedores = useListarTerceiros({ tipo: 'FORNECEDOR', status: 'ATIVO', tamanho: 100 });

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ItemForm, unknown, ItemValidado>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      id_categoria: item?.id_categoria ?? categoriaInicial ?? '',
      nome: item?.nome ?? '',
      descricao: item?.descricao ?? '',
      preco: item ? String(numero(item.preco)) : '',
      controla_estoque: item?.controla_estoque ?? false,
      quantidade_estoque: item?.quantidade_estoque != null ? String(item.quantidade_estoque) : '',
      id_terceiro_fornecedor: '',
    },
  });
  const controlaEstoque = useWatch({ control, name: 'controla_estoque' });

  const enviar = handleSubmit(async (dados) => {
    const quantidade = Number(dados.quantidade_estoque);
    if (dados.controla_estoque && (!Number.isInteger(quantidade) || quantidade < 0)) {
      setError('quantidade_estoque', { message: 'Informe a quantidade em estoque.' });
      return;
    }
    const corpo = {
      id_categoria: dados.id_categoria,
      nome: dados.nome,
      descricao: dados.descricao || null,
      preco: dados.preco,
      controla_estoque: dados.controla_estoque,
      quantidade_estoque: dados.controla_estoque ? quantidade : null,
      // Sem escolha, o fornecedor atual é mantido (a resposta do item não traz o fornecedor).
      ...(dados.id_terceiro_fornecedor
        ? {
            id_terceiro_fornecedor:
              dados.id_terceiro_fornecedor === 'nenhum' ? null : dados.id_terceiro_fornecedor,
          }
        : {}),
    };
    try {
      if (item) await atualizar.mutateAsync({ id: item.id_item, data: corpo });
      else await criar.mutateAsync({ data: corpo });
      toast.success(item ? 'Item atualizado.' : 'Item criado. Agora você pode enviar a foto.');
      aoFechar();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{item ? 'Editar item' : 'Novo item'}</DialogTitle>
        <DialogDescription>
          Preços novos não mudam funerais e orçamentos já aprovados.
        </DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="item-nome" label="Nome" erro={errors.nome?.message}>
              <Input {...register('nome')} />
            </Campo>
            <Campo id="item-categoria" label="Categoria" erro={errors.id_categoria?.message}>
              <select className={classeSelect} {...register('id_categoria')}>
                <option value="">Escolha</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id="item-preco" label="Preço (R$)" erro={errors.preco?.message}>
              <Input type="number" inputMode="decimal" min="0" step="0.01" {...register('preco')} />
            </Campo>
            <Campo
              id="item-fornecedor"
              label="Fornecedor (opcional)"
              dica={item ? 'Deixe em branco para manter o atual.' : undefined}
            >
              <select className={classeSelect} {...register('id_terceiro_fornecedor')}>
                <option value="">{item ? 'Manter como está' : 'Sem fornecedor'}</option>
                {item && <option value="nenhum">Sem fornecedor</option>}
                {fornecedores.data?.itens.map((f) => (
                  <option key={f.id_terceiro} value={f.id_terceiro}>
                    {f.nome_razao_social}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo
              id="item-descricao"
              label="Descrição"
              erro={errors.descricao?.message}
              className="sm:col-span-2"
            >
              <Input {...register('descricao')} />
            </Campo>
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="controla_estoque"
                render={({ field }) => (
                  <Checkbox
                    id="item-estoque"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                )}
              />
              <Label htmlFor="item-estoque">Controlar estoque</Label>
            </div>
            {controlaEstoque && (
              <Campo
                id="item-quantidade"
                label="Quantidade em estoque"
                erro={errors.quantidade_estoque?.message}
              >
                <Input type="number" min="0" step="1" {...register('quantidade_estoque')} />
              </Campo>
            )}
          </div>

          {item && <Imagem item={item} />}
          {item && <Variacoes item={item} />}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" carregando={isSubmitting}>
              Salvar item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Imagem({ item }: { item: ItemResponse }) {
  const enviar = useEnviarImagemItemCatalogo({
    mutation: { meta: { invalida: [getListarCatalogoGestaoQueryKey()] } },
  });
  const [erro, setErro] = useState<string>();

  async function escolher(arquivo: File | undefined) {
    setErro(undefined);
    if (!arquivo) return;
    if (!TIPOS_IMAGEM.includes(arquivo.type)) return setErro('Use uma imagem JPG, PNG ou WebP.');
    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) return setErro('A imagem deve ter até 5 MB.');
    await enviar.mutateAsync({ id: item.id_item, data: { arquivo } });
    toast.success('Foto atualizada.');
  }

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <p className="text-sm font-semibold">Foto</p>
      <p className="text-xs text-muted-foreground">
        {item.imagem_url
          ? 'O item já tem foto. Envie outra para trocar.'
          : 'O item ainda não tem foto.'}
      </p>
      <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full border border-input px-3.5 py-1.5 text-xs font-semibold hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/30">
        <ImagePlus className="size-4" aria-hidden />
        {enviar.isPending ? 'Enviando...' : 'Escolher imagem'}
        <input
          type="file"
          accept={TIPOS_IMAGEM.join(',')}
          className="sr-only"
          onChange={(e) => void escolher(e.target.files?.[0])}
        />
      </label>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </section>
  );
}

function Variacoes({ item }: { item: ItemResponse }) {
  const invalida = { mutation: { meta: { invalida: [getListarCatalogoGestaoQueryKey()] } } };
  const adicionar = useAdicionarVariacao(invalida);
  const alterarStatus = useAlterarStatusVariacao(invalida);
  const [nome, setNome] = useState('');
  const [acrescimo, setAcrescimo] = useState('');

  async function incluir() {
    if (!nome.trim()) return;
    await adicionar.mutateAsync({
      id: item.id_item,
      data: { nome: nome.trim(), acrescimo_preco: Number(acrescimo) || 0 },
    });
    setNome('');
    setAcrescimo('');
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <p className="text-sm font-semibold">Variações</p>
      {item.variacoes.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma variação. Ex.: tamanho grande, mogno.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/70 text-sm">
          {item.variacoes.map((v) => (
            <li key={v.id_variacao} className="flex items-center gap-3 py-2">
              <span className="flex-1">{v.nome}</span>
              <span className="text-xs text-muted-foreground">+ {real(v.acrescimo_preco)}</span>
              {!v.ativo && <Badge variant="neutral">Inativa</Badge>}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  alterarStatus.mutate({
                    id: item.id_item,
                    idVariacao: v.id_variacao,
                    data: { ativo: !v.ativo },
                  })
                }
              >
                {v.ativo ? 'Desativar' : 'Ativar'}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <Input
          aria-label="Nome da variação"
          placeholder="Nome da variação"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="min-w-40 flex-1"
        />
        <Input
          aria-label="Acréscimo de preço"
          placeholder="Acréscimo (R$)"
          type="number"
          min="0"
          step="0.01"
          value={acrescimo}
          onChange={(e) => setAcrescimo(e.target.value)}
          className="w-36"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void incluir()}
          carregando={adicionar.isPending}
        >
          <Plus /> Adicionar
        </Button>
      </div>
    </section>
  );
}
