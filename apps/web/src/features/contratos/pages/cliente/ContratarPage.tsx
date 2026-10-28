import { contratar, getMeusContratosQueryKey, useListarDependentes } from '@ampara/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { PageHeader } from '@/shared/components/PageHeader';
import { FluxoContratacao } from '../../components/FluxoContratacao';

/** Contratação de plano pelo cliente (FE-CLI-04, POST /contratos). */
export function ContratarPage() {
  const [parametros] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dependentes = useListarDependentes();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        sobretitulo="Contratar plano"
        titulo="Vamos cuidar disso juntos"
        descricao="Escolha com calma. Você revisa tudo antes de confirmar."
      />
      <FluxoContratacao
        idPlanoInicial={parametros.get('plano')}
        dependentes={dependentes}
        permitirIncluirDependente
        confirmar={async (dados) => {
          const contrato = await contratar(dados);
          await queryClient.invalidateQueries({ queryKey: getMeusContratosQueryKey() });
          return contrato;
        }}
        aoConcluir={(id) => void navigate(`/minha-conta/contratos/${id}?novo=1`, { replace: true })}
      />
    </div>
  );
}
