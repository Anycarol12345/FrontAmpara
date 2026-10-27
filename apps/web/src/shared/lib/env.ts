function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export const env = {
  apiUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL),
} as const;
