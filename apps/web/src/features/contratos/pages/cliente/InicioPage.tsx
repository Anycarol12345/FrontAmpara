import {
  useIdentidadeVisual,
  useListarDependentes,
  useMeusContratos,
  useObterContrato,
  type ContratoResumoResponse,
} from '@ampara/api-client';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { FileText, Phone, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth';
import { ProximaFatura } from '@/features/financeiro';
import { AtendimentoEmAndamento } from '@/features/funeral';
import { Carregando } from '@/shared/components/EstadoConsulta';
import { PageHeader } from '@/shared/components/PageHeader';
import { numero, real } from '@/shared/lib/formatar';
import { COBERTURA, PERIODICIDADE, STATUS_CONTRATO } from '../../components/rotulos';

// Ordem de importância para escolher o contrato mostrado no cartão principal.
const PRIORIDADE = ['ATIVO', 'A_PAGAR', 'SUSPENSO', 'CANCELADO'];

/** Início da área do cliente (FE-CLI-01). */
export function InicioPage() {
  const { usuario } = useAuth();
  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';
  const contratos = useMeusContratos();
  const dependentes = useListarDependentes();
  const funeraria = useIdentidadeVisual({ query: { meta: { silenciarErro: true } } });

  const visual = funeraria.data?.identidade_visual;
  const telefone = visual?.telefone ?? null;
  const whatsapp = visual?.whatsapp ?? null;
  const principal = [...(contratos.data ?? [])].sort(
    (a, b) => PRIORIDADE.indexOf(a.status) - PRIORIDADE.indexOf(b.status),
  )[0];
  const totalDependentes = dependentes.data?.length;

  const atalhos: {
    titulo: string;
    descricao: string;
    resumo: string;
    para: string;
    icone: LucideIcon;
  }[] = [
    {
      titulo: 'Meus contratos',
      descricao: 'Seus planos, valores e quem está protegido em cada um.',
      resumo: contratos.data ? `${contratos.data.length} contrato(s)` : '…',
      para: '/minha-conta/contratos',
      icone: FileText,
    },
    {
      titulo: 'Pagamentos',
      descricao: 'Veja datas, valores e comprovantes anteriores.',
      resumo: 'Ver faturas',
      para: '/minha-conta/faturas',
      icone: Wallet,
    },
    {
      titulo: 'Pessoas protegidas',
      descricao: 'Cadastre quem você ama para incluir nos planos.',
      resumo: totalDependentes === undefined ? '…' : `${totalDependentes} pessoa(s)`,
      para: '/minha-conta/dependentes',
      icone: ShieldCheck,
    },
    {
      titulo: 'Meus dados',
      descricao: 'Atualize seus contatos e endereço.',
      resumo: 'Ver e editar',
      para: '/minha-conta/dados',
      icone: Phone,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo={`Olá, ${primeiroNome}`}
        descricao="Acompanhe seu plano e encontre ajuda quando precisar."
        acoes={
          whatsapp ? (
            <Button asChild>
              <a
                href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                <Phone /> Falar pelo WhatsApp
              </a>
            </Button>
          ) : undefined
        }
      />

      <AtendimentoEmAndamento />

      <div className="mt-1 grid gap-5 lg:grid-cols-[1fr_355px]">
        {contratos.isPending ? (
          <Card>
            <Carregando />
          </Card>
        ) : principal ? (
          <CartaoPlano contrato={principal} />
        ) : (
          <SemPlano />
        )}
        <Card className="flex flex-col p-7">
          <Phone className="size-4 text-brand-800" strokeWidth={1.75} />
          <h2 className="mt-4 text-base font-bold">Precisa de ajuda agora?</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {visual?.horario_atendimento ?? 'Nossa equipe está disponível para ajudar você.'}
          </p>
          {telefone && (
            <a href={`tel:${telefone.replace(/\D/g, '')}`} className="mt-4 font-semibold">
              {telefone}
            </a>
          )}
          {!telefone && visual?.email && (
            <a href={`mailto:${visual.email}`} className="mt-4 font-semibold break-all">
              {visual.email}
            </a>
          )}
        </Card>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {atalhos.map(({ titulo, descricao, resumo, para, icone: Icone }) => (
          <Link key={titulo} to={para} className="group">
            <Card className="flex h-full flex-col p-6 transition-colors group-hover:border-ring/30">
              <span className="grid size-9 place-items-center rounded-lg bg-muted text-brand-800">
                <Icone className="size-4" strokeWidth={1.75} />
              </span>
              <h2 className="mt-6 text-base font-bold">{titulo}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{descricao}</p>
              <span className="mt-4 text-[11px] font-semibold text-brand-800">{resumo}</span>
            </Card>
          </Link>
        ))}
      </div>

      {principal && principal.status !== 'CANCELADO' && (
        <ProximaFatura idContrato={principal.id_contrato} plano={principal.nome_plano} />
      )}
    </div>
  );
}

function CartaoPlano({ contrato }: { contrato: ContratoResumoResponse }) {
  const status = STATUS_CONTRATO[contrato.status];
  const detalhe = useObterContrato(contrato.id_contrato);
  const pessoas = detalhe.data?.pessoas_cobertas ?? [];
  const detalhes = [
    { rotulo: 'Quem está protegido', valor: COBERTURA[contrato.tipo_cobertura] },
    {
      rotulo: 'Valor',
      valor: `${real(contrato.valor_total)}${PERIODICIDADE[contrato.periodicidade].sufixo}`,
    },
    { rotulo: 'Pessoas', valor: String(numero(contrato.quantidade_pessoas)) },
  ];

  return (
    <Link to={`/minha-conta/contratos/${contrato.id_contrato}`} className="group">
      <section className="h-full rounded-xl bg-primary p-8 text-primary-foreground transition-opacity group-hover:opacity-95">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-white/60 uppercase">
              Seu plano
            </p>
            <h2 className="mt-2 text-[28px] leading-tight font-bold">{contrato.nome_plano}</h2>
            <p className="mt-2 text-xs text-white/70">
              {contrato.status === 'ATIVO'
                ? 'Tudo certo com o seu cuidado.'
                : 'O contrato fica ativo com o pagamento da primeira cobrança.'}
            </p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {status.rotulo}
          </span>
        </div>
        <dl className="mt-7 grid grid-cols-1 gap-4 border-t border-white/10 pt-7 sm:grid-cols-3">
          {detalhes.map(({ rotulo, valor }) => (
            <div key={rotulo}>
              <dt className="text-[11px] text-white/60">{rotulo}</dt>
              <dd className="mt-1 text-sm font-semibold">{valor}</dd>
            </div>
          ))}
        </dl>
        {pessoas.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] text-white/60">Pessoas cobertas</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {pessoas.map((pessoa) => (
                <li
                  key={pessoa.id_pessoa_coberta}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
                >
                  {pessoa.nome}
                  {pessoa.tipo === 'TITULAR' && (
                    <span className="font-normal text-white/60"> · titular</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </Link>
  );
}

function SemPlano() {
  return (
    <section className="flex flex-col justify-center rounded-xl bg-primary p-8 text-primary-foreground">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-white/60 uppercase">
        Seu plano
      </p>
      <h2 className="mt-2 text-[28px] leading-tight font-bold">Você ainda não tem um plano</h2>
      <p className="mt-2 max-w-md text-xs text-white/70">
        Compare os planos com calma e escolha o que faz sentido para você e sua família.
      </p>
      <Button
        asChild
        className="mt-6 self-start bg-linear-to-r from-accent to-[#d4b16c] text-accent-foreground hover:opacity-90"
      >
        <Link to="/minha-conta/contratar">Conhecer os planos</Link>
      </Button>
    </section>
  );
}
