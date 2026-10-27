# Ampara Frontend

Monorepo do frontend da Ampara, gerenciado com **pnpm workspaces** e **Turborepo**.

## Estrutura

```
FrontAmpara/
├── apps/
│   ├── web/        Sistema: área do cliente, área da funerária, portal do terceiro e plataforma. Vite + React. Porta 5173
│   └── landing/    Páginas públicas com SEO: landing de cada funerária e da plataforma. Next.js. Porta 3000
├── packages/
│   ├── config/     tsconfig, ESLint e Prettier compartilhados
│   ├── ui/         componentes shadcn/ui e tema compartilhados
│   ├── api-client/ client gerado pelo Orval a partir do OpenAPI do backend
│   └── e2e/        (a criar) testes Playwright
├── pnpm-workspace.yaml
└── turbo.json
```

## Pré-requisitos

- Node 22 ou superior (veja `.nvmrc`)
- pnpm 10 (via Corepack: `corepack enable`)

## Primeiros passos

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/landing/.env.example apps/landing/.env.local
pnpm dev
```

No PowerShell, troque `cp` por `Copy-Item`.

## Rodando com o backend

O `apps/web` conversa com a API pela **mesma origem**: o Vite repassa `/api` e `/hubs` para
`VITE_API_PROXY` (padrão `http://localhost:5080`). Assim o cookie de refresh funciona sem CORS.

1. Suba o backend (repositório `ArturRibeiroB/Ampara`) seguindo o README dele. Em Development ele cria a
   funerária `demo` e os usuários `gestor@demo.localhost` e `funcionario@demo.localhost`.
2. Rode `pnpm dev` e abra http://localhost:5173.

A funerária vem do subdomínio (http://demo.localhost:5173). Sem subdomínio, vale `VITE_TENANT_PADRAO`.
O `/admin` (plataforma) é aberto sem funerária.

| Endereço         | Quem acessa                                 |
| ---------------- | ------------------------------------------- |
| `/entrar`        | login do cliente                            |
| `/equipe/entrar` | login da equipe                             |
| `/minha-conta`   | área do cliente (CLIENTE)                   |
| `/painel`        | área da funerária (FUNERARIA e FUNCIONARIO) |
| `/parceiro`      | portal do terceiro (TERCEIRO)               |
| `/admin`         | plataforma (ADMIN)                          |

## Comandos

| Comando             | O que faz                                                |
| ------------------- | -------------------------------------------------------- |
| `pnpm dev`          | Sobe todos os apps em modo desenvolvimento               |
| `pnpm build`        | Build de todos os pacotes e apps                         |
| `pnpm lint`         | ESLint, incluindo as regras de dependência               |
| `pnpm typecheck`    | Checagem de tipos (TypeScript strict)                    |
| `pnpm test`         | Testes (Vitest), com a meta mínima de cobertura do `web` |
| `pnpm format`       | Formata o código com Prettier                            |
| `pnpm format:check` | Verifica a formatação sem alterar arquivos               |
| `pnpm api:generate` | Baixa o OpenAPI da versão do backend e regenera o client |
| `pnpm api:check`    | Confere se o client gerado está igual ao `openapi.json`  |

## Client da API

O client fica em `packages/api-client` e é gerado pelo Orval (hooks do TanStack Query, schemas Zod e
mocks do MSW). A versão do backend usada fica em `packages/api-client/backend.json`.

- Para atualizar: troque a versão em `backend.json` e rode `pnpm api:generate`.
- Enquanto o backend não publica o `openapi.json` nas releases (INF-21), gere a partir de uma API local:
  `API_OPENAPI_URL=http://localhost:5080/openapi/v1.json pnpm api:generate`.
- Nunca edite `src/gerado` à mão; o CI falha se ele não bater com o `openapi.json`.

```ts
import { useListarPlanos } from '@ampara/api-client';

const planos = useListarPlanos(); // erros chegam como ApiError (status, detail, erros por campo)
```

## Testes

Vitest + Testing Library, com a API simulada pelo MSW usando os mocks gerados pelo Orval.
Use `renderizar()` (`src/test/renderizar.tsx`) para montar telas com os providers e `entrarComo(perfil)`
(`src/test/sessao.ts`) para começar um teste com sessão. Para assistir aos testes: `pnpm --filter @ampara/web test:watch`.

## Docker

Cada app gera sua imagem. O `web` é servido pelo nginx, que também repassa `/api` e `/hubs` para o backend.
As configurações do `web` são lidas ao iniciar o container (arquivo `config.js`), então a mesma imagem
serve qualquer ambiente.

```bash
# com a API rodando na sua máquina (dotnet run na porta 5080)
API_UPSTREAM=host.docker.internal:5080 docker compose up --build
```

| Serviço | Endereço              | Variáveis                                                             |
| ------- | --------------------- | --------------------------------------------------------------------- |
| web     | http://localhost:8080 | `API_UPSTREAM`, `API_URL`, `HUB_URL`, `DOMINIO_BASE`, `TENANT_PADRAO` |
| landing | http://localhost:3000 | build args `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`               |

Quando o CI do backend publicar a imagem da API (INF-15), `docker compose --profile api up --build`
sobe também a API e o PostgreSQL (`API_IMAGE`, `SEED_ADMIN_SENHA`, `SEED_SENHA_DEMO`).

## CI

O workflow `.github/workflows/ci.yml` roda a cada push e pull request: formatação, lint, tipos, testes,
build, conferência do client da API e build das imagens Docker. Em pull requests o Turborepo roda só o
que foi afetado e reaproveita o cache. O job do Playwright liga sozinho quando `packages/e2e` existir.

Para rodar um app isolado:

```bash
pnpm --filter @ampara/web dev
pnpm --filter @ampara/landing dev
```

## Variáveis de ambiente

| App       | Arquivo local | Variáveis                                                                   |
| --------- | ------------- | --------------------------------------------------------------------------- |
| `web`     | `.env`        | `VITE_API_URL`, `VITE_API_PROXY`, `VITE_DOMINIO_BASE`, `VITE_TENANT_PADRAO` |
| `landing` | `.env.local`  | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`                                |

- Os arquivos `.env.example` são versionados; os `.env` reais não.
- Tudo que começa com `VITE_` ou `NEXT_PUBLIC_` vai para o navegador. **Nunca coloque segredos aí.**
- Leia as variáveis sempre pelo módulo `env.ts` de cada app (`shared/lib/env.ts` no web, `lib/env.ts` na landing), nunca direto de `import.meta.env` ou `process.env`.
- O Vite só lê o `.env` ao iniciar: reinicie o dev server após alterá-lo.

## Organização do `apps/web`

O código é organizado por feature, espelhando os módulos do backend:

```
apps/web/src/
├── app/        providers, rotas, layouts
├── features/
│   ├── auth/  usuarios/  tenants/  plataforma/  clientes/  planos/  catalogo/
│   ├── contratos/  financeiro/  funeral/  translado/  documentos/  terceiros/
│   └── notificacoes/  relatorios/
└── shared/     utilitários e hooks genéricos
```

O alias `@/` aponta para `apps/web/src/`.

Cada feature segue o mesmo formato. As páginas ficam separadas pela área, porque o mesmo assunto
aparece para perfis diferentes (ex.: contratos na área do cliente e no painel da funerária):

```
features/contratos/
├── components/     componentes usados pelas páginas das várias áreas
├── hooks/
├── schemas/        schemas Zod próprios dos formulários
├── pages/
│   ├── cliente/    telas de /minha-conta
│   ├── painel/     telas de /painel
│   ├── parceiro/   telas de /parceiro (só quando houver)
│   └── plataforma/ telas de /admin (só quando houver)
└── index.ts        o que outras features e o app/ podem usar
```

### Mapa de features

| Feature                       | Módulo no backend                           | Cards                                                 |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| auth                          | Identidade                                  | FE-07, FE-PUB-03                                      |
| usuarios                      | Identidade                                  | FE-ADM-11                                             |
| tenants                       | Tenants                                     | FE-ADM-12                                             |
| plataforma                    | Tenants e Relatorios                        | FE-PLT-01                                             |
| clientes (inclui dependentes) | Clientes                                    | FE-PUB-02, FE-CLI-02, FE-CLI-03, FE-ADM-02            |
| planos                        | Planos                                      | FE-ADM-10                                             |
| catalogo                      | Catalogo                                    | FE-ADM-09                                             |
| contratos                     | Contratos                                   | FE-CLI-01, FE-CLI-04, FE-CLI-05, FE-ADM-03            |
| financeiro                    | Financeiro                                  | FE-CLI-06, FE-ADM-03                                  |
| funeral                       | Funeral                                     | FE-CLI-07, FE-CLI-08, FE-ADM-04, FE-ADM-05, FE-ADM-06 |
| translado                     | Translado                                   | FE-ADM-07                                             |
| documentos                    | Documentos                                  | FE-ADM-08                                             |
| terceiros                     | Terceiros                                   | FE-ADM-14, FE-TER-01                                  |
| notificacoes                  | Notificacoes                                | FE-CLI-09                                             |
| relatorios                    | Relatorios (e Identidade, para a auditoria) | FE-ADM-01, FE-ADM-13                                  |

As páginas públicas com SEO (FE-PUB-01 e FE-PUB-04) ficam no `apps/landing`.
Quem criar uma feature nova atualiza esta tabela, a do INF-01 do backend e a lista `FEATURES`
do `boundaries.js` no mesmo pull request.

## Regras de dependência

1. Pacotes (`packages/`) nunca importam código dos apps.
2. Uma feature não importa arquivos internos de outra, apenas o que ela expõe no `index.ts`.
3. Features não importam `app/`.
4. `shared/` não conhece features nem `app/`.
5. Só `app/` conhece todas as features.

Exemplo:

```ts
import { useAuth } from '@/features/auth'; // correto
import { useAuth } from '@/features/auth/sessao/contexto'; // erro de lint
```

As regras são verificadas pelo ESLint (`no-restricted-imports`), configuradas em
`packages/config/eslint/boundaries.js` (features e shared) e
`packages/config/eslint/packages.js` (pacotes). Ao criar uma nova feature,
adicione o nome na lista `FEATURES` do `boundaries.js`.

## Padrões

- TypeScript em modo estrito.
- Prettier para formatação, ESLint para qualidade e dependências.
- Commits no formato Conventional Commits (`feat:`, `fix:`, `chore:`).
