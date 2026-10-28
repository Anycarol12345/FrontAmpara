import { Button } from '@ampara/ui/components/button';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { Input } from '@ampara/ui/components/input';
import { Label } from '@ampara/ui/components/label';
import { Separator } from '@ampara/ui/components/separator';
import { ArrowRight } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Link } from 'react-router';
import { AuthSplitLayout } from '@/shared/components/AuthSplitLayout';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { Eyebrow } from '@/shared/components/Eyebrow';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { useFormularioLogin } from '../hooks/useFormularioLogin';

// Usuários da funerária de demonstração criados pelo seed do backend (INF-16).
const PERFIS_DEMO = [
  {
    nome: 'Funcionário',
    descricao: 'Atendimentos, agenda e documentos',
    email: 'funcionario@demo.localhost',
  },
  {
    nome: 'Consultor',
    descricao: 'Oportunidades, propostas e metas',
    email: 'consultor@demo.localhost',
  },
  {
    nome: 'Administrador',
    descricao: 'Equipe, relatórios e fornecedores',
    email: 'gestor@demo.localhost',
  },
];

export function LoginEquipePage() {
  const { formulario, enviar } = useFormularioLogin(false);
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = formulario;

  return (
    <AuthSplitLayout
      variante="equipe"
      sobretitulo="Portal da equipe"
      titulo={
        <>
          Cada pessoa, <em className="font-light text-brand-300">no seu painel</em>
        </>
      }
      descricao="Entre com seu e-mail corporativo e acesse o painel do seu perfil: funcionário, consultor ou administrador."
      itens={[
        'Atendimentos, agenda e documentos num só lugar',
        'Cada perfil vê apenas o que precisa',
        'Ambiente seguro e restrito à equipe',
      ]}
    >
      <Eyebrow>Portal da equipe</Eyebrow>
      <h2 className="mt-3 text-[44px]/[1.15] font-bold tracking-tight">Bem-vindo de volta</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Use seu e-mail corporativo da Ampara. Você entra direto no painel do seu perfil.
      </p>

      <form onSubmit={enviar} noValidate className="mt-7 flex flex-col gap-5">
        <ErroFormulario mensagem={errors.root?.servidor?.message} />
        <Campo id="email" label="E-mail corporativo" erro={errors.email?.message}>
          <Input
            type="email"
            autoComplete="username"
            placeholder="nome@ampara.com.br"
            className="h-12 rounded-xl"
            {...register('email')}
          />
        </Campo>
        <Campo id="senha" label="Senha" erro={errors.senha?.message}>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Digite sua senha"
            className="h-12 rounded-xl"
            {...register('senha')}
          />
        </Campo>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="lembrar"
              render={({ field }) => (
                <Checkbox
                  id="lembrar"
                  checked={field.value}
                  onCheckedChange={(marcado) => field.onChange(marcado === true)}
                />
              )}
            />
            <Label htmlFor="lembrar" className="font-normal text-muted-foreground">
              Lembrar de mim
            </Label>
          </div>
          <Link to="/recuperar-senha" className="text-xs font-semibold hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <Button
          type="submit"
          variant="brand"
          size="lg"
          className="mt-1 w-full"
          carregando={isSubmitting}
        >
          Entrar no portal <ArrowRight />
        </Button>
      </form>

      <Separator className="mt-9" />

      <Eyebrow className="mt-6">Acesso de demonstração</Eyebrow>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Escolha um perfil para preencher o e-mail da funerária de demonstração e informe a senha
        definida no backend.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {PERFIS_DEMO.map((perfil) => (
          <button
            key={perfil.nome}
            type="button"
            onClick={() => setValue('email', perfil.email, { shouldValidate: true })}
            className="rounded-xl border border-border/70 bg-card p-4 text-left transition-colors hover:border-ring/40"
          >
            <span className="block text-sm font-bold">{perfil.nome}</span>
            <span className="mt-1.5 block text-xs leading-snug text-subtle-foreground">
              {perfil.descricao}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-subtle-foreground">
        Portal interno Ampara · Ambiente seguro e restrito à equipe
      </p>
    </AuthSplitLayout>
  );
}
