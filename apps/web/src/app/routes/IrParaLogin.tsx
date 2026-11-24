import { Navigate, useLocation } from 'react-router';
/** /login (link dos e-mails) abre o login, mantendo o ?voltar=. */
export function IrParaLogin() {
  const { search } = useLocation();
  return <Navigate to={`/entrar${search}`} replace />;
}
