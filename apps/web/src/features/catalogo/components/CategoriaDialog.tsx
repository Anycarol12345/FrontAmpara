import {
  getListarCategoriasGestaoQueryKey,
  useAtualizarCategoria,
  useCriarCategoria,
  type CategoriaResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';

const categoriaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório.').max(60, 'Use no máximo 60 caracteres.'),
  ordem: z.coerce.number<string>().int('Use um número inteiro.').min(0, 'Use 0 ou mais.'),
});
type CategoriaForm = z.input<typeof categoriaSchema>;
type CategoriaValidada = z.output<typeof categoriaSchema>;

/** Criação e edição de categoria do catálogo (FE-ADM-09). */
export function CategoriaDialog({
  categoria,
  proximaOrdem,
  aoFechar,
}: {
  /** null = nova categoria. */
  categoria: CategoriaResponse | null;
  proximaOrdem: number;
  aoFechar: () => void;
}) {
  const invalida = { mutation: { meta: { invalida: [getListarCategoriasGestaoQueryKey()] } } };
  const criar = useCriarCategoria(invalida);
  const atualizar = useAtualizarCategoria(invalida);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoriaForm, unknown, CategoriaValidada>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: categoria?.nome ?? '',
      ordem: String(categoria?.ordem ?? proximaOrdem),
    },
  });

  const enviar = handleSubmit(async (dados) => {
    try {
      if (categoria) await atualizar.mutateAsync({ id: categoria.id_categoria, data: dados });
      else await criar.mutateAsync({ data: dados });
      toast.success(categoria ? 'Categoria atualizada.' : 'Categoria criada.');
      aoFechar();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, ['nome', 'ordem'])) throw erro;
    }
  });

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent>
        <DialogTitle>{categoria ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        <DialogDescription>
          As categorias organizam o catálogo nos planos, nas preferências e nos funerais.
        </DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
          <Campo id="categoria-nome" label="Nome" erro={errors.nome?.message}>
            <Input {...register('nome')} />
          </Campo>
          <Campo
            id="categoria-ordem"
            label="Ordem"
            dica="Menor aparece primeiro."
            erro={errors.ordem?.message}
          >
            <Input type="number" min="0" step="1" {...register('ordem')} />
          </Campo>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" carregando={isSubmitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
