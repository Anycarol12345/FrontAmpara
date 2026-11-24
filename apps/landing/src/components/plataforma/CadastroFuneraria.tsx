'use client';

import {
  autoCadastroFuneraria,
  ehApiError,
  type FunerariaCadastradaResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { Input } from '@ampara/ui/components/input';
import { Label } from '@ampara/ui/components/label';
import { cn } from '@ampara/ui/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, CircleCheck, LoaderCircle, MailCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type Path } from 'react-hook-form';
import { useDisponibilidadeSlug, type Disponibilidade } from './useDisponibilidadeSlug';
import {
  cadastroFunerariaSchema,
  ETAPAS,
  mascararCnpj,
  mascararTelefone,
  somenteDigitos,
  sugerirSlug,
  type CadastroFunerariaForm,
} from './validacao';

type Props = { dominioBase: string; urlPainel: string };

// Campos da API (snake_case) → campos do formulário, para mostrar os erros 400 e 409 no lugar certo.
const CAMPO_DA_API: Record<string, Path<CadastroFunerariaForm>> = {
  nomefantasia: 'nomeFantasia',
  razaosocial: 'razaoSocial',
  cnpj: 'cnpj',
  emailcontato: 'emailContato',
  telefone: 'telefone',
  slug: 'slug',
  gestornome: 'gestorNome',
  gestoremail: 'gestorEmail',
  gestor: 'gestorNome',
};
const normalizar = (nome: string) => nome.replace(/[_\-.\s]/g, '').toLowerCase();

/** Auto-cadastro de funerária em etapas (FE-PUB-04, TEN-02). */
export function CadastroFuneraria({ dominioBase, urlPainel }: Props) {
  const [etapa, setEtapa] = useState(0);
  const [cadastrada, setCadastrada] = useState<
    (FunerariaCadastradaResponse & { email: string }) | null
  >(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    setError,
    getValues,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFunerariaForm>({
    resolver: zodResolver(cadastroFunerariaSchema),
    mode: 'onTouched',
    defaultValues: {
      nomeFantasia: '',
      razaoSocial: '',
      cnpj: '',
      emailContato: '',
      telefone: '',
      slug: '',
      gestorNome: '',
      gestorEmail: '',
      termos: false,
    },
  });

  const slug = useWatch({ control, name: 'slug' });
  const disponibilidade = useDisponibilidadeSlug(slug);

  async function avancar() {
    const valido = await trigger([...ETAPAS[etapa]!.campos]);
    if (!valido) return;
    if (etapa === 1 && disponibilidade !== 'disponivel') {
      if (disponibilidade === 'em-uso') {
        setError('slug', { message: 'Este endereço já está em uso. Escolha outro.' });
      }
      return;
    }
    // Sugere o endereço a partir do nome fantasia, se a pessoa ainda não escolheu um.
    if (etapa === 0 && !slug) setValue('slug', sugerirSlug(getValues('nomeFantasia')));
    setEtapa((atual) => atual + 1);
  }

  const enviar = handleSubmit(async (dados) => {
    try {
      const resposta = await autoCadastroFuneraria({
        nome_fantasia: dados.nomeFantasia,
        razao_social: dados.razaoSocial,
        cnpj: somenteDigitos(dados.cnpj),
        email_contato: dados.emailContato,
        telefone: dados.telefone,
        slug: dados.slug,
        gestor: { nome: dados.gestorNome, email: dados.gestorEmail },
      });
      setCadastrada({ ...resposta, email: dados.gestorEmail });
    } catch (erro) {
      if (!ehApiError(erro)) throw erro;
      const campos = Object.entries(erro.erros);
      if (campos.length === 0) {
        // 409: CNPJ ou endereço já cadastrados; o código diz qual.
        const campo = /slug/i.test(erro.codigo ?? '')
          ? 'slug'
          : /cnpj/i.test(erro.codigo ?? '')
            ? 'cnpj'
            : null;
        if (campo) {
          setError(campo, { message: erro.message });
          setEtapa(campo === 'slug' ? 1 : 0);
        } else {
          setError('root.servidor', { message: erro.message });
        }
        return;
      }
      for (const [chave, mensagens] of campos) {
        const campo = CAMPO_DA_API[normalizar(chave)];
        if (campo) setError(campo, { message: mensagens[0] });
        else setError('root.servidor', { message: mensagens[0] });
      }
      const primeira = ETAPAS.findIndex((e) => e.campos.some((c) => getFieldState(c).invalid));
      if (primeira >= 0) setEtapa(primeira);
    }
  });

  if (cadastrada) {
    return <Concluido cadastro={cadastrada} dominioBase={dominioBase} urlPainel={urlPainel} />;
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <Progresso etapa={etapa} />

      {errors.root?.servidor && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {errors.root.servidor.message}
        </p>
      )}

      {etapa === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="nomeFantasia"
            label="Nome fantasia"
            erro={errors.nomeFantasia?.message}
            className="sm:col-span-2"
          >
            <Input
              id="nomeFantasia"
              placeholder="Funerária São José"
              {...register('nomeFantasia')}
            />
          </Campo>
          <Campo
            id="razaoSocial"
            label="Razão social"
            erro={errors.razaoSocial?.message}
            className="sm:col-span-2"
          >
            <Input
              id="razaoSocial"
              placeholder="São José Serviços Funerários Ltda."
              {...register('razaoSocial')}
            />
          </Campo>
          <Campo id="cnpj" label="CNPJ" erro={errors.cnpj?.message}>
            <Input
              id="cnpj"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              {...register('cnpj', {
                onChange: (e) => (e.target.value = mascararCnpj(e.target.value)),
              })}
            />
          </Campo>
          <Campo id="telefone" label="Telefone" erro={errors.telefone?.message}>
            <Input
              id="telefone"
              type="tel"
              placeholder="(00) 0000-0000"
              {...register('telefone', {
                onChange: (e) => (e.target.value = mascararTelefone(e.target.value)),
              })}
            />
          </Campo>
          <Campo
            id="emailContato"
            label="E-mail de contato"
            erro={errors.emailContato?.message}
            className="sm:col-span-2"
          >
            <Input
              id="emailContato"
              type="email"
              placeholder="contato@suafuneraria.com.br"
              {...register('emailContato')}
            />
          </Campo>
        </div>
      )}

      {etapa === 1 && (
        <Campo
          id="slug"
          label="Endereço da sua landing"
          erro={errors.slug?.message}
          dica="Letras minúsculas, números e hífen. É o endereço que as famílias vão acessar."
        >
          <div className="flex items-center overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15">
            <span className="pl-4 text-sm text-subtle-foreground">https://</span>
            <input
              id="slug"
              autoComplete="off"
              spellCheck={false}
              className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
              {...register('slug', {
                onChange: (e) =>
                  (e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')),
              })}
            />
            <span className="pr-4 text-sm text-subtle-foreground">.{dominioBase}</span>
          </div>
          <StatusSlug estado={disponibilidade} />
        </Campo>
      )}

      {etapa === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            O gestor administra a funerária na plataforma e recebe por e-mail o link para criar a
            senha.
          </p>
          <Campo id="gestorNome" label="Nome do gestor" erro={errors.gestorNome?.message}>
            <Input id="gestorNome" autoComplete="name" {...register('gestorNome')} />
          </Campo>
          <Campo id="gestorEmail" label="E-mail do gestor" erro={errors.gestorEmail?.message}>
            <Input
              id="gestorEmail"
              type="email"
              autoComplete="email"
              {...register('gestorEmail')}
            />
          </Campo>
          <div className="flex items-start gap-2">
            <Controller
              control={control}
              name="termos"
              render={({ field }) => (
                <Checkbox
                  id="termos"
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={(marcado) => field.onChange(marcado === true)}
                />
              )}
            />
            <Label
              htmlFor="termos"
              className="text-xs leading-relaxed font-normal text-muted-foreground"
            >
              Li e aceito os Termos de Uso da plataforma e a Política de Privacidade.
            </Label>
          </div>
          {errors.termos && (
            <span className="text-[11px] text-destructive">{errors.termos.message}</span>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-4">
        {etapa > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setEtapa((atual) => atual - 1)}>
            <ArrowLeft /> Voltar
          </Button>
        ) : (
          <span />
        )}
        {etapa < ETAPAS.length - 1 ? (
          <Button type="button" onClick={() => void avancar()}>
            Continuar <ArrowRight />
          </Button>
        ) : (
          <Button type="submit" carregando={isSubmitting}>
            Cadastrar funerária <ArrowRight />
          </Button>
        )}
      </div>
    </form>
  );
}

function Progresso({ etapa }: { etapa: number }) {
  return (
    <ol className="flex items-center gap-3" aria-label="Etapas do cadastro">
      {ETAPAS.map(({ titulo }, i) => (
        <li
          key={titulo}
          className="flex flex-1 items-center gap-2"
          aria-current={i === etapa ? 'step' : undefined}
        >
          <span
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
              i < etapa
                ? 'bg-primary text-primary-foreground'
                : i === etapa
                  ? 'border-2 border-primary text-primary'
                  : 'border border-input text-subtle-foreground',
            )}
          >
            {i < etapa ? <Check className="size-3" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cn('text-xs', i === etapa ? 'font-semibold' : 'text-muted-foreground')}>
            {titulo}
          </span>
          {i < ETAPAS.length - 1 && <span className="h-px flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

const TEXTO_STATUS: Record<Disponibilidade, { texto: string; classe: string } | null> = {
  vazio: null,
  invalido: null,
  verificando: { texto: 'Verificando disponibilidade…', classe: 'text-muted-foreground' },
  disponivel: { texto: 'Endereço disponível', classe: 'text-success-foreground' },
  'em-uso': { texto: 'Este endereço já está em uso', classe: 'text-destructive' },
  erro: {
    texto: 'Não foi possível verificar agora. Tente de novo.',
    classe: 'text-warning-foreground',
  },
};

function StatusSlug({ estado }: { estado: Disponibilidade }) {
  const status = TEXTO_STATUS[estado];
  if (!status) return null;
  return (
    <span role="status" className={cn('flex items-center gap-1.5 text-xs', status.classe)}>
      {estado === 'verificando' && <LoaderCircle className="size-3 animate-spin" />}
      {estado === 'disponivel' && <CircleCheck className="size-3" />}
      {status.texto}
    </span>
  );
}

function Concluido({
  cadastro,
  dominioBase,
  urlPainel,
}: {
  cadastro: FunerariaCadastradaResponse & { email: string };
  dominioBase: string;
  urlPainel: string;
}) {
  const pendente = cadastro.status === 'PENDENTE';
  return (
    <div role="status" className="flex flex-col items-center py-6 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-success text-success-foreground">
        <MailCheck className="size-6" strokeWidth={1.75} />
      </span>
      <h2 className="mt-5 font-serif text-3xl text-primary">Cadastro recebido!</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        Enviamos para <strong className="text-foreground">{cadastro.email}</strong> o link para
        criar a senha do gestor.
      </p>
      {pendente ? (
        <p className="mt-4 max-w-md rounded-xl bg-warning px-4 py-3 text-xs text-warning-foreground">
          Sua funerária está <strong>aguardando aprovação</strong> da plataforma. Avisaremos por
          e-mail quando{' '}
          <strong>
            {cadastro.slug}.{dominioBase}
          </strong>{' '}
          estiver no ar.
        </p>
      ) : (
        <Button asChild className="mt-6">
          <a href={urlPainel}>Ir para o painel</a>
        </Button>
      )}
    </div>
  );
}

function Campo({
  id,
  label,
  erro,
  dica,
  className,
  children,
}: {
  id: string;
  label: string;
  erro?: string | undefined;
  dica?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
      {(erro || dica) && (
        <span className={cn('text-[11px]', erro ? 'text-destructive' : 'text-subtle-foreground')}>
          {erro ?? dica}
        </span>
      )}
    </div>
  );
}
