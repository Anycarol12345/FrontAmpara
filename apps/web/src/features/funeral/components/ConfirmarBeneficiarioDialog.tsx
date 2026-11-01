import {
  ehApiError,
  useRegistrarBeneficiario,
  type BeneficiarioResponse,
  type ContratoResumoResponse,
  type ElegibilidadeResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@ampara/ui/components/dialog';
import { useState } from 'react';
import { ErroFormulario } from '@/shared/components/Campo';
import { data } from '@/shared/lib/formatar';
import type { FalecimentoValidado } from '../schemas/beneficiario';

type Props = {
  contrato: ContratoResumoResponse;
  pessoa: ElegibilidadeResponse;
  dados: FalecimentoValidado;
  aoCorrigir: () => void;
  aoRegistrar: (beneficiario: BeneficiarioResponse) => void;
};

/** Confirmação final do registro do beneficiário, com os dados preenchidos (FE-ADM-04, POST /beneficiarios). */
export function ConfirmarBeneficiarioDialog({
  contrato,
  pessoa,
  dados,
  aoCorrigir,
  aoRegistrar,
}: Props) {
  const registrar = useRegistrarBeneficiario();
  const [erro, setErro] = useState<string>();

  const confirmar = async () => {
    setErro(undefined);
    try {
      const beneficiario = await registrar.mutateAsync({
        data: {
          id_pessoa_coberta: pessoa.id_pessoa_coberta,
          data_falecimento: dados.data_falecimento,
          local_falecimento: dados.local_falecimento,
          responsavel: {
            nome: dados.responsavel_nome,
            telefone: dados.responsavel_telefone,
            parentesco: dados.responsavel_parentesco,
          },
        },
      });
      aoRegistrar(beneficiario);
    } catch (e) {
      setErro(ehApiError(e) ? e.message : 'Não foi possível registrar agora. Tente novamente.');
    }
  };

  const linhas: [string, string][] = [
    ['Falecido(a)', `${pessoa.nome} (${pessoa.tipo === 'TITULAR' ? 'titular' : 'dependente'})`],
    ['Contrato', `${contrato.nome_plano} · ${contrato.nome_titular}`],
    ['Data do falecimento', data(dados.data_falecimento)],
    ['Local', dados.local_falecimento],
    [
      'Responsável',
      `${dados.responsavel_nome} (${dados.responsavel_parentesco}) · ${dados.responsavel_telefone}`,
    ],
  ];

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && !registrar.isPending && aoCorrigir()}>
      <DialogContent>
        <DialogTitle>Confirmar o registro</DialogTitle>
        <DialogDescription>Confira os dados antes de registrar o falecimento.</DialogDescription>

        <dl className="mt-6 flex flex-col gap-3 rounded-lg bg-muted/60 p-4 text-sm">
          {linhas.map(([rotulo, valor]) => (
            <div key={rotulo} className="flex justify-between gap-6">
              <dt className="shrink-0 text-muted-foreground">{rotulo}</dt>
              <dd className="text-right font-semibold">{valor}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <ErroFormulario mensagem={erro} />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={aoCorrigir} disabled={registrar.isPending}>
            Corrigir
          </Button>
          <Button type="button" onClick={confirmar} carregando={registrar.isPending}>
            Confirmar registro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
