import { useBuscarClientes, type ClienteResumoResponse } from '@ampara/api-client';
import { Card } from '@ampara/ui/components/card';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { EstadoConsulta, Vazio } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { CampoBusca, Paginacao, Tabela, type Coluna } from '@/shared/components/Tabela';
import { useAtraso } from '@/shared/hooks/useAtraso';
import { cpf, numero } from '@/shared/lib/formatar';
import { somenteDigitos } from '@/shared/lib/mascaras';

const TAMANHO = 20;

const COLUNAS: Coluna<ClienteResumoResponse>[] = [
  {
    titulo: 'Cliente',
    celula: (c) => (
      <span className="flex flex-col">
        <span className="font-semibold">{c.nome}</span>
        <span className="text-xs text-muted-foreground">{c.email}</span>
      </span>
    ),
  },
  { titulo: 'CPF', celula: (c) => cpf(c.cpf) },
  { titulo: 'Telefone', celula: (c) => c.telefone ?? '—' },
  {
    titulo: 'Cidade',
    celula: (c) => [c.cidade, c.estado].filter(Boolean).join(' - ') || '—',
  },
  {
    titulo: 'Dependentes',
    celula: (c) => numero(c.quantidade_dependentes),
    className: 'text-right',
  },
];

/** Clientes da funerária (FE-ADM-02, GET /gestao/clientes). */
export function ClientesPage() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const termo = useAtraso(busca.trim());
  // Só números (11 dígitos ou mais de 3) busca por CPF; o resto, pelo nome.
  const porCpf = /^[\d.\-\s]+$/.test(termo) && somenteDigitos(termo).length >= 3;
  const consulta = useBuscarClientes({
    ...(termo && (porCpf ? { cpf: somenteDigitos(termo) } : { nome: termo })),
    pagina,
    tamanho: TAMANHO,
    ordenarPor: 'nome',
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Atendimento"
        titulo="Clientes"
        descricao="Titulares cadastrados na funerária e seus dependentes."
      />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-base font-bold">Carteira de clientes</h2>
            <p className="text-xs text-muted-foreground">
              {consulta.data ? `${consulta.data.total} clientes` : 'Carregando…'}
            </p>
          </div>
          <CampoBusca
            valor={busca}
            aoMudar={(valor) => {
              setBusca(valor);
              setPagina(1);
            }}
            placeholder="Buscar por nome ou CPF"
          />
        </div>
        <EstadoConsulta
          consulta={consulta}
          estaVazio={(dados) => dados.itens.length === 0}
          vazio={<Vazio titulo={termo ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'} />}
        >
          {(dados) => (
            <>
              <Tabela
                colunas={COLUNAS}
                linhas={dados.itens}
                chave={(c) => c.id_cliente ?? c.cpf}
                aoClicar={(c) => c.id_cliente && void navigate(`/painel/clientes/${c.id_cliente}`)}
              />
              <Paginacao
                pagina={numero(dados.pagina)}
                tamanho={numero(dados.tamanho)}
                total={numero(dados.total)}
                aoMudar={setPagina}
              />
            </>
          )}
        </EstadoConsulta>
      </Card>
    </div>
  );
}
