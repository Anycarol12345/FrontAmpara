import { createBrowserRouter, Navigate } from 'react-router';
import { LoginClientePage, LoginEquipePage } from '@/features/auth';
import { CadastroPage } from '@/features/clientes';
import { VisaoGeralPage } from '@/features/relatorios';
import { PainelLayout } from '../layouts/PainelLayout';
import { NaoEncontradoPage } from './NaoEncontradoPage';

// Rotas do FE-03. As áreas /minha-conta, /parceiro e /admin entram nos próximos cards.
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/entrar" replace /> },
  { path: '/entrar', element: <LoginClientePage /> },
  { path: '/cadastro', element: <CadastroPage /> },
  { path: '/equipe/entrar', element: <LoginEquipePage /> },
  {
    path: '/painel',
    element: <PainelLayout />,
    children: [{ index: true, element: <VisaoGeralPage /> }],
  },
  { path: '*', element: <NaoEncontradoPage /> },
]);
