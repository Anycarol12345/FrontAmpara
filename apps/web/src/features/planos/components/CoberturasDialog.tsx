import {
  getGestaoObterPlanoQueryKey,
  useDefinirCoberturasPlano,
  useGestaoObterPlano,
  useListarCatalogoGestao,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Checkbox } from '@ampara/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { useState } from 'react';
import { Carregando, Vazio } from '@/shared/components/EstadoConsulta';
import { numero, real } from '@/shared/lib/formatar';

/** O que o plano cobre, a partir do catálogo (FE-ADM-10, PUT /gestao/planos/{id}/coberturas). */
export function CoberturasDialog({
  idPlano,
  aoFechar,
}: {
  idPlano: string | null;
  aoFechar: () => void;
}) {
  const aberto = idPlano !== null;
  const plano = useGestaoObterPlano(idPlano ?? '', { query: { enabled: aberto } });
  const catalogo = useListarCatalogoGestao(undefined, { query: { enabled: aberto } });

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent className="max-w-xl">
        <DialogTitle>Coberturas {plano.data ? `do ${plano.data.nome}` : ''}</DialogTitle>
        <DialogDescription>
          Escolha os itens do catálogo incluídos no plano e a quantidade de cada um.
        </DialogDescription>
        {!plano.data || !catalogo.data ? (
          <Carregando />
        ) : catalogo.data.length === 0 ? (
          <Vazio
            titulo="O catálogo está vazio"
            descricao="Cadastre os itens em Catálogo para incluí-los nos planos."
          />
        ) : (
          <Lista
            key={idPlano}
            idPlano={idPlano!}
            itens={catalogo.data.filter((i) => i.ativo)}
            iniciais={Object.fromEntries(
              plano.data.coberturas.map((c) => [c.id_item_catalogo, numero(c.quantidade)]),
            )}
            aoConcluir={aoFechar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Lista({
  idPlano,
  itens,
  iniciais,
  aoConcluir,
}: {
  idPlano: string;
  itens: { id_item: string; nome: string; preco: number | string }[];
  iniciais: Record<string, number>;
  aoConcluir: () => void;
}) {
  const [quantidades, setQuantidades] = useState<Record<string, number>>(iniciais);
  const definir = useDefinirCoberturasPlano({
    mutation: { meta: { invalida: [getGestaoObterPlanoQueryKey(idPlano)] } },
  });

  async function salvar() {
    await definir.mutateAsync({
      id: idPlano,
      data: {
        coberturas: Object.entries(quantidades).map(([id, quantidade]) => ({
          id_item_catalogo: id,
          quantidade,
          km_translado_incluso: null,
        })),
      },
    });
    toast.success('Coberturas salvas.');
    aoConcluir();
  }

  return (
    <>
      <ul className="mt-5 flex max-h-[50svh] flex-col divide-y divide-border/70 overflow-y-auto">
        {itens.map((item) => {
          const id = `cob-${item.id_item}`;
          const marcado = item.id_item in quantidades;
          return (
            <li key={item.id_item} className="flex items-center gap-3 py-3">
              <Checkbox
                id={id}
                checked={marcado}
                onCheckedChange={(valor) =>
                  setQuantidades((atual) => {
                    const novo = { ...atual };
                    if (valor === true) novo[item.id_item] = 1;
                    else delete novo[item.id_item];
                    return novo;
                  })
                }
              />
              <label htmlFor={id} className="flex flex-1 flex-col text-sm">
                <span className="font-semibold">{item.nome}</span>
                <span className="text-xs text-muted-foreground">{real(item.preco)}</span>
              </label>
              {marcado && (
                <Input
                  aria-label={`Quantidade de ${item.nome}`}
                  type="number"
                  min="1"
                  className="h-9 w-20"
                  value={quantidades[item.id_item]}
                  onChange={(e) =>
                    setQuantidades((atual) => ({
                      ...atual,
                      [item.id_item]: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
      <DialogFooter>
        <Button variant="ghost" onClick={aoConcluir}>
          Cancelar
        </Button>
        <Button carregando={definir.isPending} onClick={() => void salvar().catch(() => undefined)}>
          Salvar coberturas
        </Button>
      </DialogFooter>
    </>
  );
}
