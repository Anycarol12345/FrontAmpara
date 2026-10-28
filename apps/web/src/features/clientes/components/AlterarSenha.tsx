import { useAlterarSenha } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { RegrasSenha } from '@/shared/components/RegrasSenha';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { alterarSenhaSchema, type AlterarSenhaForm } from '../schemas/alterarSenha';

const CAMPOS = ['senha_atual', 'nova_senha', 'confirmacao'] as const;

/** Alteração de senha do titular (FE-CLI-02, PUT /auth/senha). */
export function AlterarSenha() {
  const alterar = useAlterarSenha({ mutation: { meta: { silenciarErro: true } } });
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AlterarSenhaForm>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: { senha_atual: '', nova_senha: '', confirmacao: '' },
  });
  const novaSenha = useWatch({ control, name: 'nova_senha' });

  const enviar = handleSubmit(async ({ senha_atual, nova_senha }) => {
    try {
      await alterar.mutateAsync({ data: { senha_atual, nova_senha } });
      reset();
      toast.success('Senha alterada.');
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, CAMPOS)) throw erro;
    }
  });

  return (
    <Card className="p-7">
      <h2 className="text-sm font-bold">Alterar senha</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Use uma senha que você não usa em outros sites.
      </p>
      <form onSubmit={enviar} noValidate className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
        </div>
        <Campo id="senha_atual" label="Senha atual" erro={errors.senha_atual?.message}>
          <PasswordInput autoComplete="current-password" {...register('senha_atual')} />
        </Campo>
        <Campo id="nova_senha" label="Nova senha" erro={errors.nova_senha?.message}>
          <PasswordInput autoComplete="new-password" {...register('nova_senha')} />
        </Campo>
        <Campo id="confirmacao" label="Repita a nova senha" erro={errors.confirmacao?.message}>
          <PasswordInput autoComplete="new-password" {...register('confirmacao')} />
        </Campo>
        <div className="sm:col-span-3">
          <RegrasSenha senha={novaSenha} />
        </div>
        <div className="flex justify-end sm:col-span-3">
          <Button type="submit" variant="outline" carregando={isSubmitting}>
            Alterar senha
          </Button>
        </div>
      </form>
    </Card>
  );
}
