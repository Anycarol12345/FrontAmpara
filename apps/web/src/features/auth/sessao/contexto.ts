import { createContext, use } from 'react';
import type { Usuario } from './token';

type ResultadoLogin = {
  usuario: Usuario;
  /** Quantas funerárias a pessoa tem (para o CLIENTE escolher, AUT-02). */
  totalFunerarias: number;
};

export type ContextoAuth = {
  status: 'carregando' | 'anonimo' | 'autenticado';
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => Promise<ResultadoLogin>;
  sair: () => Promise<void>;
};

export const AuthContext = createContext<ContextoAuth | null>(null);

export function useAuth() {
  const contexto = use(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro do AuthProvider.');
  return contexto;
}
