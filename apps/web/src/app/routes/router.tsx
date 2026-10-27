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
 * /painel                             área da funerária (FUNERARIA e FUNCIONARIO)
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
            ],
          },
        ],
      },
      {
        path: '/painel',
        element: <RotaProtegida perfis={['FUNERARIA', 'FUNCIONARIO']} />,
        children: [
          {
            element: <PainelLayout />,
            children: [
              {
                index: true,
                lazy: pagina(() => import('@/features/relatorios'), 'VisaoGeralPage'),
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
      { path: '*', element: <NaoEncontradoPage /> },
    ],
  },
]);
