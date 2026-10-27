import { useEffect, useState } from 'react';
import { SUBDOMINIOS_RESERVADOS } from '@/lib/tenant';
import { SLUG_VALIDO } from './validacao';

export type Disponibilidade =
  'vazio' | 'invalido' | 'verificando' | 'disponivel' | 'em-uso' | 'erro';

/**
 * Verifica, enquanto a pessoa digita, se o endereço já é de outra funerária (FE-PUB-04).
 * Usa a identidade visual pública: 200 = já existe; 404 = livre.
 */
export function useDisponibilidadeSlug(slug: string): Disponibilidade {
  const [resultado, setResultado] = useState<{ slug: string; estado: Disponibilidade } | null>(
    null,
  );
  const formatoOk = SLUG_VALIDO.test(slug) && !SUBDOMINIOS_RESERVADOS.has(slug);

  useEffect(() => {
    if (!formatoOk) return;
    const controle = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const resposta = await fetch('/api/v1/tenant/configuracoes', {
          headers: { 'X-Tenant': slug, Accept: 'application/json' },
          signal: controle.signal,
        });
        const estado = resposta.ok ? 'em-uso' : resposta.status === 404 ? 'disponivel' : 'erro';
        setResultado({ slug, estado });
      } catch {
        if (!controle.signal.aborted) setResultado({ slug, estado: 'erro' });
      }
    }, 400);

    return () => {
      controle.abort();
      clearTimeout(espera);
    };
  }, [slug, formatoOk]);

  if (!slug) return 'vazio';
  if (!formatoOk) return 'invalido';
  return resultado?.slug === slug ? resultado.estado : 'verificando';
}
