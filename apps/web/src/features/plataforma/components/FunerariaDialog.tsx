import { getListarFunerariasQueryKey, useCadastrarFuneraria } from '@ampara/api-client';
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
import { mascararCnpj, mascararTelefone, somenteDigitos } from '@/shared/lib/mascaras';
import { cnpjValido } from '@/shared/lib/validacao';

// Mesmas regras e mensagens do backend (CadastrarFunerariaCommandValidator, TEN-02).
const SLUG_VALIDO = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

/** "Funerária São José" → "funeraria-sao-jose". */
const sugerirSlug = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);

const email = z.string().trim().min(1, 'E-mail é obrigatório.').pipe(z.email('E-mail inválido.'));

const funerariaSchema = z.object({
  nome_fantasia: z.string().trim().min(1, 'Nome fantasia é obrigatório.').max(150),
  razao_social: z.string().trim().min(1, 'Razão social é obrigatória.').max(150),
  cnpj: z.string().refine(cnpjValido, 'CNPJ inválido.'),
  email_contato: email,
  telefone: z
    .string()
    .refine((t) => [10, 11].includes(somenteDigitos(t).length), 'Telefone inválido.'),
  slug: z
    .string()
    .trim()
    .regex(SLUG_VALIDO, 'De 3 a 63 caracteres: letras minúsculas, números e hífen.'),
  gestor_nome: z.string().trim().min(1, 'Nome do gestor é obrigatório.').max(150),
  gestor_email: email,
});
type FunerariaForm = z.infer<typeof funerariaSchema>;
const CAMPOS = Object.keys(funerariaSchema.shape) as (keyof FunerariaForm)[];

/** O ADMIN cadastra uma funerária já ativa; o gestor recebe o convite por e-mail (FE-PLT-01, TEN-02). */
export function FunerariaDialog({ aoFechar }: { aoFechar: () => void }) {
  const cadastrar = useCadastrarFuneraria({
    mutation: { meta: { invalida: [getListarFunerariasQueryKey()] } },
  });
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FunerariaForm>({
    resolver: zodResolver(funerariaSchema),
    defaultValues: {
      nome_fantasia: '',
      razao_social: '',
      cnpj: '',
      email_contato: '',
      telefone: '',
      slug: '',
      gestor_nome: '',
      gestor_email: '',
    },
  });

  const enviar = handleSubmit(async (d) => {
    try {
      await cadastrar.mutateAsync({
        data: {
          nome_fantasia: d.nome_fantasia,
          razao_social: d.razao_social,
          cnpj: somenteDigitos(d.cnpj),
          email_contato: d.email_contato,
          telefone: somenteDigitos(d.telefone),
          slug: d.slug,
          gestor: { nome: d.gestor_nome, email: d.gestor_email },
        },
      });
      toast.success(`${d.nome_fantasia} cadastrada. O gestor recebeu o convite por e-mail.`);
      aoFechar();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Cadastrar funerária</DialogTitle>
        <DialogDescription>
          Cadastrada pela plataforma, a funerária já entra ativa. Ainda falta ela configurar a
          cobrança para vender planos.
        </DialogDescription>
        <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="fun-nome" label="Nome fantasia" erro={errors.nome_fantasia?.message}>
              <Input
                {...register('nome_fantasia', {
                  onChange: (e) => {
                    if (!dirtyFields.slug || !getValues('slug'))
                      setValue('slug', sugerirSlug(e.target.value));
                  },
                })}
              />
            </Campo>
            <Campo id="fun-razao" label="Razão social" erro={errors.razao_social?.message}>
              <Input {...register('razao_social')} />
            </Campo>
            <Campo id="fun-cnpj" label="CNPJ" erro={errors.cnpj?.message}>
              <Input
                inputMode="numeric"
                {...register('cnpj', {
                  onChange: (e) => (e.target.value = mascararCnpj(e.target.value)),
                })}
              />
            </Campo>
            <Campo
              id="fun-slug"
              label="Endereço"
              dica="Fica assim: endereco.ampara.com.br"
              erro={errors.slug?.message}
            >
              <Input {...register('slug')} />
            </Campo>
            <Campo id="fun-email" label="E-mail de contato" erro={errors.email_contato?.message}>
              <Input type="email" {...register('email_contato')} />
            </Campo>
            <Campo id="fun-telefone" label="Telefone" erro={errors.telefone?.message}>
              <Input
                inputMode="tel"
                {...register('telefone', {
                  onChange: (e) => (e.target.value = mascararTelefone(e.target.value)),
                })}
              />
            </Campo>
          </div>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold">Gestor da funerária</legend>
            <Campo id="fun-gestor-nome" label="Nome do gestor" erro={errors.gestor_nome?.message}>
              <Input {...register('gestor_nome')} />
            </Campo>
            <Campo
              id="fun-gestor-email"
              label="E-mail do gestor"
              erro={errors.gestor_email?.message}
            >
              <Input type="email" {...register('gestor_email')} />
            </Campo>
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar e convidar o gestor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
