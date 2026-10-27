export * from './gerado/api';
export * from './gerado/modelos';
export * as esquemas from './gerado/zod/index.zod';
export { configurarCliente, type ConfiguracaoCliente } from './http/configuracao';
export { ApiError, ehApiError } from './http/erros';
export { requisicao } from './http/requisicao';
