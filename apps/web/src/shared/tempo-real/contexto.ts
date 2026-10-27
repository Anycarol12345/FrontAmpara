import type { HubConnection } from '@microsoft/signalr';
import { createContext, use, useEffect, useRef } from 'react';

export type StatusConexao = 'desligada' | 'conectando' | 'conectada' | 'reconectando';

type ContextoTempoReal = {
  conexao: HubConnection | null;
  status: StatusConexao;
};

export const TempoRealContext = createContext<ContextoTempoReal>({
  conexao: null,
  status: 'desligada',
});

/** Conexão única com o hub e o status dela (FE-08). */
export function useTempoReal() {
  return use(TempoRealContext);
}

/**
 * Escuta um evento do hub enquanto o componente estiver na tela.
 * O handler pode mudar a cada render sem refazer a inscrição.
 */
export function useEventoTempoReal<T>(evento: string, aoReceber: (dados: T) => void) {
  const { conexao } = useTempoReal();
  const handler = useRef(aoReceber);

  useEffect(() => {
    handler.current = aoReceber;
  });

  useEffect(() => {
    if (!conexao) return;
    const ouvinte = (dados: T) => handler.current(dados);
    conexao.on(evento, ouvinte);
    return () => conexao.off(evento, ouvinte);
  }, [conexao, evento]);
}
