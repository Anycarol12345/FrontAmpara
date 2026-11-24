import { Button } from '@ampara/ui/components/button';
import { Checkbox } from '@ampara/ui/components/checkbox';
import { Input } from '@ampara/ui/components/input';
import { Label } from '@ampara/ui/components/label';
import { Separator } from '@ampara/ui/components/separator';
import { ArrowRight } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Link } from 'react-router';
import { AuthAtendimento, AuthSplitLayout } from '@/shared/components/AuthSplitLayout';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { Eyebrow } from '@/shared/components/Eyebrow';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { useFormularioLogin } from '../hooks/useFormularioLogin';

export function LoginClientePage() {
  const { formulario, enviar } = useFormularioLogin(true);
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = formulario;

  return (
    <AuthSplitLayout
      variante="cliente"
      sobretitulo="Seu espaço de cuidado"
      titulo={
        <>
          Tudo o que você precisa, <em>com calma</em>
        </>
      }
      descricao="Acesse sua área para cuidar de cada detalhe, no seu tempo e com a nossa equipe ao seu lado."
      itens={[
        'Acompanhe seu plano e seus pagamentos',
        'Consulte e baixe seus documentos',
        'Fale com nossa equipe a qualquer hora',
      ]}
    >
      <Eyebrow>Área do cliente</Eyebrow>
      <h2 className="mt-3 font-serif text-4xl leading-tight">Que bom ter você aqui</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Acesse seu espaço para acompanhar seu plano, consultar documentos e falar com a Ampara.
      </p>

      <form onSubmit={enviar} noValidate className="mt-7 flex flex-col gap-4">
        <ErroFormulario mensagem={errors.root?.servidor?.message} />
        {/* O protótipo prevê "E-mail ou CPF"; por enquanto o backend aceita só o e-mail (AUT-02). */}
        <Campo
          id="email"
          label="E-mail ou CPF"
          labelClassName="text-xs"
          erro={errors.email?.message}
        >
          <Input
            type="email"
            autoComplete="username"
            placeholder="voce@email.com"
            {...register('email')}
          />
        </Campo>
        <Campo id="senha" label="Senha" labelClassName="text-xs" erro={errors.senha?.message}>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Digite sua senha"
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
            <Label htmlFor="lembrar" className="text-xs font-normal text-muted-foreground">
              Lembrar de mim
            </Label>
          </div>
          <Link to="/recuperar-senha" className="text-xs font-semibold hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" className="mt-1 h-11 w-full" carregando={isSubmitting}>
          Entrar na minha conta <ArrowRight />
        </Button>
      </form>

      <Separator className="mt-7" />

      <div className="mt-6 flex flex-col items-center gap-1 text-xs">
        <span className="text-muted-foreground">Ainda não possui uma conta?</span>
        <Link to="/cadastro" className="font-semibold hover:underline">
          Criar meu perfil
        </Link>
      </div>
      <p className="mt-6 text-center text-[11px] leading-relaxed text-subtle-foreground">
        Ao entrar, você concorda com os Termos de Uso e a Política de Privacidade.
      </p>
      <AuthAtendimento className="mt-1 text-[11px]" />
      <div className="mt-6 text-center">
        <Link to="/equipe/entrar" className="text-xs font-semibold hover:underline">
          Acesso da equipe
        </Link>
        {/* Atalho de desenvolvimento: todas as telas sem login (src/mocks/demo). */}
        {import.meta.env.DEV && (
          <Link
            to="/demo"
            className="mt-2 block text-[11px] text-subtle-foreground hover:underline"
          >
            Ver todas as telas sem login (demonstração)
          </Link>
        )}
      </div>
    </AuthSplitLayout>
  );
}
