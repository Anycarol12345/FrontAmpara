import { useAuth } from './contexto';
import type { Perfil, TipoTerceiro } from './perfis';

/**
 * Esconde ações conforme o perfil (FE-07, matriz do DEC-06).
 * Só afeta a interface: quem garante a permissão é o backend.
 */
export function usePermissao() {
  const { usuario } = useAuth();
  const perfil = usuario?.perfil ?? null;

  const tem = (...perfis: Perfil[]) => perfil !== null && perfis.includes(perfil);
  const ehTerceiro = (...tipos: TipoTerceiro[]) =>
    perfil === 'TERCEIRO' && usuario?.tipoTerceiro != null && tipos.includes(usuario.tipoTerceiro);

  return {
    perfil,
    tem,
    ehTerceiro,
    /** Configurações, planos, catálogo, equipe e terceiros. */
    ehGestor: tem('FUNERARIA'),
    /** Atendimento do dia a dia: clientes, contratos, funeral, translado. */
    ehEquipe: tem('FUNERARIA', 'FUNCIONARIO'),
  };
}
