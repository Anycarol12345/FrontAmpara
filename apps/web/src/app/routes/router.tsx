import { createBrowserRouter, Navigate } from 'react-router';
import { LoginClientePage, LoginEquipePage } from '@/features/auth';
import { CadastroPage } from '@/features/clientes';
import { NaoEncontradoPage } from './NaoEncontradoPage';

// Rotas de acesso (FE-03). As áreas /minha-conta, /painel, /parceiro e /admin entram nos próximos cards.
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/entrar" replace /> },
  { path: '/entrar', element: <LoginClientePage /> },
  { path: '/cadastro', element: <CadastroPage /> },
  { path: '/equipe/entrar', element: <LoginEquipePage /> },
  { path: '*', element: <NaoEncontradoPage /> },
]);
