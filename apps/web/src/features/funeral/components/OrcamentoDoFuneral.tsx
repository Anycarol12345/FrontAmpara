import {
  ehApiError,
  getObterOrcamentoFuneralQueryKey,
  useAprovarOrcamentoFuneral,
  useGerarOrcamentoFuneral,
  useItensFuneral,
  useObterBeneficiario,
  useObterOrcamentoFuneral,
  type FuneralResponse,
  type OrcamentoResponse,
  type StatusOrcamento,
} from '@ampara/api-client';
import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { Input } from '@ampara/ui/components/input';
import { toast } from '@ampara/ui/components/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Campo, ErroFormulario } from '@/shared/components/Campo';
import { Vazio } from '@/shared/components/EstadoConsulta';
import { dataHora, real } from '@/shared/lib/formatar';
import { aplicarErrosDaApi } from '@/shared/lib/formularios';
import { aprovacaoSchema, type AprovacaoForm, type AprovacaoValidada } from '../schemas/orcamento';

const STATUS_ORCAMENTO: Record<
  StatusOrcamento,
  { rotulo: string; variante: 'success' | 'warning' | 'info' | 'neutral' }
> = {
  PENDENTE: { rotulo: 'Aguardando aprovação', variante: 'warning' },
  APROVADO: { rotulo: 'Aprovado', variante: 'success' },
  SUBSTITUIDO: { rotulo: 'Substituído', variante: 'neutral' },
  CANCELADO: { rotulo: 'Cancelado', variante: 'neutral' },
};

type Props = { funeral: FuneralResponse; somenteLeitura: boolean };

/** Gerar e aprovar o orçamento dos itens adicionais (FE-ADM-05, FUN-04). */
export function OrcamentoDoFuneral({ funeral, somenteLeitura }: Props) {
  const id = funeral.id_funeral;
  const orcamento = useObterOrcamentoFuneral(id, { query: { retry: false } });
  const itens = useItensFuneral(id);
  const gerar = useGerarOrcamentoFuneral({
    mutation: { meta: { invalida: [getObterOrcamentoFuneralQueryKey(id)] } },
  });
  const [aprovando, setAprovando] = useState(false);

  const dados = orcamento.data;
  const semOrcamento =
    orcamento.isError && ehApiError(orcamento.error) && orcamento.error.status === 404;
  const totalAdicional = itens.data?.total_adicional ?? 0;
  const podeGerar = !somenteLeitura && dados?.status !== 'APROVADO';

  const gerarOrcamento = async () => {
    try {
      await gerar.mutateAsync({ id });
      toast.success('Orçamento gerado.');
    } catch {
      // O aviso de erro já aparece na tela.
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Orçamento</h2>
          <p className="text-[11px] text-subtle-foreground">
            Cobrança dos itens adicionais, aprovada por quem responde pela família
          </p>
        </div>
        {dados && (
          <Badge variant={STATUS_ORCAMENTO[dados.status].variante}>
            {STATUS_ORCAMENTO[dados.status].rotulo}
          </Badge>
        )}
      </div>

      {orcamento.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
      ) : orcamento.isError && !semOrcamento ? (
        <p className="mt-4 text-sm text-destructive">Não foi possível carregar o orçamento.</p>
      ) : dados ? (
        <Detalhe orcamento={dados} />
      ) : (
        <Vazio
          titulo="Nenhum orçamento gerado"
          descricao={
            totalAdicional > 0
              ? 'Gere o orçamento para a família aprovar os itens adicionais.'
              : 'Não há itens adicionais para cobrar.'
          }
        />
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        {podeGerar && (
          <Button
            type="button"
            variant="outline"
            disabled={totalAdicional === 0}
            carregando={gerar.isPending}
            onClick={gerarOrcamento}
          >
            {dados ? 'Gerar novamente' : 'Gerar orçamento'}
          </Button>
        )}
        {!somenteLeitura && dados?.status === 'PENDENTE' && (
          <Button type="button" onClick={() => setAprovando(true)}>
            Aprovar orçamento
          </Button>
        )}
        {!somenteLeitura && dados?.status === 'APROVADO' && dados.fatura_pendente && (
          <Button type="button" onClick={() => setAprovando(true)}>
            Tentar emitir a fatura
          </Button>
        )}
      </div>

      {aprovando && dados && (
        <AprovarOrcamentoDialog
          funeral={funeral}
          orcamento={dados}
          aoFechar={() => setAprovando(false)}
        />
      )}
    </Card>
  );
}

function Detalhe({ orcamento }: { orcamento: OrcamentoResponse }) {
  return (
    <div className="mt-4">
      <ul>
        {orcamento.itens.map((item) => (
          <li
            key={item.id_funeral_item}
            className="flex items-center justify-between gap-4 border-b border-border/60 py-3 text-sm last:border-b-0"
          >
            <span className="flex flex-col">
              <span className="font-bold">
                {item.nome}
                {item.variacao ? ` · ${item.variacao}` : ''}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.quantidade} × {real(item.preco_unitario)}
                {item.somente_diferenca_variacao ? ' · só a diferença da variação' : ''}
              </span>
            </span>
            <span className="font-semibold">{real(item.subtotal)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between border-t border-border/60 pt-3 text-sm font-bold">
        <span>Total</span>
        <span>{real(orcamento.total)}</span>
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Gerado em {dataHora(orcamento.gerado_em)}
      </p>

      {orcamento.status === 'APROVADO' && (
        <div className="mt-4 rounded-lg bg-muted/60 p-4 text-sm">
          <p>
            Aprovado por <strong>{orcamento.aprovado_por}</strong>
            {orcamento.aprovado_em ? ` em ${dataHora(orcamento.aprovado_em)}` : ''}.
          </p>
          {orcamento.fatura_pendente ? (
            <p className="mt-2 text-muted-foreground">
              A fatura ainda não foi emitida: a funerária pode não ter a conta de pagamentos
              configurada. Aprovar de novo tenta emitir outra vez.
            </p>
          ) : (
            orcamento.link_pagamento && (
              <a
                href={orcamento.link_pagamento}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-semibold hover:underline"
              >
                Abrir a página de pagamento
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}

function AprovarOrcamentoDialog({
  funeral,
  orcamento,
  aoFechar,
}: {
  funeral: FuneralResponse;
  orcamento: OrcamentoResponse;
  aoFechar: () => void;
}) {
  const beneficiario = useObterBeneficiario(funeral.id_beneficiario);
  const nomeSugerido = orcamento.aprovado_por ?? beneficiario.data?.responsavel.nome ?? '';

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent>
        <DialogTitle>
          {orcamento.fatura_pendente ? 'Emitir a fatura' : 'Aprovar o orçamento'}
        </DialogTitle>
        <DialogDescription>
          A família paga {real(orcamento.total)} pelos itens adicionais. Registre quem aprovou.
        </DialogDescription>
        <Formulario
          key={nomeSugerido}
          funeral={funeral}
          orcamento={orcamento}
          nomeSugerido={nomeSugerido}
          aoConcluir={aoFechar}
          aoCancelar={aoFechar}
        />
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  funeral,
  orcamento,
  nomeSugerido,
  aoConcluir,
  aoCancelar,
}: {
  funeral: FuneralResponse;
  orcamento: OrcamentoResponse;
  nomeSugerido: string;
  aoConcluir: () => void;
  aoCancelar: () => void;
}) {
  const aprovar = useAprovarOrcamentoFuneral({
    mutation: { meta: { invalida: [getObterOrcamentoFuneralQueryKey(funeral.id_funeral)] } },
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AprovacaoForm, unknown, AprovacaoValidada>({
    resolver: zodResolver(aprovacaoSchema),
    defaultValues: { nome_responsavel: nomeSugerido },
  });

  const enviar = handleSubmit(async (dados) => {
    try {
      await aprovar.mutateAsync({
        id: funeral.id_funeral,
        data: { id_orcamento: orcamento.id_orcamento, nome_responsavel: dados.nome_responsavel },
      });
      toast.success('Orçamento aprovado.');
      aoConcluir();
    } catch (erro) {
      if (!aplicarErrosDaApi(erro, setError, ['nome_responsavel'])) throw erro;
    }
  });

  return (
    <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
      <ErroFormulario mensagem={errors.root?.servidor?.message} />
      <Campo
        id="aprovacao-nome"
        label="Quem da família aprovou"
        erro={errors.nome_responsavel?.message}
      >
        <Input autoComplete="off" {...register('nome_responsavel')} />
      </Campo>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={aoCancelar}>
          Voltar
        </Button>
        <Button type="submit" carregando={isSubmitting}>
          Confirmar aprovação
        </Button>
      </DialogFooter>
    </form>
  );
}
