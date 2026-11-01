import {
  useBuscarClientes,
  useBuscarContratos,
  useObterClienteGestao,
  type ContratoResumoResponse,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Input } from '@ampara/ui/components/input';
import { FileText, Search, UsersRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { data, real } from '@/shared/lib/formatar';

const STATUS_CONTRATO: Record<
  string,
  { rotulo: string; variante: 'success' | 'warning' | 'info' | 'neutral' }
> = {
  ATIVO: { rotulo: 'Em dia', variante: 'success' },
  A_PAGAR: { rotulo: 'Aguardando pagamento', variante: 'info' },
  SUSPENSO: { rotulo: 'Suspenso', variante: 'warning' },
  CANCELADO: { rotulo: 'Cancelado', variante: 'neutral' },
};

const linha =
  'flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none';

/** Etapa 1 do registro do beneficiário: achar o contrato pelo CPF ou pelo nome do titular (FE-ADM-04). */
export function LocalizarContrato({
  aoEscolher,
}: {
  aoEscolher: (contrato: ContratoResumoResponse) => void;
}) {
  const [campo, setCampo] = useState('');
  const [busca, setBusca] = useState('');
  const [idCliente, setIdCliente] = useState<string | null>(null);

  const digitos = busca.replace(/\D/g, '');
  const porCpf = digitos.length === 11;
  const porNome = !porCpf && busca.trim().length >= 3;

  const clientes = useBuscarClientes(
    { nome: busca.trim(), tamanho: 8 },
    { query: { enabled: porNome } },
  );
  const cliente = useObterClienteGestao(idCliente ?? '', {
    query: { enabled: idCliente !== null },
  });

  const cpfDoTitular = porCpf ? digitos : (cliente.data?.cliente.cpf.replace(/\D/g, '') ?? null);
  const contratos = useBuscarContratos(
    { cpf: cpfDoTitular ?? '', tamanho: 20 },
    { query: { enabled: cpfDoTitular !== null } },
  );

  const buscar = (evento: FormEvent) => {
    evento.preventDefault();
    setIdCliente(null);
    setBusca(campo);
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={buscar} className="flex gap-3" role="search">
        <Input
          value={campo}
          onChange={(e) => setCampo(e.target.value)}
          placeholder="CPF ou nome do titular"
          aria-label="CPF ou nome do titular"
        />
        <Button type="submit">
          <Search /> Buscar
        </Button>
      </form>

      {busca !== '' && !porCpf && !porNome && (
        <p className="text-sm text-muted-foreground">
          Digite o CPF completo (11 números) ou ao menos 3 letras do nome.
        </p>
      )}

      {porNome && idCliente === null && (
        <EstadoConsulta
          consulta={clientes}
          estaVazio={(pagina) => pagina.itens.length === 0}
          vazio={
            <Vazio
              titulo="Nenhum cliente encontrado"
              descricao="Confira o nome ou busque pelo CPF."
            />
          }
        >
          {(pagina) => (
            <ul className="flex flex-col">
              {pagina.itens.map((c) => (
                <li key={c.id_cliente}>
                  <button
                    type="button"
                    className={linha}
                    onClick={() => setIdCliente(c.id_cliente ?? null)}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <UsersRound className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-bold">{c.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        CPF {c.cpf} · {c.email}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </EstadoConsulta>
      )}

      {cpfDoTitular !== null && (
        <section className="flex flex-col gap-2">
          {idCliente !== null && (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Contratos de {cliente.data?.cliente.nome}</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIdCliente(null)}>
                Trocar cliente
              </Button>
            </div>
          )}
          <EstadoConsulta
            consulta={contratos}
            estaVazio={(pagina) => pagina.itens.length === 0}
            vazio={
              <Vazio
                titulo="Nenhum contrato encontrado"
                descricao="Esse CPF não tem contrato nesta funerária."
              />
            }
          >
            {(pagina) => (
              <ul className="flex flex-col">
                {pagina.itens.map((c) => {
                  const status = STATUS_CONTRATO[c.status] ?? {
                    rotulo: c.status,
                    variante: 'neutral' as const,
                  };
                  return (
                    <li key={c.id_contrato}>
                      <button type="button" className={linha} onClick={() => aoEscolher(c)}>
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <FileText className="size-4" strokeWidth={1.75} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-sm font-bold">
                            {c.nome_plano} · {c.nome_titular}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {c.quantidade_pessoas}{' '}
                            {c.quantidade_pessoas === 1 ? 'pessoa' : 'pessoas'} ·{' '}
                            {real(c.valor_total)} · desde {data(c.data_contratacao)}
                          </span>
                        </span>
                        <Badge variant={status.variante}>{status.rotulo}</Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </EstadoConsulta>
        </section>
      )}
    </div>
  );
}
