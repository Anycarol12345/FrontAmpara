import { Button } from '@ampara/ui/components/button';
import { cn } from '@ampara/ui/lib/utils';
import { CircleAlert, Inbox, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type BlocoProps = { className?: string };

export function Carregando({
  className,
  texto = 'Carregando...',
}: BlocoProps & { texto?: string }) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground',
        className,
      )}
    >
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
      {texto}
    </div>
  );
}

export function Vazio({
  className,
  titulo,
  descricao,
  acao,
}: BlocoProps & { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className={cn('flex flex-col items-center py-12 text-center', className)}>
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-5" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-sm font-semibold">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

export function Erro({
  className,
  mensagem,
  aoTentarNovamente,
}: BlocoProps & { mensagem: string; aoTentarNovamente?: () => void }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center py-12 text-center', className)}>
      <span className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert className="size-5" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-sm font-semibold">Não foi possível carregar</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{mensagem}</p>
      {aoTentarNovamente && (
        <Button variant="outline" size="sm" className="mt-4" onClick={aoTentarNovamente}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

type ConsultaProps<T> = {
  consulta: {
    data: T | undefined;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => unknown;
  };
  /** Considera a resposta vazia (ex.: lista sem itens). */
  estaVazio?: (dados: T) => boolean;
  vazio?: ReactNode;
  children: (dados: T) => ReactNode;
};

/** Mostra carregando, erro ou vazio conforme o estado da consulta, e o conteúdo quando houver dados. */
export function EstadoConsulta<T>({ consulta, estaVazio, vazio, children }: ConsultaProps<T>) {
  if (consulta.isPending) return <Carregando />;
  if (consulta.isError || consulta.data === undefined) {
    return (
      <Erro
        mensagem={consulta.error?.message ?? 'Tente novamente em instantes.'}
        aoTentarNovamente={() => void consulta.refetch()}
      />
    );
  }
  if (estaVazio?.(consulta.data)) return <>{vazio ?? <Vazio titulo="Nada por aqui ainda" />}</>;
  return <>{children(consulta.data)}</>;
}
