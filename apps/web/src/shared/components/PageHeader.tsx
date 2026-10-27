import type { ReactNode } from 'react';
import { Eyebrow } from './Eyebrow';

type PageHeaderProps = {
  sobretitulo: string;
  titulo: string;
  descricao?: string;
  /** Botões à direita do título. */
  acoes?: ReactNode;
};

/** Cabeçalho das páginas da área interna. */
export function PageHeader({ sobretitulo, titulo, descricao, acoes }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Eyebrow className="text-[10px] text-subtle-foreground">{sobretitulo}</Eyebrow>
        <h1 className="mt-2 text-[34px]/[1.15] font-bold tracking-tight">{titulo}</h1>
        {descricao && <p className="mt-1.5 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex items-center gap-3 pb-6">{acoes}</div>}
    </div>
  );
}
