import { useObterContrato } from '@ampara/api-client';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ProximaFatura } from '@/features/financeiro';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { GerenciarContrato } from '../../components/GerenciarContrato';

/**
 * Detalhe de um contrato do titular (FE-CLI-05, GET /contratos/{id}).
 * Logo depois de contratar, é aqui que a pessoa paga a primeira cobrança (FE-CLI-04):
 * o pagamento é feito na página do Stripe, pelo link da fatura (COB-01).
 */
export function ContratoClientePage() {
  const { id = '' } = useParams();
  const [parametros] = useSearchParams();
  const consulta = useObterContrato(id);
  const novo = parametros.has('novo');

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/minha-conta/contratos"
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Meus contratos
      </Link>
      <PageHeader
        sobretitulo={novo ? 'Contrato criado' : 'Contrato'}
        titulo={novo ? 'Tudo certo com a sua contratação' : 'Detalhes do contrato'}
        descricao={
          novo
            ? 'Falta só pagar a primeira cobrança: o plano fica ativo assim que o pagamento for confirmado.'
            : undefined
        }
      />
      <EstadoConsulta consulta={consulta}>
        {(contrato) => (
          <>
            {contrato.status === 'A_PAGAR' && (
              <ProximaFatura idContrato={contrato.id_contrato} plano={contrato.nome_plano} />
            )}
            <GerenciarContrato contrato={contrato} />
          </>
        )}
      </EstadoConsulta>
    </div>
  );
}
