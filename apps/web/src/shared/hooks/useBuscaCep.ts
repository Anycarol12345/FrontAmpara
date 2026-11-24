import { useCallback, useState } from 'react';
import { somenteDigitos } from '../lib/mascaras';

export type Endereco = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

type RespostaViaCep = {
  erro?: boolean;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
};

/** Preenche o endereço a partir do CEP pela ViaCEP (FE-06, opcional). Falhas não bloqueiam o formulário. */
export function useBuscaCep() {
  const [buscando, setBuscando] = useState(false);

  const buscar = useCallback(async (cep: string): Promise<Endereco | null> => {
    const digitos = somenteDigitos(cep);
    if (digitos.length !== 8) return null;

    setBuscando(true);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      if (!resposta.ok) return null;
      const dados = (await resposta.json()) as RespostaViaCep;
      if (dados.erro) return null;
      return {
        logradouro: dados.logradouro,
        bairro: dados.bairro,
        cidade: dados.localidade,
        uf: dados.uf,
      };
    } catch {
      return null;
    } finally {
      setBuscando(false);
    }
  }, []);

  return { buscar, buscando };
}
