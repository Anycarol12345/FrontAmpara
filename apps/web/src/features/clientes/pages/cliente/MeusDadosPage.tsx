import {
  getObterMeusDadosQueryKey,
  useAtualizarMeusDados,
  useObterMeusDados,
  type ClienteResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { useBuscaCep } from '@/shared/hooks/useBuscaCep';
import { cpf, data } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { mascararCep, mascararTelefone } from '@/shared/lib/mascaras';
import { AlterarSenha } from '../../components/AlterarSenha';
import { UFS } from '../../schemas/cadastro';
import { meusDadosSchema, type MeusDadosForm } from '../../schemas/meusDados';

/** Dados do titular e alteração de senha (FE-CLI-02, GET/PUT /clientes/me, PUT /auth/senha). */
export function MeusDadosPage() {
  const consulta = useObterMeusDados();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo="Meus dados"
        descricao="Mantenha seus contatos e endereço atualizados para a funerária falar com você."
      />
      <EstadoConsulta consulta={consulta}>
        {(cliente) => <Formulario cliente={cliente} />}
      </EstadoConsulta>
      <AlterarSenha />
    </div>
  );
}

const CAMPOS = ['nome', 'telefone', 'cep', 'endereco', 'cidade', 'estado'] as const;

function Formulario({ cliente }: { cliente: ClienteResponse }) {
  const { buscar: buscarCep } = useBuscaCep();
  const salvar = useAtualizarMeusDados({
    mutation: { meta: { invalida: [getObterMeusDadosQueryKey()] } },
  });

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MeusDadosForm>({
    resolver: zodResolver(meusDadosSchema),
    defaultValues: {
      nome: cliente.nome,
      telefone: cliente.telefone ? mascararTelefone(cliente.telefone) : '',
      cep: cliente.cep ? mascararCep(cliente.cep) : '',
      endereco: cliente.endereco ?? '',
      cidade: cliente.cidade ?? '',
      estado: (cliente.estado ?? '') as MeusDadosForm['estado'],
    },
  });

  const enviar = handleSubmit(async (dados) => {
    try {
      const vazioParaNulo = (valor: string) => valor.trim() || null;
      await salvar.mutateAsync({
        data: {
          nome: dados.nome,
          telefone: vazioParaNulo(dados.telefone),
          cep: vazioParaNulo(dados.cep),
          endereco: vazioParaNulo(dados.endereco),
          cidade: vazioParaNulo(dados.cidade),
          estado: vazioParaNulo(dados.estado),
        },
      });
      reset(dados);
      toast.success('Dados atualizados.');
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  async function preencherEndereco(cep: string) {
    const endereco = await buscarCep(cep);
    if (!endereco) return;
    const opcoes = { shouldDirty: true, shouldValidate: true };
    if (endereco.logradouro)
      setValue('endereco', `${endereco.logradouro}, ${endereco.bairro}`, opcoes);
    setValue('cidade', endereco.cidade, opcoes);
    if ((UFS as readonly string[]).includes(endereco.uf)) {
      setValue('estado', endereco.uf as MeusDadosForm['estado'], opcoes);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="p-7">
        <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ErroFormulario mensagem={errors.root?.servidor?.message} />
          </div>
          <Campo
            id="nome"
            label="Nome completo"
            erro={errors.nome?.message}
            className="sm:col-span-2"
          >
            <Input autoComplete="name" {...register('nome')} />
          </Campo>
          <Campo id="telefone" label="Celular com DDD" erro={errors.telefone?.message}>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              {...register('telefone', {
                onChange: (e) => (e.target.value = mascararTelefone(e.target.value)),
              })}
            />
          </Campo>
          <Campo id="cep" label="CEP" erro={errors.cep?.message}>
            <Input
              inputMode="numeric"
              placeholder="00000-000"
              {...register('cep', {
                onChange: (e) => {
                  e.target.value = mascararCep(e.target.value);
                  if (e.target.value.length === 9) void preencherEndereco(e.target.value);
                },
              })}
            />
          </Campo>
          <Campo
            id="endereco"
            label="Endereço"
            erro={errors.endereco?.message}
            className="sm:col-span-2"
          >
            <Input autoComplete="street-address" {...register('endereco')} />
          </Campo>
          <Campo id="cidade" label="Cidade" erro={errors.cidade?.message}>
            <Input autoComplete="address-level2" {...register('cidade')} />
          </Campo>
          <Campo id="estado" label="UF" erro={errors.estado?.message}>
            <select
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
              {...register('estado')}
            >
              <option value="">--</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </Campo>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" carregando={isSubmitting} disabled={!isDirty}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </Card>

      <Card className="self-start p-7">
        <h2 className="text-sm font-bold">Dados da conta</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Para alterar estes dados, fale com a funerária.
        </p>
        <dl className="mt-5 flex flex-col gap-4 text-sm">
          {[
            ['CPF', cpf(cliente.cpf)],
            ['E-mail', cliente.email],
            ['Nascimento', data(cliente.data_nascimento)],
          ].map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-xs text-muted-foreground">{rotulo}</dt>
              <dd className="mt-0.5 font-semibold break-all">{valor}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
