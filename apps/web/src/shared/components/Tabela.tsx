import { Button } from '@ampara/ui/components/button';
import { cn } from '@ampara/ui/lib/utils';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { ReactNode } from 'react';

export type Coluna<T> = {
  titulo: string;
  celula: (linha: T) => ReactNode;
  className?: string;
};

/** Tabela simples das telas da área interna, no visual do protótipo (Equipe, Fornecedores). */
export function Tabela<T>({
  colunas,
  linhas,
  chave,
  aoClicar,
}: {
  colunas: Coluna<T>[];
  linhas: T[];
  chave: (linha: T) => string;
  aoClicar?: (linha: T) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border/70">
            {colunas.map((coluna) => (
              <th
                key={coluna.titulo}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-subtle-foreground uppercase',
                  coluna.className,
                )}
              >
                {coluna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr
              key={chave(linha)}
              onClick={aoClicar ? () => aoClicar(linha) : undefined}
              className={cn(
                'border-b border-border/50 last:border-0',
                aoClicar && 'cursor-pointer transition-colors hover:bg-muted/40',
              )}
            >
              {colunas.map((coluna) => (
                <td key={coluna.titulo} className={cn('px-4 py-3.5', coluna.className)}>
                  {coluna.celula(linha)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Navegação entre páginas das listagens paginadas (INF-17: pagina, tamanho, total). */
export function Paginacao({
  pagina,
  tamanho,
  total,
  aoMudar,
}: {
  pagina: number;
  tamanho: number;
  total: number;
  aoMudar: (pagina: number) => void;
}) {
  const ultima = Math.max(1, Math.ceil(total / tamanho));
  if (total <= tamanho) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
      <span>
        Página {pagina} de {ultima} · {total} registros
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pagina <= 1}
          onClick={() => aoMudar(pagina - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft />
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pagina >= ultima}
          onClick={() => aoMudar(pagina + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

/** Campo de busca das listagens. */
export function CampoBusca({
  valor,
  aoMudar,
  placeholder,
}: {
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block w-full max-w-xs">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle-foreground" />
      <input
        type="search"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-border/70 bg-[#f4f7fb] pr-4 pl-10 text-sm outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
      />
    </label>
  );
}

/** Filtros em pílulas (ex.: Todos, Ativos, Inativos). */
export function Filtros<T extends string>({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  aoMudar: (valor: T) => void;
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-1.5">
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          role="radio"
          aria-checked={valor === opcao.valor}
          onClick={() => aoMudar(opcao.valor)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
            valor === opcao.valor
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
