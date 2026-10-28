import { useObterContrato } from '@ampara/api-client';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { DetalheContrato } from '../../components/DetalheContrato';

/** Detalhe de um contrato do titular (FE-CLI-05, GET /contratos/{id}). */
export function ContratoClientePage() {
  const { id = '' } = useParams();
  const [parametros] = useSearchParams();
  const consulta = useObterContrato(id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/minha-conta/contratos"
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Meus contratos
      </Link>
      <PageHeader
        sobretitulo={parametros.has('novo') ? 'Contrato criado' : 'Contrato'}
        titulo={
          parametros.has('novo') ? 'Tudo certo com a sua contratação' : 'Detalhes do contrato'
        }
        descricao={
          parametros.has('novo')
            ? 'Guardamos seu contrato. Ele fica ativo com o pagamento da primeira cobrança.'
            : undefined
        }
      />
      <EstadoConsulta consulta={consulta}>
        {(contrato) => <DetalheContrato contrato={contrato} />}
      </EstadoConsulta>
    </div>
  );
}
