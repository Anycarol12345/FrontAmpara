// Sem funerária padrão (TENANT_PADRAO), o endereço principal é a landing da plataforma (FE-PUB-04).
// Com ela, o proxy.ts leva "/" para a landing da funerária e esta página não é usada.
export { default, metadata } from './para-funerarias/page';
