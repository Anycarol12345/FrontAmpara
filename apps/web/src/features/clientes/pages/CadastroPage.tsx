import { cadastrarCliente } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { Input } from '@ampara/ui/components/input';
import { Label } from '@ampara/ui/components/label';
import { Separator } from '@ampara/ui/components/separator';
import { cn } from '@ampara/ui/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AuthAtendimento, AuthSplitLayout } from '@/shared/components/AuthSplitLayout';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { Eyebrow } from '@/shared/components/Eyebrow';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { RegrasSenha } from '@/shared/components/RegrasSenha';
import { useBuscaCep } from '@/shared/hooks/useBuscaCep';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { mascararCep, mascararCpf, mascararData, mascararTelefone } from '@/shared/lib/mascaras';
import {
  cadastroSchema,
  CAMPOS_CADASTRO,
  ETAPAS_CADASTRO,
  UFS,
  type CadastroForm,
  type CadastroValidado,
} from '../schemas/cadastro';

// Conflitos da API (409) que pertencem a um campo.
const ERRO_POR_CODIGO = {
  'Cliente.CpfDuplicado': 'cpf',
  'Cliente.EmailDuplicado': 'email',
} as const;

/** Cadastro do cliente titular em etapas (FE-PUB-02, POST /clientes). */
export function CadastroPage() {
  const [etapa, setEtapa] = useState(0);
  const navigate = useNavigate();
  const [parametros] = useSearchParams();
  const { buscar: buscarCep, buscando: buscandoCep } = useBuscaCep();

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    setError,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<CadastroForm, unknown, CadastroValidado>({
    resolver: zodResolver(cadastroSchema),
    mode: 'onTouched',
    defaultValues: {
      nome: '',
      cpf: '',
      dataNascimento: '',
      celular: '',
      cep: '',
      endereco: '',
      cidade: '',
      estado: '' as CadastroForm['estado'],
      email: '',
      senha: '',
      confirmacao: '',
      termos: false,
    },
  });
  const senha = useWatch({ control, name: 'senha' });

  async function avancar() {
    if (await trigger([...ETAPAS_CADASTRO[etapa]!.campos])) setEtapa((atual) => atual + 1);
  }

  async function preencherEndereco(cep: string) {
    const endereco = await buscarCep(cep);
    if (!endereco) return;
    const opcoes = { shouldValidate: true };
    if (endereco.logradouro)
      setValue('endereco', `${endereco.logradouro}, ${endereco.bairro}`, opcoes);
    setValue('cidade', endereco.cidade, opcoes);
    if ((UFS as readonly string[]).includes(endereco.uf)) {
      setValue('estado', endereco.uf as CadastroForm['estado'], opcoes);
    }
  }

  const criarPerfil = handleSubmit(async (dados) => {
    try {
      await cadastrarCliente({
        nome: dados.nome,
        cpf: dados.cpf,
        data_nascimento: dados.dataNascimento,
        telefone: dados.celular,
        email: dados.email,
        senha: dados.senha,
        endereco: dados.endereco,
        cep: dados.cep,
        cidade: dados.cidade,
        estado: dados.estado,
      });
      const destino = new URLSearchParams({ email: dados.email });
      const plano = parametros.get('plano');
      if (plano) destino.set('plano', plano);
      await navigate(`/cadastro/concluido?${destino}`, { replace: true });
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS_CADASTRO, ERRO_POR_CODIGO)) throw erro;
      // Volta para a primeira etapa com erro vindo da API.
      const primeira = ETAPAS_CADASTRO.findIndex((e) =>
        e.campos.some((c) => getFieldState(c).invalid),
      );
      if (primeira >= 0) setEtapa(primeira);
    }
  });

  const label = 'text-xs';

  return (
    <AuthSplitLayout
      variante="cliente"
      sobretitulo="Seu espaço Ampara"
      titulo={
        <>
          Vamos começar <em>juntos</em>
        </>
      }
      descricao="Crie seu perfil para salvar escolhas, simular planos e conversar com um especialista, no seu tempo."
      itens={[
        'Salve suas escolhas e simulações de plano',
        'Compare os planos com calma e transparência',
        'Converse com um especialista, sem compromisso',
      ]}
    >
      <Eyebrow>Seu espaço Ampara</Eyebrow>
      <h2 className="mt-3 font-serif text-4xl leading-tight">Vamos começar?</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Crie seu perfil para salvar escolhas, simular planos e conversar com um especialista.
      </p>

      <Progresso etapa={etapa} />

      <form onSubmit={criarPerfil} noValidate className="mt-6 flex flex-col gap-4">
        <ErroFormulario mensagem={errors.root?.servidor?.message} />

        {etapa === 0 && (
          <>
            <Campo
              id="nome"
              label="Como podemos chamar você?"
              labelClassName={label}
              erro={errors.nome?.message}
            >
              <Input autoComplete="name" placeholder="Seu nome completo" {...register('nome')} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo id="cpf" label="CPF" labelClassName={label} erro={errors.cpf?.message}>
                <Input
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  {...register('cpf', {
                    onChange: (e) => (e.target.value = mascararCpf(e.target.value)),
                  })}
                />
              </Campo>
              <Campo
                id="dataNascimento"
                label="Data de nascimento"
                labelClassName={label}
                erro={errors.dataNascimento?.message}
              >
                <Input
                  inputMode="numeric"
                  autoComplete="bday"
                  placeholder="dd/mm/aaaa"
                  {...register('dataNascimento', {
                    onChange: (e) => (e.target.value = mascararData(e.target.value)),
                  })}
                />
              </Campo>
            </div>
            <Campo
              id="celular"
              label="Celular com DDD"
              labelClassName={label}
              erro={errors.celular?.message}
            >
              <Input
                type="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                {...register('celular', {
                  onChange: (e) => (e.target.value = mascararTelefone(e.target.value)),
                })}
              />
            </Campo>
          </>
        )}

        {etapa === 1 && (
          <>
            <Campo
              id="cep"
              label="CEP"
              labelClassName={label}
              erro={errors.cep?.message}
              dica={buscandoCep ? 'Buscando endereço…' : 'Preenchemos o endereço pelo CEP.'}
            >
              <Input
                inputMode="numeric"
                autoComplete="postal-code"
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
              labelClassName={label}
              erro={errors.endereco?.message}
            >
              <Input
                autoComplete="street-address"
                placeholder="Rua, número e bairro"
                {...register('endereco')}
              />
            </Campo>
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <Campo
                id="cidade"
                label="Cidade"
                labelClassName={label}
                erro={errors.cidade?.message}
              >
                <Input autoComplete="address-level2" {...register('cidade')} />
              </Campo>
              <Campo id="estado" label="UF" labelClassName={label} erro={errors.estado?.message}>
                <select
                  autoComplete="address-level1"
                  className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 aria-invalid:border-destructive"
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
            </div>
          </>
        )}

        {etapa === 2 && (
          <>
            <Campo
              id="email"
              label="Seu melhor e-mail"
              labelClassName={label}
              erro={errors.email?.message}
              dica="Se você já é cliente de outra funerária na Ampara, use a mesma senha."
            >
              <Input
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                {...register('email')}
              />
            </Campo>
            <Campo
              id="senha"
              label="Crie uma senha"
              labelClassName={label}
              erro={errors.senha?.message}
            >
              <PasswordInput
                autoComplete="new-password"
                placeholder="Escolha uma senha"
                {...register('senha')}
              />
            </Campo>
            <RegrasSenha senha={senha} />
            <Campo
              id="confirmacao"
              label="Confirme sua senha"
              labelClassName={label}
              erro={errors.confirmacao?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Digite a senha novamente"
                {...register('confirmacao')}
              />
            </Campo>
            <div className="flex flex-col gap-1">
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
                      onBlur={field.onBlur}
                      aria-invalid={errors.termos ? true : undefined}
                    />
                  )}
                />
                <Label
                  htmlFor="termos"
                  className="text-xs leading-relaxed font-normal text-muted-foreground"
                >
                  <span>
                    Li e concordo com os <strong className="text-foreground">Termos de Uso</strong>{' '}
                    e a <strong className="text-foreground">Política de Privacidade</strong> (LGPD).
                  </span>
                </Label>
              </div>
              {errors.termos && (
                <span className="text-[11px] text-destructive">{errors.termos.message}</span>
              )}
            </div>
          </>
        )}

        <div className="mt-1 flex gap-3">
          {etapa > 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setEtapa((atual) => atual - 1)}
            >
              <ArrowLeft /> Voltar
            </Button>
          )}
          {etapa < ETAPAS_CADASTRO.length - 1 ? (
            <Button type="button" className="h-11 flex-1" onClick={() => void avancar()}>
              Continuar <ArrowRight />
            </Button>
          ) : (
            <Button type="submit" className="h-11 flex-1" carregando={isSubmitting}>
              Criar meu perfil <ArrowRight />
            </Button>
          )}
        </div>
      </form>

      <Separator className="mt-7" />

      <div className="mt-6 flex flex-col items-center gap-1 text-xs">
        <span className="text-muted-foreground">Já possui uma conta?</span>
        <Link to="/entrar" className="font-semibold hover:underline">
          Entrar
        </Link>
      </div>
      <AuthAtendimento className="mt-6 text-[11px]" />
    </AuthSplitLayout>
  );
}

function Progresso({ etapa }: { etapa: number }) {
  return (
    <ol aria-label="Etapas do cadastro" className="mt-6 flex items-center gap-2">
      {ETAPAS_CADASTRO.map(({ titulo }, i) => (
        <li
          key={titulo}
          aria-current={i === etapa ? 'step' : undefined}
          className="flex flex-1 items-center gap-2"
        >
          <span
            className={cn(
              'grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold',
              i < etapa && 'bg-primary text-primary-foreground',
              i === etapa && 'border-2 border-primary text-primary',
              i > etapa && 'border border-input text-subtle-foreground',
            )}
          >
            {i < etapa ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}
          </span>
          <span
            className={cn('text-[11px]', i === etapa ? 'font-semibold' : 'text-muted-foreground')}
          >
            {titulo}
          </span>
          {i < ETAPAS_CADASTRO.length - 1 && <span className="h-px flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  );
}
