import { createBrowserRouter, Navigate } from 'react-router';
import {
  ConfirmarEmailPage,
  LoginClientePage,
  LoginEquipePage,
  MinhasFunerariasPage,
  PrimeiroAcessoPage,
  RecuperarSenhaPage,
  RedefinirSenhaPage,
  RotaProtegida,
} from '@/features/auth';
import { EmConstrucao } from '@/shared/components/EmConstrucao';
import { NaoEncontradoPage, TelaCarregando } from '@/shared/components/PaginaErro';
import { IrParaLogin } from './IrParaLogin';
import { ClienteLayout } from '../layouts/ClienteLayout';
import { PainelLayout } from '../layouts/PainelLayout';

// As páginas das áreas são carregadas sob demanda: cada perfil baixa só o código que usa (FE-03).
const pagina =
  <T,>(carregar: () => Promise<T>, nome: keyof T) =>
  async () => ({ Component: (await carregar())[nome] as React.ComponentType });

/**
 * Rotas do FE-03:
 * /entrar, /cadastro, /equipe/entrar  acesso (público)
 * /minha-conta                        área do cliente (CLIENTE)
 * /painel                             área da funerária (FUNERARIA, FUNCIONARIO e CONSULTOR)
 * /parceiro                           portal do terceiro (TERCEIRO)
 * /admin                              plataforma (ADMIN)
 */
export const router = createBrowserRouter([
  {
    HydrateFallback: TelaCarregando,
    children: [
      { path: '/', element: <Navigate to="/entrar" replace /> },
      { path: '/entrar', element: <LoginClientePage /> },
      { path: '/equipe/entrar', element: <LoginEquipePage /> },
      // Fica dentro de /admin para o pedido ir sem X-Tenant: o ADMIN não é de nenhuma funerária.
      { path: '/admin/entrar', element: <LoginEquipePage plataforma /> },
      // Links enviados por e-mail pelo backend (LinksIdentidade): /login, /definir-senha,
      // /redefinir-senha e /confirmar-email (FE-PUB-03).
      { path: '/login', element: <IrParaLogin /> },
      { path: '/recuperar-senha', element: <RecuperarSenhaPage /> },
      { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },
      { path: '/definir-senha', element: <PrimeiroAcessoPage /> },
      { path: '/confirmar-email', element: <ConfirmarEmailPage /> },
      {
        path: '/cadastro/concluido',
        lazy: pagina(() => import('@/features/clientes'), 'CadastroConcluidoPage'),
      },
      {
        path: '/cadastro',
        lazy: pagina(() => import('@/features/clientes'), 'CadastroPage'),
      },
      {
        path: '/minhas-funerarias',
        element: <RotaProtegida perfis={['CLIENTE']} />,
        children: [{ index: true, element: <MinhasFunerariasPage /> }],
      },
      {
        path: '/minha-conta',
        element: <RotaProtegida perfis={['CLIENTE']} />,
        children: [
          {
            element: <ClienteLayout />,
            children: [
              { index: true, lazy: pagina(() => import('@/features/contratos'), 'InicioPage') },
              { path: 'dados', lazy: pagina(() => import('@/features/clientes'), 'MeusDadosPage') },
              {
                path: 'dependentes',
                lazy: pagina(() => import('@/features/clientes'), 'DependentesPage'),
              },
              {
                path: 'contratos',
                lazy: pagina(() => import('@/features/contratos'), 'MeusContratosPage'),
              },
              {
                path: 'contratos/:id',
                lazy: pagina(() => import('@/features/contratos'), 'ContratoClientePage'),
              },
              {
                path: 'contratar',
                lazy: pagina(() => import('@/features/contratos'), 'ContratarPage'),
              },
              {
                path: 'faturas',
                lazy: pagina(() => import('@/features/financeiro'), 'FaturasPage'),
              },
              {
                path: 'preferencias',
                lazy: pagina(() => import('@/features/funeral'), 'PreferenciasPage'),
              },
              {
                path: 'atendimentos',
                lazy: pagina(() => import('@/features/funeral'), 'AtendimentosPage'),
              },
              {
                path: 'atendimentos/:id',
                lazy: pagina(() => import('@/features/funeral'), 'AcompanhamentoPage'),
              },
              {
                path: 'notificacoes',
                lazy: pagina(() => import('@/features/notificacoes'), 'NotificacoesPage'),
              },
            ],
          },
        ],
      },
      {
        path: '/painel',
        element: <RotaProtegida perfis={['FUNERARIA', 'FUNCIONARIO', 'CONSULTOR']} />,
        children: [
          {
            element: <PainelLayout />,
            children: [
              {
                index: true,
                lazy: pagina(() => import('@/features/relatorios'), 'VisaoGeralPage'),
              },
              // Atendimento: clientes e contratações (gestor, funcionário e consultor).
              {
                path: 'clientes',
                lazy: pagina(() => import('@/features/clientes'), 'ClientesPage'),
              },
              {
                path: 'clientes/:id',
                lazy: pagina(() => import('./ClienteComContratos'), 'ClienteComContratos'),
              },
              {
                path: 'clientes/:id/contratar',
                lazy: pagina(() => import('@/features/contratos'), 'ContratarParaClientePage'),
              },
              {
                path: 'contratos',
                lazy: pagina(() => import('@/features/contratos'), 'ContratosPage'),
              },
              {
                path: 'contratos/:id',
                lazy: pagina(() => import('./ContratoComFaturas'), 'ContratoComFaturas'),
              },
              {
                path: 'beneficiarios/novo',
                lazy: pagina(() => import('@/features/funeral'), 'RegistrarBeneficiarioPage'),
              },
              {
                path: 'funerais/novo',
                lazy: pagina(() => import('@/features/funeral'), 'RegistrarFuneralPage'),
              },
              {
                path: 'funerais/:id',
                lazy: pagina(() => import('@/features/funeral'), 'FuneralPainelPage'),
              },
              {
                element: <RotaProtegida perfis={['FUNERARIA', 'FUNCIONARIO']} />,
                children: [
                  {
                    path: 'agenda',
                    lazy: pagina(() => import('@/features/funeral'), 'AgendaPage'),
                  },
                  {
                    path: 'documentos',
                    element: (
                      <EmConstrucao sobretitulo="Equipe" titulo="Documentos" card="FE-ADM-08" />
                    ),
                  },
                ],
              },
              // Gestão da funerária: só o gestor.
              {
                element: <RotaProtegida perfis={['FUNERARIA']} />,
                children: [
                  {
                    path: 'equipe',
                    lazy: pagina(() => import('@/features/usuarios'), 'EquipePage'),
                  },
                  {
                    path: 'planos',
                    lazy: pagina(() => import('@/features/planos'), 'PlanosPage'),
                  },
                  {
                    path: 'catalogo',
                    lazy: pagina(() => import('@/features/catalogo'), 'CatalogoPage'),
                  },
                  {
                    path: 'terceiros',
                    lazy: pagina(() => import('@/features/terceiros'), 'TerceirosPage'),
                  },
                  { path: 'fornecedores', element: <Navigate to="/painel/terceiros" replace /> },
                  {
                    path: 'relatorios',
                    element: (
                      <EmConstrucao sobretitulo="Gestão" titulo="Relatórios" card="FE-ADM-13" />
                    ),
                  },
                  {
                    path: 'configuracoes',
                    lazy: pagina(() => import('@/features/tenants'), 'ConfiguracoesPage'),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '/parceiro',
        element: <RotaProtegida perfis={['TERCEIRO']} />,
        children: [
          {
            element: <PainelLayout />,
            children: [
              {
                index: true,
                lazy: pagina(() => import('@/features/terceiros'), 'InicioParceiroPage'),
              },
              {
                path: 'cadastro',
                element: (
                  <EmConstrucao sobretitulo="Parceiro" titulo="Meu cadastro" card="FE-TER-01" />
                ),
              },
            ],
          },
        ],
      },
      {
        path: '/admin',
        element: <RotaProtegida perfis={['ADMIN']} />,
        children: [
          {
            element: <PainelLayout />,
            children: [
              {
                index: true,
                lazy: pagina(() => import('@/features/plataforma'), 'PainelPlataformaPage'),
              },
            ],
          },
        ],
      },
      // Faz o papel da página de pagamento do Stripe com os dados fictícios (só em desenvolvimento).
      ...(import.meta.env.DEV
        ? [
            {
              path: '/pagamento-simulado',
              lazy: pagina(() => import('@/mocks/PagamentoSimuladoPage'), 'PagamentoSimuladoPage'),
            },
            // Todas as telas sem login, com a API simulada (src/mocks/demo).
            { path: '/demo', lazy: pagina(() => import('@/mocks/demo/DemoPage'), 'DemoPage') },
          ]
        : []),
      { path: '*', element: <NaoEncontradoPage /> },
    ],
  },
]);
