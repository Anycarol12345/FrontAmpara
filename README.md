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
│   ├── ui/         (a criar) componentes shadcn/ui e tema compartilhados
│   ├── api-client/ (a criar) client gerado pelo Orval a partir do OpenAPI do backend
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

## Comandos

| Comando             | O que faz                                  |
| ------------------- | ------------------------------------------ |
| `pnpm dev`          | Sobe todos os apps em modo desenvolvimento |
| `pnpm build`        | Build de todos os pacotes e apps           |
| `pnpm lint`         | ESLint, incluindo as regras de dependência |
| `pnpm typecheck`    | Checagem de tipos (TypeScript strict)      |
| `pnpm test`         | Testes                                     |
| `pnpm format`       | Formata o código com Prettier              |
| `pnpm format:check` | Verifica a formatação sem alterar arquivos |

Para rodar um app isolado:

```bash
pnpm --filter @ampara/web dev
pnpm --filter @ampara/landing dev
```

## Variáveis de ambiente

| App       | Arquivo local | Variáveis                                    |
| --------- | ------------- | -------------------------------------------- |
| `web`     | `.env`        | `VITE_API_URL`                               |
| `landing` | `.env.local`  | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` |

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
import { LoginPage } from '@/features/auth'; // correto
import { useAuth } from '@/features/auth/hooks/useAuth'; // erro de lint
```

As regras são verificadas pelo ESLint (`no-restricted-imports`), configuradas em
`packages/config/eslint/boundaries.js` (features e shared) e
`packages/config/eslint/packages.js` (pacotes). Ao criar uma nova feature,
adicione o nome na lista `FEATURES` do `boundaries.js`.

## Padrões

- TypeScript em modo estrito.
- Prettier para formatação, ESLint para qualidade e dependências.
- Commits no formato Conventional Commits (`feat:`, `fix:`, `chore:`).
