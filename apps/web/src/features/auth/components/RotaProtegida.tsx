import { Navigate, Outlet, useLocation } from 'react-router';
import { AcessoNegadoPage, TelaCarregando } from '@/shared/components/PaginaErro';
import { useAuth } from '../sessao/contexto';
import type { Perfil, TipoTerceiro } from '../sessao/perfis';
import { loginPara } from './loginPara';

type RotaProtegidaProps = {
  perfis: Perfil[];
  /** Restringe o TERCEIRO a alguns tipos (FROTA, CARTORIO_DESPACHANTE, FORNECEDOR). */
  tiposTerceiro?: TipoTerceiro[];
};

/**
 * Protege as rotas por perfil (FE-03): sem sessão vai para o login, perfil sem acesso vê o 403.
 * Serve só para a interface; a segurança de verdade está no backend.
 */
export function RotaProtegida({ perfis, tiposTerceiro }: RotaProtegidaProps) {
  const { status, usuario } = useAuth();
  const local = useLocation();

  if (status === 'carregando') return <TelaCarregando />;
  if (!usuario) return <Navigate to={loginPara(local.pathname + local.search)} replace />;

  const perfilPermitido = perfis.includes(usuario.perfil);
  const tipoPermitido =
    usuario.perfil !== 'TERCEIRO' ||
    !tiposTerceiro ||
    (usuario.tipoTerceiro !== null && tiposTerceiro.includes(usuario.tipoTerceiro));

  if (!perfilPermitido || !tipoPermitido) return <AcessoNegadoPage />;

  return <Outlet />;
}
