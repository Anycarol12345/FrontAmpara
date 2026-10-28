import { useObterContrato } from '@ampara/api-client';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import { EstadoConsulta } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { DetalheContrato } from '../../components/DetalheContrato';

/** Detalhe do contrato para a equipe (FE-ADM-03, GET /contratos/{id}). */
export function ContratoPainelPage() {
  const { id = '' } = useParams();
  const [parametros] = useSearchParams();
  const consulta = useObterContrato(id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/painel/contratos"
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Contratos
      </Link>
      <PageHeader
        sobretitulo={parametros.has('novo') ? 'Contrato criado' : 'Contrato'}
        titulo="Detalhes do contrato"
      />
      <EstadoConsulta consulta={consulta}>
        {(contrato) => <DetalheContrato contrato={contrato} />}
      </EstadoConsulta>
    </div>
  );
}
