import { Label } from '@ampara/ui/components/label';
import { cn } from '@ampara/ui/lib/utils';
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

type CampoProps = {
  id: string;
  label: string;
  erro?: string | undefined;
  dica?: string;
  className?: string;
  labelClassName?: string;
  /** O input do campo. Recebe id, aria-invalid e aria-describedby automaticamente. */
  children: ReactNode;
};

/** Label, input e mensagem de erro de um campo de formulário (FE-06). */
export function Campo({ id, label, erro, dica, className, labelClassName, children }: CampoProps) {
  const idMensagem = `${id}-mensagem`;
  const temMensagem = Boolean(erro || dica);

  const controle = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-invalid': erro ? true : undefined,
        'aria-describedby': temMensagem ? idMensagem : undefined,
      })
    : children;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {controle}
      {temMensagem && (
        <span
          id={idMensagem}
          className={cn('text-[11px]', erro ? 'text-destructive' : 'text-subtle-foreground')}
        >
          {erro ?? dica}
        </span>
      )}
    </div>
  );
}

/** Erro geral do formulário (ex.: "E-mail ou senha inválidos."). */
export function ErroFormulario({ mensagem }: { mensagem: string | undefined }) {
  if (!mensagem) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive"
    >
      {mensagem}
    </p>
  );
}
