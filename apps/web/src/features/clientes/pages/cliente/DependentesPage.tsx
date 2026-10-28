import {
  getListarDependentesQueryKey,
  useListarDependentes,
  useRemoverDependente,
  type DependenteResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { toast } from '@ampara/ui/components/sonner';
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { cpf, data } from '@/shared/lib/formatar';
import { DependenteDialog } from '../../components/DependenteDialog';

/** Pessoas protegidas do titular (FE-CLI-03). */
export function DependentesPage() {
  const consulta = useListarDependentes();
  const [editando, setEditando] = useState<DependenteResponse | null | undefined>(undefined);
  const [removendo, setRemovendo] = useState<DependenteResponse | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo="Pessoas protegidas"
        descricao="Cadastre quem você ama para incluir nos seus planos."
        acoes={
          <Button onClick={() => setEditando(null)}>
            <Plus /> Incluir dependente
          </Button>
        }
      />

      <EstadoConsulta
        consulta={consulta}
        estaVazio={(lista) => lista.length === 0}
        vazio={
          <Card>
            <Vazio
              titulo="Nenhum dependente cadastrado"
              descricao="Inclua cônjuge, filhos, pais e outras pessoas da família."
              acao={
                <Button size="sm" onClick={() => setEditando(null)}>
                  <Plus /> Incluir dependente
                </Button>
              }
            />
          </Card>
        }
      >
        {(dependentes) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dependentes.map((dependente) => (
              <Card key={dependente.id_dependente} className="flex flex-col p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-brand-800">
                    <UserRound className="size-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{dependente.nome}</p>
                    <p className="text-xs text-muted-foreground">{dependente.parentesco}</p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">CPF</dt>
                    <dd className="mt-0.5 font-semibold">{cpf(dependente.cpf)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Nascimento</dt>
                    <dd className="mt-0.5 font-semibold">{data(dependente.data_nascimento)}</dd>
                  </div>
                </dl>
                <div className="mt-5 flex gap-2 border-t border-border/70 pt-4">
                  <Button size="sm" variant="ghost" onClick={() => setEditando(dependente)}>
                    <Pencil /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setRemovendo(dependente)}
                  >
                    <Trash2 /> Remover
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </EstadoConsulta>

      <DependenteDialog
        aberto={editando !== undefined}
        dependente={editando}
        aoFechar={() => setEditando(undefined)}
      />
      <ConfirmarRemocao dependente={removendo} aoFechar={() => setRemovendo(null)} />
    </div>
  );
}

/** Confirmação antes de remover: a ação não pode ser desfeita. */
function ConfirmarRemocao({
  dependente,
  aoFechar,
}: {
  dependente: DependenteResponse | null;
  aoFechar: () => void;
}) {
  const remover = useRemoverDependente({
    mutation: { meta: { invalida: [getListarDependentesQueryKey()] } },
  });

  async function confirmar() {
    if (!dependente) return;
    // "Dependente vinculado a contrato ativo não pode ser removido." aparece no toast.
    await remover.mutateAsync({ id: dependente.id_dependente });
    toast.success('Dependente removido.');
    aoFechar();
  }

  return (
    <Dialog open={dependente !== null} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Remover {dependente?.nome}?</DialogTitle>
        <DialogDescription>
          A pessoa deixa de aparecer nos seus dependentes. Se ela estiver em um contrato ativo, a
          remoção não será permitida.
        </DialogDescription>
        <DialogFooter>
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            className="bg-destructive hover:bg-destructive/90"
            carregando={remover.isPending}
            onClick={() => void confirmar().catch(() => undefined)}
          >
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
