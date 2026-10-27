import { Badge } from '@ampara/ui/components/badge';
import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { CalendarDays, FileText, Phone, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth';
import { PageHeader } from '@/shared/components/PageHeader';

// Dados fixos do protótipo. Passam a vir da API com os contratos (CON-01) e as faturas (COB-02).
const PLANO = {
  nome: 'Acolher',
  situacao: 'Em dia',
  proximoPagamento: '12 de abril',
  valor: 'R$ 55,00',
  formaPagamento: 'Cartão final 2048',
};

const TELEFONE_ATENDIMENTO = '0800 000 2025';

const ATALHOS: {
  titulo: string;
  descricao: string;
  resumo: string;
  para: string;
  icone: LucideIcon;
}[] = [
  {
    titulo: 'Meus documentos',
    descricao: 'Consulte os arquivos e informações do seu plano.',
    resumo: '4 documentos',
    para: '/minha-conta/documentos',
    icone: FileText,
  },
  {
    titulo: 'Pagamentos',
    descricao: 'Veja datas, valores e comprovantes anteriores.',
    resumo: 'Tudo em dia',
    para: '/minha-conta/faturas',
    icone: Wallet,
  },
  {
    titulo: 'Pessoas protegidas',
    descricao: 'Confira quem está incluído no seu contrato.',
    resumo: '3 pessoas',
    para: '/minha-conta/dependentes',
    icone: ShieldCheck,
  },
  {
    titulo: 'Atendimento',
    descricao: 'Fale com a equipe por telefone ou WhatsApp.',
    resumo: '24 horas',
    para: '/minha-conta/atendimento',
    icone: Phone,
  },
];

const PAGAMENTOS: { descricao: string; data: string; valor: string; pago: boolean }[] = [
  { descricao: 'Mensalidade abril', data: '12 de abril', valor: 'R$ 55,00', pago: false },
  { descricao: 'Mensalidade março', data: '12 de março', valor: 'R$ 55,00', pago: true },
  { descricao: 'Mensalidade fevereiro', data: '12 de fevereiro', valor: 'R$ 55,00', pago: true },
];

export function InicioPage() {
  const { usuario } = useAuth();
  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        sobretitulo="Área do cliente"
        titulo={`Olá, ${primeiroNome}`}
        descricao="Acompanhe seu plano e encontre ajuda quando precisar."
        acoes={
          <Button>
            <Phone /> Falar pelo WhatsApp
          </Button>
        }
      />

      <div className="mt-1 grid gap-5 lg:grid-cols-[1fr_355px]">
        <CartaoPlano />
        <Card className="flex flex-col p-7">
          <Phone className="size-4 text-brand-800" strokeWidth={1.75} />
          <h2 className="mt-4 text-base font-bold">Precisa de ajuda agora?</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Nossa equipe está disponível todos os dias, a qualquer hora.
          </p>
          <a
            href={`tel:${TELEFONE_ATENDIMENTO.replaceAll(' ', '')}`}
            className="mt-4 font-semibold"
          >
            {TELEFONE_ATENDIMENTO}
          </a>
        </Card>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {ATALHOS.map(({ titulo, descricao, resumo, para, icone: Icone }) => (
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

      <ProximosPagamentos />
    </div>
  );
}

function CartaoPlano() {
  const detalhes = [
    { rotulo: 'Próximo pagamento', valor: PLANO.proximoPagamento },
    { rotulo: 'Valor', valor: PLANO.valor },
    { rotulo: 'Forma de pagamento', valor: PLANO.formaPagamento },
  ];

  return (
    <section className="rounded-xl bg-primary p-8 text-primary-foreground">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-white/60 uppercase">
            Seu plano
          </p>
          <h2 className="mt-2 text-[28px] leading-tight font-bold">{PLANO.nome}</h2>
          <p className="mt-2 text-xs text-white/70">Tudo certo com o seu cuidado.</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          {PLANO.situacao}
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
    </section>
  );
}

function ProximosPagamentos() {
  return (
    <Card className="overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-base font-bold">Próximos pagamentos</h2>
        <p className="mt-0.5 text-[11px] text-subtle-foreground">
          Plano Acolher · cobrança mensal recorrente.
        </p>
      </div>
      <ul className="divide-y divide-border/70 border-t border-border/70">
        {PAGAMENTOS.map(({ descricao, data, valor, pago }) => (
          <li key={descricao} className="flex items-center gap-4 px-6 py-3.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <CalendarDays className="size-3.5" strokeWidth={1.75} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] font-semibold">{descricao}</span>
              <span className="text-[11px] text-subtle-foreground">{data}</span>
            </span>
            <span className="w-24 text-sm font-semibold">{valor}</span>
            <span className="flex w-24 justify-end">
              <Badge variant={pago ? 'success' : 'info'}>{pago ? 'Pago' : 'Agendado'}</Badge>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
