/** A API descreve números como `number | string` (OpenAPI do .NET); aqui viram number. */
export const numero = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined || valor === '' ? 0 : Number(valor);

export const real = (valor: number | string, casas = 2) =>
  numero(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

/** "R$ 39" quando não há centavos, "R$ 39,90" quando há. */
export const realCurto = (valor: number | string) =>
  real(valor, Number.isInteger(numero(valor)) ? 0 : 2);

/** Só o número, sem o "R$": 39 ou 39,90. */
export const valorCurto = (valor: number | string) =>
  numero(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(numero(valor)) ? 0 : 2,
    maximumFractionDigits: 2,
  });
