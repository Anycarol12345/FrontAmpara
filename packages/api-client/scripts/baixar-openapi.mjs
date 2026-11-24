// Baixa o openapi.json da versão do backend fixada em backend.json (FE-04).
// Para usar uma API rodando localmente: API_OPENAPI_URL=http://localhost:5080/openapi/v1.json pnpm api:generate
import { readFile, writeFile } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('../backend.json', import.meta.url), 'utf8'));
const url = process.env.API_OPENAPI_URL ?? config.openapiUrl.replace('{versao}', config.versao);
const destino = new URL('../openapi/openapi.json', import.meta.url);

console.log(`Baixando o OpenAPI de ${url}`);

const resposta = await fetch(url).catch((erro) => {
  console.error(`Não foi possível acessar ${url}: ${erro.message}`);
  process.exit(1);
});

if (!resposta.ok) {
  console.error(
    `Falha ao baixar o OpenAPI (${resposta.status}). Confira a versão em backend.json ` +
      'ou use API_OPENAPI_URL apontando para uma API local.',
  );
  process.exit(1);
}

const documento = await resposta.json();
await writeFile(destino, `${JSON.stringify(documento, null, 2)}\n`);
console.log('openapi/openapi.json atualizado.');
