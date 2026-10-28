import { Button } from '@ampara/ui/components/button';
import { Card } from '@ampara/ui/components/card';
import { Logo } from '@ampara/ui/components/logo';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import type { Perfil } from '@/features/auth';
import { limparEstado } from '../estado';
import { lerSessaoDemo, PESSOAS_DEMO, salvarSessaoDemo, type Cenario } from './sessao';

type Tela = { titulo: string; rota: string; card?: string };
type Grupo = {
  titulo: string;
  descricao: string;
  /** null: telas públicas, abertas sem sessão. */
  perfil: Perfil | null;
  cenario?: Cenario;
  telas: Tela[];
};

const CLIENTE: Tela[] = [
  { titulo: 'Início', rota: '/minha-conta', card: 'FE-CLI-01' },
  { titulo: 'Meus dados e senha', rota: '/minha-conta/dados', card: 'FE-CLI-02' },
  { titulo: 'Pessoas protegidas', rota: '/minha-conta/dependentes', card: 'FE-CLI-03' },
  { titulo: 'Contratar plano', rota: '/minha-conta/contratar', card: 'FE-CLI-04' },
  { titulo: 'Meus contratos', rota: '/minha-conta/contratos', card: 'FE-CLI-05' },
  {
    titulo: 'Detalhe do contrato',
    rota: '/minha-conta/contratos/ct-ana-acolher',
    card: 'FE-CLI-05',
  },
  { titulo: 'Pagamentos', rota: '/minha-conta/faturas', card: 'FE-CLI-06' },
  { titulo: 'Preferências de funeral', rota: '/minha-conta/preferencias', card: 'FE-CLI-07' },
  { titulo: 'Atendimentos', rota: '/minha-conta/atendimentos', card: 'FE-CLI-08' },
  {
    titulo: 'Acompanhamento do funeral',
    rota: '/minha-conta/atendimentos/exemplo-1',
    card: 'FE-CLI-08',
  },
  { titulo: 'Notificações', rota: '/minha-conta/notificacoes', card: 'FE-CLI-09' },
  { titulo: 'Escolher funerária', rota: '/minhas-funerarias' },
];

const ATENDIMENTO: Tela[] = [
  { titulo: 'Visão geral', rota: '/painel', card: 'FE-ADM-01' },
  { titulo: 'Clientes', rota: '/painel/clientes', card: 'FE-ADM-02' },
  { titulo: 'Ficha do cliente', rota: '/painel/clientes/cl-ana', card: 'FE-ADM-02' },
  {
    titulo: 'Contratar para o cliente',
    rota: '/painel/clientes/cl-ana/contratar',
    card: 'FE-ADM-03',
  },
  { titulo: 'Contratos', rota: '/painel/contratos', card: 'FE-ADM-03' },
  { titulo: 'Detalhe do contrato', rota: '/painel/contratos/ct-joao', card: 'FE-ADM-03' },
];

const GRUPOS: Grupo[] = [
  {
    titulo: 'Cliente com plano em dia',
    descricao: 'Plano Acolher mensal, com dois dependentes cobertos.',
    perfil: 'CLIENTE',
    cenario: 'padrao',
    telas: CLIENTE,
  },
  {
    titulo: 'Cliente com plano suspenso',
    descricao: 'A mesma cliente com uma fatura em atraso: aviso de suspensão, multa e juros.',
    perfil: 'CLIENTE',
    cenario: 'suspenso',
    telas: [
      { titulo: 'Início', rota: '/minha-conta', card: 'FE-CLI-01' },
      { titulo: 'Pagamentos', rota: '/minha-conta/faturas', card: 'FE-CLI-06' },
      {
        titulo: 'Detalhe do contrato',
        rota: '/minha-conta/contratos/ct-ana-suspenso',
        card: 'FE-CLI-05',
      },
    ],
  },
  {
    titulo: 'Cliente sem plano',
    descricao: 'Estados vazios e a chamada para contratar.',
    perfil: 'CLIENTE',
    cenario: 'sem-plano',
    telas: [
      { titulo: 'Início', rota: '/minha-conta', card: 'FE-CLI-01' },
      { titulo: 'Meus contratos', rota: '/minha-conta/contratos', card: 'FE-CLI-05' },
      { titulo: 'Contratar plano', rota: '/minha-conta/contratar', card: 'FE-CLI-04' },
    ],
  },
  {
    titulo: 'Gestor da funerária',
    descricao: 'Perfil Administrador do protótipo: tudo do atendimento e a gestão.',
    perfil: 'FUNERARIA',
    telas: [
      ...ATENDIMENTO,
      { titulo: 'Equipe', rota: '/painel/equipe', card: 'FE-ADM-11' },
      { titulo: 'Planos', rota: '/painel/planos', card: 'FE-ADM-10' },
      { titulo: 'Catálogo (em construção)', rota: '/painel/catalogo', card: 'FE-ADM-09' },
      { titulo: 'Fornecedores (em construção)', rota: '/painel/fornecedores', card: 'FE-ADM-14' },
      { titulo: 'Relatórios (em construção)', rota: '/painel/relatorios', card: 'FE-ADM-13' },
      { titulo: 'Configurações (em construção)', rota: '/painel/configuracoes', card: 'FE-ADM-12' },
    ],
  },
  {
    titulo: 'Funcionário',
    descricao: 'Atendimento do dia a dia.',
    perfil: 'FUNCIONARIO',
    telas: [
      ...ATENDIMENTO,
      { titulo: 'Agenda (em construção)', rota: '/painel/agenda', card: 'FE-ADM-04' },
      { titulo: 'Documentos (em construção)', rota: '/painel/documentos', card: 'FE-ADM-08' },
    ],
  },
  {
    titulo: 'Consultor',
    descricao: 'Atende clientes e faz contratações (DEC-11).',
    perfil: 'CONSULTOR',
    telas: ATENDIMENTO,
  },
  {
    titulo: 'Parceiro (empresa de translado)',
    descricao: 'Portal do terceiro.',
    perfil: 'TERCEIRO',
    telas: [
      { titulo: 'Atribuições', rota: '/parceiro', card: 'FE-TER-01' },
      { titulo: 'Meu cadastro (em construção)', rota: '/parceiro/cadastro', card: 'FE-TER-01' },
    ],
  },
  {
    titulo: 'Plataforma',
    descricao: 'Administração da Ampara.',
    perfil: 'ADMIN',
    telas: [{ titulo: 'Funerárias', rota: '/admin', card: 'FE-PLT-01' }],
  },
  {
    titulo: 'Telas públicas',
    descricao: 'Abertas sem sessão. Estas chamam a API real.',
    perfil: null,
    telas: [
      { titulo: 'Login do cliente', rota: '/entrar', card: 'FE-PUB-03' },
      { titulo: 'Login da equipe', rota: '/equipe/entrar', card: 'FE-PUB-03' },
      { titulo: 'Cadastro do cliente', rota: '/cadastro', card: 'FE-PUB-02' },
      {
        titulo: 'Cadastro concluído',
        rota: '/cadastro/concluido?email=ana.souza%40exemplo.com',
        card: 'FE-PUB-02',
      },
      { titulo: 'Esqueci minha senha', rota: '/recuperar-senha', card: 'FE-PUB-03' },
      {
        titulo: 'Redefinir senha',
        rota: '/redefinir-senha?token=demo&email=ana.souza%40exemplo.com',
        card: 'FE-PUB-03',
      },
      {
        titulo: 'Primeiro acesso',
        rota: '/definir-senha?token=demo&email=ana.souza%40exemplo.com',
        card: 'FE-PUB-03',
      },
    ],
  },
];

/** Abre a tela já com a sessão do perfil. Recarrega a página para o MSW trocar os dados. */
function abrir(grupo: Grupo, rota: string) {
  salvarSessaoDemo(
    grupo.perfil ? { perfil: grupo.perfil, cenario: grupo.cenario ?? 'padrao' } : null,
  );
  window.location.assign(rota);
}

/**
 * Atalho para todas as telas sem login (só em desenvolvimento).
 * Cada link entra com um usuário de demonstração e a API inteira é simulada (src/mocks/demo).
 */
export function DemoPage() {
  const atual = lerSessaoDemo();

  function sair() {
    salvarSessaoDemo(null);
    window.location.reload();
  }

  function recomecar() {
    limparEstado();
    window.location.reload();
  }

  return (
    <div className="min-h-svh bg-background px-5 py-10 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Logo className="text-lg" />
            <h1 className="mt-6 text-[34px]/[1.15] font-bold tracking-tight">Telas do protótipo</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Escolha uma tela para abrir já com o perfil certo, sem login e sem backend. Os dados
              são fictícios e as alterações valem até recarregar a página. Para voltar aqui, acesse{' '}
              <code className="rounded bg-muted px-1">/demo</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={recomecar}>
              <RotateCcw /> Recomeçar faturas e preferências
            </Button>
            {atual && (
              <Button variant="outline" onClick={sair}>
                Sair da demonstração ({PESSOAS_DEMO[atual.perfil].nome})
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {GRUPOS.map((grupo) => (
            <Card key={grupo.titulo} className="flex flex-col p-6">
              <h2 className="text-base font-bold">{grupo.titulo}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {grupo.perfil && (
                  <span className="font-semibold text-foreground">
                    {PESSOAS_DEMO[grupo.perfil].nome} ·{' '}
                  </span>
                )}
                {grupo.descricao}
              </p>
              <ul className="mt-4 flex flex-col">
                {grupo.telas.map((tela) => (
                  <li key={tela.rota}>
                    <a
                      href={tela.rota}
                      onClick={(e) => {
                        e.preventDefault();
                        abrir(grupo, tela.rota);
                      }}
                      className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <span>{tela.titulo}</span>
                      <span className="flex items-center gap-2 text-[11px] text-subtle-foreground">
                        {tela.card}
                        <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
