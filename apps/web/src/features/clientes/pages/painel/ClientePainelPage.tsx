import { useObterClienteGestao } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { ArrowLeft, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { cpf, data } from '@/shared/lib/formatar';

/**
 * Ficha do cliente para a equipe (FE-ADM-02, GET /gestao/clientes/{id}).
 * `contratos` vem do app/ (feature contratos), que conhece as duas features.
 */
export function ClientePainelPage({ contratos }: { contratos?: (cpf: string) => ReactNode }) {
  const { id = '' } = useParams();
  const consulta = useObterClienteGestao(id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/painel/clientes"
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Clientes
      </Link>
      <EstadoConsulta consulta={consulta}>
        {({ cliente, dependentes }) => (
          <>
            <PageHeader
              sobretitulo="Cliente"
              titulo={cliente.nome}
              descricao={cliente.email}
              acoes={
                <Button asChild>
                  <Link to={`/painel/clientes/${id}/contratar`}>
                    <Plus /> Nova contratação
                  </Link>
                </Button>
              }
            />
            <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
              <Card className="self-start p-6">
                <h2 className="text-sm font-bold">Dados do titular</h2>
                <dl className="mt-4 flex flex-col gap-3 text-sm">
                  {[
                    ['CPF', cpf(cliente.cpf)],
                    ['Nascimento', data(cliente.data_nascimento)],
                    ['Telefone', cliente.telefone ?? '—'],
                    [
                      'Endereço',
                      [cliente.endereco, cliente.cidade, cliente.estado]
                        .filter(Boolean)
                        .join(', ') || '—',
                    ],
                    ['CEP', cliente.cep ?? '—'],
                  ].map(([rotulo, valor]) => (
                    <div key={rotulo}>
                      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
                      <dd className="mt-0.5 font-semibold">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              <div className="flex flex-col gap-5">
                <Card className="p-6">
                  <h2 className="text-sm font-bold">Dependentes ({dependentes.length})</h2>
                  {dependentes.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Nenhum dependente cadastrado.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-border/70">
                      {dependentes.map((d) => (
                        <li
                          key={d.id_dependente}
                          className="flex justify-between gap-4 py-3 text-sm"
                        >
                          <span>
                            <span className="font-semibold">{d.nome}</span>
                            <span className="text-muted-foreground"> · {d.parentesco}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {cpf(d.cpf)} · {data(d.data_nascimento)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                {contratos?.(cliente.cpf)}
              </div>
            </div>
          </>
        )}
      </EstadoConsulta>
    </div>
  );
}
