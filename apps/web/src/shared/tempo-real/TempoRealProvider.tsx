import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { env } from '../lib/env';
import { obterSlugDoTenant } from '../lib/tenant';
import { TempoRealContext, type StatusConexao } from './contexto';

// Espera entre as tentativas de reconexão, em ms. Depois da última, repete a última.
const ESPERAS = [0, 2_000, 5_000, 10_000, 30_000];
const esperaDa = (tentativa: number) => ESPERAS[Math.min(tentativa, ESPERAS.length - 1)] ?? 30_000;

function criarConexao(obterToken: () => string | null): HubConnection {
  const tenant = obterSlugDoTenant();
  return new HubConnectionBuilder()
    .withUrl(`${env.apiUrl}${env.hubUrl}`, {
      accessTokenFactory: () => obterToken() ?? '',
      headers: tenant ? { 'X-Tenant': tenant } : {},
      withCredentials: true,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: ({ previousRetryCount }) => esperaDa(previousRetryCount),
    })
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.None)
    .build();
}

type TempoRealProviderProps = {
  /** Só conecta com sessão ativa; ao virar false (logout), encerra a conexão. */
  ativo: boolean;
  obterToken: () => string | null;
  children: ReactNode;
};

/**
 * Conexão única com o backend via SignalR (FE-08), com reconexão automática e token JWT.
 * As telas escutam eventos com useEventoTempoReal e atualizam o cache do TanStack Query.
 */
export function TempoRealProvider({ ativo, obterToken, children }: TempoRealProviderProps) {
  const conexao = useMemo(() => (ativo ? criarConexao(obterToken) : null), [ativo, obterToken]);
  const [status, setStatus] = useState<StatusConexao>('desligada');

  useEffect(() => {
    if (!conexao) return;

    conexao.onreconnecting(() => setStatus('reconectando'));
    conexao.onreconnected(() => setStatus('conectada'));
    conexao.onclose(() => setStatus('desligada'));

    let cancelado = false;
    let espera: ReturnType<typeof setTimeout> | undefined;

    // A primeira conexão não entra no withAutomaticReconnect: tenta de novo por conta própria.
    async function iniciar(tentativa: number) {
      try {
        await conexao!.start();
        if (!cancelado) setStatus('conectada');
      } catch {
        if (!cancelado)
          espera = setTimeout(() => void iniciar(tentativa + 1), esperaDa(tentativa + 1));
      }
    }

    void iniciar(0);

    return () => {
      cancelado = true;
      clearTimeout(espera);
      setStatus('desligada');
      if (conexao.state !== HubConnectionState.Disconnected) void conexao.stop();
    };
  }, [conexao]);

  const valor = useMemo(
    () => ({ conexao, status: conexao ? status : ('desligada' as const) }),
    [conexao, status],
  );
  return <TempoRealContext value={valor}>{children}</TempoRealContext>;
}
