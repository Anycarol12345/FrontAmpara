export { LoginClientePage } from './pages/LoginClientePage';
export { LoginEquipePage } from './pages/LoginEquipePage';
export { MinhasFunerariasPage } from './pages/MinhasFunerariasPage';
export { RecuperarSenhaPage } from './pages/RecuperarSenhaPage';
export { PrimeiroAcessoPage, RedefinirSenhaPage } from './pages/DefinirSenhaPage';
export { ConfirmarEmailPage } from './pages/ConfirmarEmailPage';
export { RotaProtegida } from './components/RotaProtegida';
export { loginPara } from './components/loginPara';
export { AuthProvider } from './sessao/AuthProvider';
export { useAuth } from './sessao/contexto';
export { usePermissao } from './sessao/usePermissao';
export { renovarAccessToken, encerrarSessao } from './sessao/sessao';
export { obterAccessToken, type Usuario } from './sessao/token';
export {
  AREA_DO_PERFIL,
  NOME_PERFIL,
  PERFIS,
  type Perfil,
  type TipoTerceiro,
} from './sessao/perfis';
