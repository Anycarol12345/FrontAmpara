import {
  getListarLocaisQueryKey,
  useAtualizarLocal,
  useCriarLocal,
  type LocalResponse,
} from '@ampara/api-client';
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
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { TIPO_LOCAL } from './locais';

const localSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(120, 'Use no máximo 120 caracteres.'),
  tipo: z.enum(['SALA_VELORIO', 'CEMITERIO', 'CREMATORIO', 'IGREJA', 'OUTRO']),
  endereco: z.string().trim().max(200, 'Use no máximo 200 caracteres.'),
  proprio: z.boolean(),
  intervalo_preparacao_minutos: z.coerce
    .number<string>()
    .int('Use um número inteiro.')
    .min(0, 'Use 0 ou mais.')
    .max(720, 'Use no máximo 720 minutos.'),
});
type LocalForm = z.input<typeof localSchema>;
type LocalValidado = z.output<typeof localSchema>;
const CAMPOS = ['nome', 'tipo', 'endereco', 'intervalo_preparacao_minutos'] as const;

const classeSelect =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15';

/** Cadastro e edição de sala ou local (FE-ADM-06, FUN-05). */
export function LocalDialog({
  local,
  aoFechar,
}: {
  /** null = novo local. */
  local: LocalResponse | null;
  aoFechar: () => void;
}) {
  const invalida = { mutation: { meta: { invalida: [getListarLocaisQueryKey()] } } };
  const criar = useCriarLocal(invalida);
  const atualizar = useAtualizarLocal(invalida);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LocalForm, unknown, LocalValidado>({
    resolver: zodResolver(localSchema),
    defaultValues: {
      nome: local?.nome ?? '',
      tipo: local?.tipo ?? 'SALA_VELORIO',
      endereco: local?.endereco ?? '',
      proprio: local?.proprio ?? true,
      intervalo_preparacao_minutos: String(local?.intervalo_preparacao_minutos ?? 60),
    },
  });

  const enviar = handleSubmit(async (d) => {
    const corpo = { ...d, endereco: d.endereco || null };
    try {
      if (local) await atualizar.mutateAsync({ id: local.id_local, data: corpo });
      else await criar.mutateAsync({ data: corpo });
      toast.success(local ? 'Local atualizado.' : 'Local cadastrado.');
      aoFechar();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{local ? 'Editar local' : 'Novo local'}</DialogTitle>
        <DialogDescription>
          Locais próprios têm agenda: a funerária não deixa dois funerais no mesmo horário.
        </DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
          <Campo id="local-nome" label="Nome" erro={errors.nome?.message}>
            <Input placeholder="Ex.: Sala Ipê" {...register('nome')} />
          </Campo>
          <Campo id="local-tipo" label="Tipo">
            <select className={classeSelect} {...register('tipo')}>
              {Object.entries(TIPO_LOCAL).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="local-endereco" label="Endereço (opcional)" erro={errors.endereco?.message}>
            <Input {...register('endereco')} />
          </Campo>
          <Campo
            id="local-intervalo"
            label="Intervalo de preparação (minutos)"
            dica="Tempo de limpeza e arrumação entre um uso e o próximo."
            erro={errors.intervalo_preparacao_minutos?.message}
          >
            <Input type="number" min="0" step="15" {...register('intervalo_preparacao_minutos')} />
          </Campo>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="proprio"
              render={({ field }) => (
                <Checkbox
                  id="local-proprio"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              )}
            />
            <Label htmlFor="local-proprio">Local da própria funerária</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : local ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
