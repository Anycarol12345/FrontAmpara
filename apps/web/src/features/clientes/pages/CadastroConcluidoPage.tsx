import { Button } from '@ampara/ui/components/button';
import { ArrowRight, MailCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { AuthAtendimento, AuthSplitLayout } from '@/shared/components/AuthSplitLayout';
import { Eyebrow } from '@/shared/components/Eyebrow';

/** Depois do cadastro: pede a confirmação do e-mail (FE-PUB-02). */
export function CadastroConcluidoPage() {
  const [parametros] = useSearchParams();
  const email = parametros.get('email');

  return (
    <AuthSplitLayout
      variante="cliente"
      sobretitulo="Seu espaço Ampara"
      titulo={
        <>
          Que bom ter você <em>aqui</em>
        </>
      }
      descricao="Seu perfil foi criado. Falta só um passo para deixar tudo seguro."
      itens={['Perfil criado', 'Confirme seu e-mail', 'Entre e acompanhe seu plano']}
    >
      <span className="grid size-12 place-items-center rounded-full bg-success text-success-foreground">
        <MailCheck className="size-6" strokeWidth={1.75} />
      </span>
      <Eyebrow className="mt-6">Perfil criado</Eyebrow>
      <h2 className="mt-3 font-serif text-4xl leading-tight">Confirme seu e-mail</h2>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        Enviamos um link de confirmação para{' '}
        {email ? <strong className="text-foreground">{email}</strong> : 'o seu e-mail'}. Abra a
        mensagem e toque no link para ativar sua conta. Se não encontrar, confira a caixa de spam.
      </p>
      <Button asChild className="mt-7 h-11 w-full">
        <Link to="/entrar">
          Ir para o login <ArrowRight />
        </Link>
      </Button>
      <AuthAtendimento className="mt-8 text-[11px]" />
    </AuthSplitLayout>
  );
}
