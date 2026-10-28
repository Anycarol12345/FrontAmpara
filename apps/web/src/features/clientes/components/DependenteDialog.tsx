import {
  getListarDependentesQueryKey,
  useAtualizarDependente,
  useCadastrarDependente,
  type DependenteResponse,
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
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { cpf as formatarCpf, dataParaCampo } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { mascararCpf, mascararData, mascararTelefone } from '@/shared/lib/mascaras';
import {
  dependenteSchema,
  PARENTESCOS,
  type DependenteForm,
  type DependenteValidado,
} from '../schemas/dependente';

type Props = {
  aberto: boolean;
  aoFechar: () => void;
  /** Sem dependente = inclusão; com dependente = edição (o CPF não muda). */
  dependente?: DependenteResponse | null;
  /** Chamado com o dependente salvo (ex.: para já marcar na contratação). */
  aoSalvar?: (dependente: DependenteResponse) => void;
};

const CAMPOS = ['nome', 'cpf', 'dataNascimento', 'parentesco', 'telefone', 'email'] as const;
const CONFLITOS = {
  'Dependente.CpfDuplicado': 'cpf',
  'Dependente.CpfDoTitular': 'cpf',
} as const;

/** Inclusão e edição de dependente (FE-CLI-03). */
export function DependenteDialog({ aberto, aoFechar, dependente, aoSalvar }: Props) {
  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogTitle>{dependente ? 'Editar dependente' : 'Incluir dependente'}</DialogTitle>
        <DialogDescription>
          Pessoas da família que podem ser incluídas nos seus planos.
        </DialogDescription>
        {/* A chave recria o formulário a cada abertura, com os dados certos. */}
        {aberto && (
          <Formulario
            key={dependente?.id_dependente ?? 'novo'}
            dependente={dependente ?? null}
            aoConcluir={(salvo) => {
              aoSalvar?.(salvo);
              aoFechar();
            }}
            aoCancelar={aoFechar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  dependente,
  aoConcluir,
  aoCancelar,
}: {
  dependente: DependenteResponse | null;
  aoConcluir: (dependente: DependenteResponse) => void;
  aoCancelar: () => void;
}) {
  const opcoes = { mutation: { meta: { invalida: [getListarDependentesQueryKey()] } } };
  const cadastrar = useCadastrarDependente(opcoes);
  const atualizar = useAtualizarDependente(opcoes);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DependenteForm, unknown, DependenteValidado>({
    resolver: zodResolver(dependenteSchema),
    defaultValues: {
      nome: dependente?.nome ?? '',
      cpf: dependente ? formatarCpf(dependente.cpf) : '',
      dataNascimento: dataParaCampo(dependente?.data_nascimento),
      parentesco: dependente?.parentesco ?? '',
      telefone: dependente?.telefone ? mascararTelefone(dependente.telefone) : '',
      email: dependente?.email ?? '',
    },
  });

  const enviar = handleSubmit(async (dados) => {
    const comum = {
      nome: dados.nome,
      data_nascimento: dados.dataNascimento,
      parentesco: dados.parentesco,
      telefone: dados.telefone || null,
      email: dados.email || null,
    };
    try {
      const salvo = dependente
        ? await atualizar.mutateAsync({ id: dependente.id_dependente, data: comum })
        : await cadastrar.mutateAsync({ data: { ...comum, cpf: dados.cpf } });
      toast.success(dependente ? 'Dependente atualizado.' : 'Dependente incluído.');
      aoConcluir(salvo);
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS, CONFLITOS)) throw erro;
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <ErroFormulario mensagem={errors.root?.servidor?.message} />
      </div>
      <Campo
        id="dep-nome"
        label="Nome completo"
        erro={errors.nome?.message}
        className="sm:col-span-2"
      >
        <Input {...register('nome')} />
      </Campo>
      <Campo id="dep-cpf" label="CPF" erro={errors.cpf?.message}>
        <Input
          inputMode="numeric"
          placeholder="000.000.000-00"
          disabled={Boolean(dependente)}
          {...register('cpf', { onChange: (e) => (e.target.value = mascararCpf(e.target.value)) })}
        />
      </Campo>
      <Campo id="dep-nascimento" label="Data de nascimento" erro={errors.dataNascimento?.message}>
        <Input
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          {...register('dataNascimento', {
            onChange: (e) => (e.target.value = mascararData(e.target.value)),
          })}
        />
      </Campo>
      <Campo id="dep-parentesco" label="Parentesco" erro={errors.parentesco?.message}>
        <select
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
          {...register('parentesco')}
        >
          <option value="">Selecione</option>
          {/* Mantém um parentesco antigo que não está na lista. */}
          {dependente && !(PARENTESCOS as readonly string[]).includes(dependente.parentesco) && (
            <option value={dependente.parentesco}>{dependente.parentesco}</option>
          )}
          {PARENTESCOS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id="dep-telefone" label="Celular (opcional)" erro={errors.telefone?.message}>
        <Input
          type="tel"
          placeholder="(00) 00000-0000"
          {...register('telefone', {
            onChange: (e) => (e.target.value = mascararTelefone(e.target.value)),
          })}
        />
      </Campo>
      <Campo
        id="dep-email"
        label="E-mail (opcional)"
        erro={errors.email?.message}
        className="sm:col-span-2"
      >
        <Input type="email" {...register('email')} />
      </Campo>
      <DialogFooter className="sm:col-span-2">
        <Button type="button" variant="ghost" onClick={aoCancelar}>
          Cancelar
        </Button>
        <Button type="submit" carregando={isSubmitting}>
          {dependente ? 'Salvar' : 'Incluir'}
        </Button>
      </DialogFooter>
    </form>
  );
}
