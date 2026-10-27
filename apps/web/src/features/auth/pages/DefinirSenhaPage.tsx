import { definirSenha, redefinirSenha } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Input } from '@ampara/ui/components/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { z } from 'zod';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { PasswordInput } from '@/shared/components/PasswordInput';
import { RegrasSenha } from '@/shared/components/RegrasSenha';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { esquemas } from '@/shared/lib/validacao';
import { Aviso, LayoutAcesso } from '../components/LayoutAcesso';

const schema = z
  .object({ senha: esquemas.senha, confirmacao: z.string().min(1, 'Confirme sua senha.') })
  .refine((d) => d.senha === d.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não conferem.',
  });
type Form = z.infer<typeof schema>;

const TEXTOS = {
  // Link do "esqueci minha senha".
  redefinir: {
    sobretitulo: 'Recuperar acesso',
    titulo: 'Crie uma senha nova',
    descricao:
      'Escolha uma senha que você não usa em outros sites. As sessões abertas serão encerradas.',
    sucesso: 'Senha alterada',
  },
  // Convite do gestor, da equipe e dos parceiros.
  definir: {
    sobretitulo: 'Primeiro acesso',
    titulo: 'Defina sua senha',
    descricao: 'Você foi convidado para a Ampara. Crie sua senha para entrar no painel.',
    sucesso: 'Senha criada',
  },
};

/** Redefinição de senha e definição no primeiro acesso, com o token do link (FE-PUB-03, AUT-05). */
export function DefinirSenhaPage({ modo }: { modo: 'redefinir' | 'definir' }) {
  const [parametros] = useSearchParams();
  const token = parametros.get('token');
  const [concluido, setConcluido] = useState(false);
  const textos = TEXTOS[modo];

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { senha: '', confirmacao: '' },
  });
  const senha = useWatch({ control, name: 'senha' });

  const enviar = handleSubmit(async ({ senha: novaSenha }) => {
    if (!token) return;
    try {
      const chamar = modo === 'redefinir' ? redefinirSenha : definirSenha;
      await chamar({ token, senha: novaSenha });
      setConcluido(true);
    } catch (erro) {
      // O token vencido ou já usado volta como erro de validação do campo "token".
      if (!aplicarErrosDaApi(erro, setError, ['senha'])) throw erro;
    }
  });

  return (
    <LayoutAcesso
      sobretitulo={textos.sobretitulo}
      titulo={textos.titulo}
      descricao={textos.descricao}
    >
      {!token ? (
        <Aviso tipo="erro" titulo="Link incompleto">
          Abra o link exatamente como chegou no e-mail.{' '}
          {modo === 'redefinir' && (
            <Link to="/recuperar-senha" className="underline">
              Pedir um link novo
            </Link>
          )}
        </Aviso>
      ) : concluido ? (
        <div className="flex flex-col gap-5">
          <Aviso tipo="sucesso" titulo={textos.sucesso}>
            Agora é só entrar com o seu e-mail e a senha nova.
          </Aviso>
          <Button asChild className="h-11 w-full">
            <Link to={modo === 'definir' ? '/equipe/entrar' : '/entrar'}>
              Entrar <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <ErroFormulario mensagem={errors.root?.servidor?.message} />
          <Campo
            id="senha"
            label="Senha nova"
            labelClassName="text-xs"
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
            label="Confirme a senha"
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
          <Button type="submit" className="mt-1 h-11 w-full" carregando={isSubmitting}>
            Salvar senha <ArrowRight />
          </Button>
          {modo === 'redefinir' && (
            <Link
              to="/recuperar-senha"
              className="text-center text-xs text-muted-foreground hover:underline"
            >
              O link expirou? Peça outro
            </Link>
          )}
        </form>
      )}
    </LayoutAcesso>
  );
}

export const RedefinirSenhaPage = () => <DefinirSenhaPage modo="redefinir" />;
export const PrimeiroAcessoPage = () => <DefinirSenhaPage modo="definir" />;
