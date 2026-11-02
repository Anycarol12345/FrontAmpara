import type { FaixaKm, TipoTranslado } from '@ampara/api-client';

export const TIPO_TRANSLADO: Record<TipoTranslado, string> = {
  MUNICIPAL: 'Municipal',
  INTERMUNICIPAL: 'Intermunicipal',
  INTERESTADUAL: 'Interestadual',
};

export type Linha = { de_km: string; ate_km: string; valor: string; valor_km_excedente: string };

/**
 * Confere as faixas antes de enviar: cada uma começa onde a anterior termina, só a última fica
 * sem fim (e é a única que pode cobrar o km excedente). Devolve o erro ou as faixas prontas.
 */
export function validarFaixas(linhas: Linha[]): { erro: string } | { faixas: FaixaKm[] } {
  if (linhas.length === 0) return { erro: 'Inclua ao menos uma faixa.' };
  const faixas: FaixaKm[] = [];
  for (const [i, l] of linhas.entries()) {
    const n = i + 1;
    const de = Number(l.de_km);
    const ate = l.ate_km.trim() === '' ? null : Number(l.ate_km);
    const valor = Number(l.valor);
    const excedente = l.valor_km_excedente.trim() === '' ? null : Number(l.valor_km_excedente);
    if (l.de_km.trim() === '' || !Number.isFinite(de) || de < 0)
      return { erro: `Faixa ${n}: informe o km inicial.` };
    if (l.valor.trim() === '' || !Number.isFinite(valor) || valor < 0)
      return { erro: `Faixa ${n}: informe o valor.` };
    if (ate !== null && ate <= de)
      return { erro: `Faixa ${n}: o km final precisa ser maior que o inicial.` };
    if (ate === null && i < linhas.length - 1)
      return { erro: `Faixa ${n}: só a última faixa pode ficar sem km final.` };
    const anterior = faixas[i - 1];
    if (anterior && anterior.ate_km !== null && de < anterior.ate_km)
      return {
        erro: `As faixas ${i} e ${n} se sobrepõem: a faixa ${n} começa antes de ${anterior.ate_km} km.`,
      };
    if (anterior && anterior.ate_km !== null && de > anterior.ate_km)
      return { erro: `Há um vão entre as faixas ${i} e ${n}: de ${anterior.ate_km} a ${de} km.` };
    if (excedente !== null && ate !== null)
      return {
        erro: `Faixa ${n}: o valor por km excedente só vale para a última faixa, sem km final.`,
      };
    faixas.push({ de_km: de, ate_km: ate, valor, valor_km_excedente: excedente });
  }
  return { faixas };
}
