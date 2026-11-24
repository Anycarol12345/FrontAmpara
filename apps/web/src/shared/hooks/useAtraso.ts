import { useEffect, useState } from 'react';

/** Valor que só muda depois de um tempo parado (ex.: busca enquanto a pessoa digita). */
export function useAtraso<T>(valor: T, milissegundos = 350) {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const espera = setTimeout(() => setAtrasado(valor), milissegundos);
    return () => clearTimeout(espera);
  }, [valor, milissegundos]);
  return atrasado;
}
