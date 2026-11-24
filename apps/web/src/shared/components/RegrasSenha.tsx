import { cn } from '@ampara/ui/lib/utils';
import { Check, Circle } from 'lucide-react';
import { REGRAS_SENHA } from '../lib/validacao';

/** Mostra as regras da senha sendo cumpridas enquanto a pessoa digita (FE-PUB-02). */
export function RegrasSenha({ senha }: { senha: string }) {
  return (
    <ul aria-label="Regras da senha" className="grid grid-cols-2 gap-x-3 gap-y-1">
      {REGRAS_SENHA.map(({ rotulo, teste }) => {
        const ok = teste(senha);
        return (
          <li
            key={rotulo}
            className={cn(
              'flex items-center gap-1.5 text-[11px]',
              ok ? 'text-success-foreground' : 'text-subtle-foreground',
            )}
          >
            {ok ? (
              <Check className="size-3" strokeWidth={3} aria-hidden />
            ) : (
              <Circle className="size-2.5" aria-hidden />
            )}
            {rotulo}
            <span className="sr-only">{ok ? '(cumprida)' : '(pendente)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
