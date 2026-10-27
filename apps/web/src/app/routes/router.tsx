import { createBrowserRouter, Navigate } from 'react-router';
import { LoginClientePage, LoginEquipePage } from '@/features/auth';
import { CadastroPage } from '@/features/clientes';
import { InicioPage } from '@/features/contratos';
import { VisaoGeralPage } from '@/features/relatorios';
import { ClienteLayout } from '../layouts/ClienteLayout';
import { PainelLayout } from '../layouts/PainelLayout';
import { NaoEncontradoPage } from './NaoEncontradoPage';

// Rotas do FE-03. As áreas /parceiro e /admin entram nos próximos cards.
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/entrar" replace /> },
  { path: '/entrar', element: <LoginClientePage /> },
  { path: '/cadastro', element: <CadastroPage /> },
  { path: '/equipe/entrar', element: <LoginEquipePage /> },
  {
    path: '/minha-conta',
    element: <ClienteLayout />,
    children: [{ index: true, element: <InicioPage /> }],
  },
  {
    path: '/painel',
    element: <PainelLayout />,
    children: [{ index: true, element: <VisaoGeralPage /> }],
  },
  { path: '*', element: <NaoEncontradoPage /> },
]);
