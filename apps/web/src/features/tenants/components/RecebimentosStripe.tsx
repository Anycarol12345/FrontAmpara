import {
  ehApiError,
  useIniciarCadastroPagamentos,
  useObterContaPagamentos,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { ExternalLink } from 'lucide-react';
import { Carregando } from '@/shared/components/EstadoConsulta';

/**
 * Cadastro de recebimentos no Stripe (COB-05): o gestor informa CNPJ, conta bancária e sócios na
 * página do Stripe. Sem ele, a funerária não cobra os planos (FE-ADM-12).
 */
export function RecebimentosStripe() {
  const conta = useObterContaPagamentos({ query: { meta: { silenciarErro: true }, retry: false } });
  const iniciar = useIniciarCadastroPagamentos();
  const naoIniciado = ehApiError(conta.error) && conta.error.status === 404;

  const abrirStripe = () => {
    // O Stripe volta para cá ao terminar (retorno) ou quando o link expira (renovar).
    const voltar = `${window.location.origin}/painel/configuracoes?aba=cobranca`;
    iniciar.mutate(
      { data: { url_retorno: voltar, url_renovar: voltar } },
      { onSuccess: ({ url }) => window.location.assign(url) },
    );
  };

  if (conta.isPending) return <Carregando />;

  const situacao = conta.data?.cobrancas_habilitadas
    ? { rotulo: 'Recebendo pagamentos', variante: 'success' as const }
    : conta.data?.cadastro_enviado
      ? { rotulo: 'Em análise no Stripe', variante: 'warning' as const }
      : {
          rotulo: naoIniciado ? 'Não cadastrado' : 'Cadastro incompleto',
          variante: 'neutral' as const,
        };

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
      <div className="max-w-xl">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold">Recebimentos pelo Stripe</h2>
          <Badge variant={situacao.variante}>{situacao.rotulo}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {conta.data?.cobrancas_habilitadas
            ? 'As faturas dos clientes são cobradas e o dinheiro cai na conta da funerária.'
            : 'Informe o CNPJ, a conta bancária e os sócios na página segura do Stripe. Sem isso, os planos contratados não são cobrados.'}
        </p>
      </div>
      {!conta.data?.cobrancas_habilitadas && (
        <Button onClick={abrirStripe} disabled={iniciar.isPending}>
          <ExternalLink />
          {iniciar.isPending
            ? 'Abrindo o Stripe...'
            : naoIniciado
              ? 'Cadastrar no Stripe'
              : 'Continuar cadastro no Stripe'}
        </Button>
      )}
    </Card>
  );
}
