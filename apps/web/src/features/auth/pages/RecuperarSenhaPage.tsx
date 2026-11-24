import { esqueciSenha } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Input } from '@ampara/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { esquemas } from '@/shared/lib/validacao';
import { Aviso, LayoutAcesso } from '../components/LayoutAcesso';

const schema = z.object({ email: esquemas.email });
type Form = z.infer<typeof schema>;

/** "Esqueci minha senha": pede o link de redefinição por e-mail (FE-PUB-03, AUT-05). */
export function RecuperarSenhaPage() {
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const enviar = handleSubmit(async ({ email }) => {
    try {
      await esqueciSenha({ email });
      setEnviadoPara(email);
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, ['email'])) throw erro;
    }
  });

  return (
    <LayoutAcesso
      sobretitulo="Recuperar acesso"
      titulo="Esqueceu sua senha?"
      descricao="Informe o e-mail da sua conta. Enviaremos um link para você criar uma senha nova."
    >
      {enviadoPara ? (
        // A API responde igual exista ou não a conta, para não revelar quais e-mails estão cadastrados.
        <Aviso tipo="sucesso" titulo="Confira seu e-mail">
          Se houver uma conta para <strong>{enviadoPara}</strong>, você vai receber o link em alguns
          minutos. Ele vale por pouco tempo e só pode ser usado uma vez.
        </Aviso>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
          <Campo id="email" label="E-mail" labelClassName="text-xs" erro={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              {...register('email')}
            />
          </Campo>
          <Button type="submit" className="h-11 w-full" carregando={isSubmitting}>
            Enviar link <ArrowRight />
          </Button>
        </form>
      )}
      <div className="mt-6 text-center">
        <Link to="/entrar" className="text-xs font-semibold hover:underline">
          Voltar para o login
        </Link>
      </div>
    </LayoutAcesso>
  );
}
