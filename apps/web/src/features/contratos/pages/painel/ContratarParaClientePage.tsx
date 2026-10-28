import {
  contratarParaCliente,
  getBuscarContratosQueryKey,
  useObterClienteGestao,
} from '@ampara/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { PageHeader } from '@/shared/components/PageHeader';
import { FluxoContratacao } from '../../components/FluxoContratacao';

/** A equipe contrata um plano para o cliente (FE-ADM-03, POST /gestao/contratos). */
export function ContratarParaClientePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cliente = useObterClienteGestao(id);
  // O fluxo usa só a lista de dependentes da ficha do cliente.
  const dependentes = { ...cliente, data: cliente.data?.dependentes };

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/painel/clientes/${id}`}
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {cliente.data?.cliente.nome ?? 'Cliente'}
      </Link>
      <PageHeader
        sobretitulo="Nova contratação"
        titulo={cliente.data ? `Plano para ${cliente.data.cliente.nome}` : 'Nova contratação'}
        descricao="Os dependentes são os já cadastrados pelo cliente."
      />
      <FluxoContratacao
        dependentes={dependentes}
        permitirIncluirDependente={false}
        confirmar={async (dados) => {
          const contrato = await contratarParaCliente({ ...dados, id_cliente: id });
          await queryClient.invalidateQueries({ queryKey: getBuscarContratosQueryKey() });
          return contrato;
        }}
        aoConcluir={(idContrato) =>
          void navigate(`/painel/contratos/${idContrato}?novo=1`, { replace: true })
        }
      />
    </div>
  );
}
