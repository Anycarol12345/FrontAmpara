import { login, logout, minhasFunerarias } from '@ampara/api-client';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { encerrarSessao, iniciarSessao, restaurarSessao, sessaoStore } from './sessao';
import { AuthContext, type ContextoAuth } from './contexto';

/** Sessão do usuário (FE-07): access token em memória e refresh token em cookie httpOnly. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const usuario = useSyncExternalStore(sessaoStore.assinar, sessaoStore.ler);
  const tinhaSessao = useRef(false);

  useEffect(() => {
    void restaurarSessao();
  }, []);

  // Sessão encerrada (logout ou refresh recusado): nada do usuário anterior fica no cache.
  useEffect(() => {
    if (usuario) tinhaSessao.current = true;
    else if (usuario === null && tinhaSessao.current) {
      tinhaSessao.current = false;
      queryClient.clear();
    }
  }, [usuario, queryClient]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const usuarioLogado = iniciarSessao(await login({ email, senha }));
    if (!usuarioLogado) throw new Error('Não foi possível iniciar a sessão.');

    let totalFunerarias = 1;
    if (usuarioLogado.perfil === 'CLIENTE') {
      totalFunerarias = (await minhasFunerarias().catch(() => [])).length;
    }
    return { usuario: usuarioLogado, totalFunerarias };
  }, []);

  const sair = useCallback(async () => {
    await logout().catch(() => undefined);
    encerrarSessao();
  }, []);

  const valor = useMemo<ContextoAuth>(
    () => ({
      status: usuario === undefined ? 'carregando' : usuario ? 'autenticado' : 'anonimo',
      usuario: usuario ?? null,
      entrar,
      sair,
    }),
    [usuario, entrar, sair],
  );

  return <AuthContext value={valor}>{children}</AuthContext>;
}
