import {
  ehApiError,
  getMeusContratosQueryKey,
  getObterContratoQueryKey,
  useCancelarContrato,
  useIncluirDependenteContrato,
  useListarDependentes,
  useRemoverDependenteContrato,
  type ContratoDetalheResponse,
  type DependenteResponse,
  type PessoaCobertaDetalheResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { toast } from '@ampara/ui/components/sonner';
import { UserPlus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ErroFormulario } from '@/shared/components/Campo';
import { numero } from '@/shared/lib/formatar';
import { DetalheContrato } from './DetalheContrato';

type Acao =
  | { tipo: 'incluir'; dependente: DependenteResponse }
  | { tipo: 'remover'; pessoa: PessoaCobertaDetalheResponse }
  | { tipo: 'cancelar' };

const MOTIVOS = [
  'O valor ficou alto para mim',
  'Vou me mudar de cidade',
  'Contratei outro plano',
  'Outro motivo',
] as const;

/**
 * Contrato do titular com as ações do FE-CLI-05: incluir e remover dependentes (CON-02)
 * e cancelar com motivo (CON-03). O backend valida limite do plano, beneficiário e funeral em andamento.
 */
export function GerenciarContrato({ contrato }: { contrato: ContratoDetalheResponse }) {
  const dependentes = useListarDependentes();
  const [acao, setAcao] = useState<Acao | null>(null);
  const ativo = contrato.status !== 'CANCELADO';
  const cobertos = new Set(contrato.pessoas_cobertas.map((p) => p.id_dependente));
  const foraDoContrato = (dependentes.data ?? []).filter((d) => !cobertos.has(d.id_dependente));

  return (
    <div className="flex flex-col gap-5">
      <DetalheContrato
        contrato={contrato}
        aoRemoverDependente={ativo ? (pessoa) => setAcao({ tipo: 'remover', pessoa }) : undefined}
      />

      {ativo && (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Card className="p-6">
            <h3 className="text-base font-bold">Incluir pessoa protegida</h3>
            <p className="text-xs text-muted-foreground">
              Quem entra agora cumpre a carência a partir de hoje. O novo valor vale a partir da
              próxima fatura.
            </p>
            {foraDoContrato.length === 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Todas as suas pessoas cadastradas já estão neste contrato.{' '}
                <Link to="/minha-conta/dependentes" className="font-semibold">
                  Cadastrar outra pessoa
                </Link>
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border/70">
                {foraDoContrato.map((d) => (
                  <li key={d.id_dependente} className="flex items-center gap-4 py-3">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold">{d.nome}</span>
                      <span className="text-[11px] text-subtle-foreground">{d.parentesco}</span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAcao({ tipo: 'incluir', dependente: d })}
                    >
                      <UserPlus /> Incluir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="self-start p-6">
            <h3 className="text-sm font-bold">Cancelar contrato</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              As próximas cobranças deixam de existir e as pessoas perdem a cobertura.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full text-destructive"
              onClick={() => setAcao({ tipo: 'cancelar' })}
            >
              Cancelar contrato
            </Button>
          </Card>
        </div>
      )}

      {acao?.tipo === 'incluir' && (
        <IncluirDialog
          contrato={contrato}
          dependente={acao.dependente}
          aoFechar={() => setAcao(null)}
        />
      )}
      {acao?.tipo === 'remover' && (
        <RemoverDialog contrato={contrato} pessoa={acao.pessoa} aoFechar={() => setAcao(null)} />
      )}
      {acao?.tipo === 'cancelar' && (
        <CancelarDialog contrato={contrato} aoFechar={() => setAcao(null)} />
      )}
    </div>
  );
}

const invalida = (idContrato: string) => ({
  meta: {
    silenciarErro: true,
    invalida: [getObterContratoQueryKey(idContrato), getMeusContratosQueryKey()],
  },
});

const mensagemDeErro = (e: unknown) =>
  ehApiError(e) ? e.message : 'Não foi possível concluir agora. Tente novamente.';

function IncluirDialog({
  contrato,
  dependente,
  aoFechar,
}: {
  contrato: ContratoDetalheResponse;
  dependente: DependenteResponse;
  aoFechar: () => void;
}) {
  const incluir = useIncluirDependenteContrato({ mutation: invalida(contrato.id_contrato) });
  const [erro, setErro] = useState<string>();

  async function confirmar() {
    try {
      await incluir.mutateAsync({
        id: contrato.id_contrato,
        data: { id_dependente: dependente.id_dependente },
      });
      toast.success(`${dependente.nome} agora faz parte do contrato.`);
      aoFechar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }

  return (
    <Confirmacao
      titulo={`Incluir ${dependente.nome}?`}
      descricao={`A cobertura começa depois da carência de ${numero(contrato.carencia_dias)} dias, contada a partir de hoje. O valor do contrato aumenta a partir da próxima fatura.`}
      erro={erro}
      ocupado={incluir.isPending}
      aoFechar={aoFechar}
      botao={
        <Button onClick={() => void confirmar()} carregando={incluir.isPending}>
          Incluir no contrato
        </Button>
      }
    />
  );
}

function RemoverDialog({
  contrato,
  pessoa,
  aoFechar,
}: {
  contrato: ContratoDetalheResponse;
  pessoa: PessoaCobertaDetalheResponse;
  aoFechar: () => void;
}) {
  const remover = useRemoverDependenteContrato({ mutation: invalida(contrato.id_contrato) });
  const [erro, setErro] = useState<string>();

  async function confirmar() {
    try {
      await remover.mutateAsync({
        id: contrato.id_contrato,
        idDependente: pessoa.id_dependente ?? '',
      });
      toast.success(`${pessoa.nome} saiu do contrato.`);
      aoFechar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }

  return (
    <Confirmacao
      titulo={`Remover ${pessoa.nome} do contrato?`}
      descricao="A pessoa deixa de ter cobertura e o valor diminui a partir da próxima fatura. Se incluir de novo depois, a carência recomeça a contar."
      erro={erro}
      ocupado={remover.isPending}
      aoFechar={aoFechar}
      botao={
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() => void confirmar()}
          carregando={remover.isPending}
        >
          Remover do contrato
        </Button>
      }
    />
  );
}

function CancelarDialog({
  contrato,
  aoFechar,
}: {
  contrato: ContratoDetalheResponse;
  aoFechar: () => void;
}) {
  const cancelar = useCancelarContrato({ mutation: invalida(contrato.id_contrato) });
  const [motivo, setMotivo] = useState<string>('');
  const [detalhe, setDetalhe] = useState('');
  const [erro, setErro] = useState<string>();
  const outro = motivo === 'Outro motivo';
  const texto = outro ? detalhe.trim() : motivo;

  async function confirmar() {
    if (!texto) {
      setErro(outro ? 'Conte o motivo em poucas palavras.' : 'Escolha um motivo.');
      return;
    }
    try {
      await cancelar.mutateAsync({ id: contrato.id_contrato, data: { motivo: texto } });
      toast.success('Contrato cancelado.');
      aoFechar();
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }

  return (
    <Confirmacao
      titulo={`Cancelar o plano ${contrato.nome_plano}?`}
      descricao="As próximas cobranças são canceladas e as pessoas perdem a cobertura. Faturas em atraso continuam em aberto. Esta ação não pode ser desfeita."
      erro={erro}
      ocupado={cancelar.isPending}
      aoFechar={aoFechar}
      botao={
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() => void confirmar()}
          carregando={cancelar.isPending}
        >
          Cancelar contrato
        </Button>
      }
    >
      <fieldset className="mt-5 flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Por que você quer cancelar?</legend>
        {MOTIVOS.map((m) => (
          <label key={m} className="flex items-center gap-2.5 text-sm">
            <input
              type="radio"
              name="motivo"
              checked={motivo === m}
              onChange={() => setMotivo(m)}
              className="size-4 accent-primary"
            />
            {m}
          </label>
        ))}
        {outro && (
          <textarea
            aria-label="Conte o motivo"
            rows={3}
            value={detalhe}
            onChange={(e) => setDetalhe(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
          />
        )}
      </fieldset>
    </Confirmacao>
  );
}

function Confirmacao({
  titulo,
  descricao,
  erro,
  ocupado,
  aoFechar,
  botao,
  children,
}: {
  titulo: string;
  descricao: string;
  erro?: string;
  ocupado: boolean;
  aoFechar: () => void;
  botao: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(aberto) => !aberto && !ocupado && aoFechar()}>
      <DialogContent>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogDescription>{descricao}</DialogDescription>
        {children}
        <div className="mt-4">
          <ErroFormulario mensagem={erro} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={aoFechar} disabled={ocupado}>
            Voltar
          </Button>
          {botao}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
