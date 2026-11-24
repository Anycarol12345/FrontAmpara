import {
  getGestaoListarPlanosQueryKey,
  useAlterarStatusPlano,
  useGestaoListarPlanos,
  type PlanoResumoResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { toast } from '@ampara/ui/components/sonner';
import { ListChecks, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { Tabela, type Coluna } from '@/shared/components/Tabela';
import { numero, real } from '@/shared/lib/formatar';
import { CoberturasDialog } from '../../components/CoberturasDialog';
import { PlanoDialog } from '../../components/PlanoDialog';

/** Planos da funerária (FE-ADM-10, /gestao/planos). */
export function PlanosPage() {
  const consulta = useGestaoListarPlanos();
  const [editando, setEditando] = useState<string | null | undefined>(undefined);
  const [coberturas, setCoberturas] = useState<string | null>(null);
  const alterarStatus = useAlterarStatusPlano({
    mutation: { meta: { invalida: [getGestaoListarPlanosQueryKey()] } },
  });

  const colunas: Coluna<PlanoResumoResponse>[] = [
    {
      titulo: 'Plano',
      celula: (p) => (
        <span className="flex flex-col">
          <span className="font-semibold">{p.nome}</span>
          {p.descricao && <span className="text-xs text-muted-foreground">{p.descricao}</span>}
        </span>
      ),
    },
    { titulo: 'Mensal', celula: (p) => real(p.valor_mensal) },
    { titulo: 'Anual', celula: (p) => real(p.valor_anual) },
    { titulo: 'Dependente/mês', celula: (p) => real(p.valor_dependente_mensal) },
    { titulo: 'Carência', celula: (p) => `${numero(p.carencia_dias)} dias` },
    {
      titulo: 'Status',
      celula: (p) => (
        <Badge variant={p.ativo ? 'success' : 'neutral'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>
      ),
    },
    {
      titulo: 'Ações',
      className: 'text-right',
      celula: (p) => (
        <span className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditando(p.id_plano!)}>
            <Pencil /> Editar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCoberturas(p.id_plano!)}>
            <ListChecks /> Coberturas
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              alterarStatus.mutate(
                { id: p.id_plano!, data: { ativo: !p.ativo } },
                {
                  onSuccess: () =>
                    toast.success(
                      p.ativo ? 'Plano desativado.' : 'Plano ativado: já aparece na landing.',
                    ),
                },
              )
            }
          >
            {p.ativo ? 'Desativar' : 'Ativar'}
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Administração"
        titulo="Planos"
        descricao="Valores, regras e coberturas dos planos que a funerária oferece."
        acoes={
          <Button onClick={() => setEditando(null)}>
            <Plus /> Novo plano
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <EstadoConsulta
          consulta={consulta}
          estaVazio={(lista) => lista.length === 0}
          vazio={<Vazio titulo="Nenhum plano cadastrado" />}
        >
          {(lista) => (
            <Tabela
              colunas={colunas}
              linhas={[...lista].sort((a, b) => numero(a.valor_mensal) - numero(b.valor_mensal))}
              chave={(p) => p.id_plano!}
            />
          )}
        </EstadoConsulta>
      </Card>
      <PlanoDialog
        idPlano={editando ?? null}
        aberto={editando !== undefined}
        aoFechar={() => setEditando(undefined)}
      />
      <CoberturasDialog idPlano={coberturas} aoFechar={() => setCoberturas(null)} />
    </div>
  );
}
