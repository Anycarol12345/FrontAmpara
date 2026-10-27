function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export const env = {
  apiUrl: required('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL),
  appUrl: required('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL),
} as const;
