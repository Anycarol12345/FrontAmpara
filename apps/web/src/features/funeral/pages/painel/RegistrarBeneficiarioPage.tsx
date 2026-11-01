import type { ContratoResumoResponse, ElegibilidadeResponse } from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { toast } from '@ampara/ui/components/sonner';
import { cn } from '@ampara/ui/lib/utils';
import { ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmarBeneficiarioDialog } from '../../components/ConfirmarBeneficiarioDialog';
import { DadosDoFalecimento } from '../../components/DadosDoFalecimento';
import { LocalizarContrato } from '../../components/LocalizarContrato';
import { PessoasCobertas } from '../../components/PessoasCobertas';
import type { FalecimentoValidado } from '../../schemas/beneficiario';

const ETAPAS = ['Contrato', 'Pessoa coberta', 'Dados do falecimento'] as const;

/** Depois do registro, a equipe segue para o registro do funeral (tela do próximo card). */
const rotaDoRegistroDoFuneral = (idBeneficiario: string) =>
  `/painel/funerais/novo?beneficiario=${idBeneficiario}`;

/** Registrar beneficiário (falecido) em etapas: contrato, pessoa coberta, dados e confirmação (FE-ADM-04). */
export function RegistrarBeneficiarioPage() {
  const navegar = useNavigate();
  const [etapa, setEtapa] = useState(0);
  const [contrato, setContrato] = useState<ContratoResumoResponse | null>(null);
  const [pessoa, setPessoa] = useState<ElegibilidadeResponse | null>(null);
  const [dados, setDados] = useState<FalecimentoValidado | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/painel"
        className="inline-flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Visão geral
      </Link>
      <PageHeader
        sobretitulo="Atendimento"
        titulo="Registrar falecimento"
        descricao="Localize o contrato, escolha a pessoa coberta e informe os dados do falecimento."
      />
      <Progresso etapa={etapa} />

      <Card className="p-6">
        {etapa === 0 && (
          <LocalizarContrato
            aoEscolher={(escolhido) => {
              if (escolhido.id_contrato !== contrato?.id_contrato) {
                setPessoa(null);
                setDados(null);
              }
              setContrato(escolhido);
              setEtapa(1);
            }}
          />
        )}

        {etapa === 1 && contrato && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              Contrato <strong className="text-foreground">{contrato.nome_plano}</strong> de{' '}
              <strong className="text-foreground">{contrato.nome_titular}</strong>. Quem faleceu?
            </p>
            <PessoasCobertas
              idContrato={contrato.id_contrato}
              selecionada={pessoa?.id_pessoa_coberta ?? null}
              aoSelecionar={setPessoa}
            />
            <div className="flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setEtapa(0)}>
                Trocar contrato
              </Button>
              <Button type="button" disabled={!pessoa} onClick={() => setEtapa(2)}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {etapa === 2 && pessoa && (
          <DadosDoFalecimento
            pessoa={pessoa}
            valores={dados}
            aoVoltar={() => setEtapa(1)}
            aoContinuar={(informados) => {
              setDados(informados);
              setConfirmando(true);
            }}
          />
        )}
      </Card>

      {confirmando && contrato && pessoa && dados && (
        <ConfirmarBeneficiarioDialog
          contrato={contrato}
          pessoa={pessoa}
          dados={dados}
          aoCorrigir={() => setConfirmando(false)}
          aoRegistrar={(beneficiario) => {
            toast.success('Falecimento registrado.');
            navegar(rotaDoRegistroDoFuneral(beneficiario.id_beneficiario));
          }}
        />
      )}
    </div>
  );
}

function Progresso({ etapa }: { etapa: number }) {
  return (
    <ol aria-label="Etapas do registro" className="flex max-w-xl items-center gap-2">
      {ETAPAS.map((titulo, i) => (
        <li
          key={titulo}
          aria-current={i === etapa ? 'step' : undefined}
          className="flex flex-1 items-center gap-2 last:flex-none"
        >
          <span
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold',
              i < etapa && 'bg-primary text-primary-foreground',
              i === etapa && 'border-2 border-primary text-primary',
              i > etapa && 'border border-input text-subtle-foreground',
            )}
          >
            {i < etapa ? <Check className="size-3" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cn('text-xs', i === etapa ? 'font-semibold' : 'text-muted-foreground')}>
            {titulo}
          </span>
          {i < ETAPAS.length - 1 && <span className="h-px flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  );
}
