import type { ReactNode } from 'react';
import { AuthAtendimento, AuthSplitLayout } from '@/shared/components/AuthSplitLayout';
import { Eyebrow } from '@/shared/components/Eyebrow';

type LayoutAcessoProps = {
  sobretitulo: string;
  titulo: string;
  descricao: string;
  children: ReactNode;
};

/** Telas de senha e confirmação de e-mail (FE-PUB-03), no mesmo visual do login do cliente. */
export function LayoutAcesso({ sobretitulo, titulo, descricao, children }: LayoutAcessoProps) {
  return (
    <AuthSplitLayout
      variante="cliente"
      sobretitulo="Seu espaço de cuidado"
      titulo={
        <>
          Estamos aqui <em>com você</em>
        </>
      }
      descricao="Sua conta protege seus dados e os da sua família. Se precisar, nossa equipe ajuda em qualquer etapa."
      itens={[
        'Links de acesso valem uma única vez',
        'Senhas protegidas e nunca compartilhadas',
        'Atendimento humano a qualquer hora',
      ]}
    >
      <Eyebrow>{sobretitulo}</Eyebrow>
      <h2 className="mt-3 font-serif text-4xl leading-tight">{titulo}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{descricao}</p>
      <div className="mt-7">{children}</div>
      <AuthAtendimento className="mt-8 text-[11px]" />
    </AuthSplitLayout>
  );
}

/** Mensagem de resultado (sucesso ou falha) no lugar do formulário. */
export function Aviso({
  tipo,
  titulo,
  children,
}: {
  tipo: 'sucesso' | 'erro';
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={
        tipo === 'sucesso'
          ? 'rounded-xl bg-success px-4 py-4 text-success-foreground'
          : 'rounded-xl bg-destructive/10 px-4 py-4 text-destructive'
      }
    >
      <p className="text-sm font-semibold">{titulo}</p>
      {children && <div className="mt-1 text-xs leading-relaxed">{children}</div>}
    </div>
  );
}
