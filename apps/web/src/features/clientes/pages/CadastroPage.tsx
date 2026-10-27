import { Button } from '@ampara/ui/components/button';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { Input } from '@ampara/ui/components/input';
import { Label } from '@ampara/ui/components/label';
import { Separator } from '@ampara/ui/components/separator';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { AuthAtendimento, AuthSplitLayout } from '@/shared/components/AuthSplitLayout';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { Eyebrow } from '@/shared/components/Eyebrow';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { mascararCpf, mascararTelefone } from '@/shared/lib/mascaras';
import { cadastroSchema, type CadastroForm } from '../schemas/cadastro';

const CAMPOS = ['nome', 'email', 'cpf', 'celular', 'senha', 'confirmacao', 'termos'] as const;

/** Exemplo completo do padrão de formulários (FE-06): RHF + Zod, máscaras e erros da API nos campos. */
export function CadastroPage() {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CadastroForm>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: '',
      email: '',
      cpf: '',
      celular: '',
      senha: '',
      confirmacao: '',
      termos: false,
    },
  });

  async function criarPerfil() {
    try {
      // O endpoint de auto-cadastro do cliente ainda não existe no backend (FE-PUB-02).
      toast.info('O cadastro online fica disponível assim que a API de clientes estiver pronta.');
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  }

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

      <form onSubmit={handleSubmit(criarPerfil)} noValidate className="mt-6 flex flex-col gap-4">
        <ErroFormulario mensagem={errors.root?.servidor?.message} />

        <Campo
          id="nome"
          label="Como podemos chamar você?"
          labelClassName="text-xs"
          erro={errors.nome?.message}
        >
          <Input autoComplete="name" placeholder="Seu nome completo" {...register('nome')} />
        </Campo>
        <Campo
          id="email"
          label="Seu melhor e-mail"
          labelClassName="text-xs"
          erro={errors.email?.message}
        >
          <Input
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            {...register('email')}
          />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo id="cpf" label="CPF" labelClassName="text-xs" erro={errors.cpf?.message}>
            <Input
              inputMode="numeric"
              placeholder="000.000.000-00"
              {...register('cpf', {
                onChange: (e) => (e.target.value = mascararCpf(e.target.value)),
              })}
            />
          </Campo>
          <Campo
            id="celular"
            label="Celular com DDD"
            labelClassName="text-xs"
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
        </div>
        <Campo
          id="senha"
          label="Crie uma senha"
          labelClassName="text-xs"
          erro={errors.senha?.message}
          dica="Use pelo menos 8 caracteres, com maiúscula, minúscula, número e símbolo."
        >
          <PasswordInput
            autoComplete="new-password"
            placeholder="Escolha uma senha"
            {...register('senha')}
          />
        </Campo>
        <Campo
          id="confirmacao"
          label="Confirme sua senha"
          labelClassName="text-xs"
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
                Li e concordo com os <strong className="text-foreground">Termos de Uso</strong> e a{' '}
                <strong className="text-foreground">Política de Privacidade</strong>.
              </span>
            </Label>
          </div>
          {errors.termos && (
            <span className="text-[11px] text-destructive">{errors.termos.message}</span>
          )}
        </div>

        <Button type="submit" className="mt-1 h-11 w-full" carregando={isSubmitting}>
          Criar meu perfil <ArrowRight />
        </Button>
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
