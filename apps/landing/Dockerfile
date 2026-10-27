# Imagem do apps/landing (FE-09): build standalone do Next.js.
# Build a partir da raiz do monorepo: docker build -f apps/landing/Dockerfile -t ampara-landing .

FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
# O repasse de /api para o backend (rewrites do next.config) é fixado no build.
ARG API_URL_INTERNA=http://api:8080
ENV API_URL_INTERNA=$API_URL_INTERNA \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm install --frozen-lockfile --filter "@ampara/landing..."
RUN pnpm --filter @ampara/landing build

FROM node:22-alpine
WORKDIR /app
# Lidas em tempo de execução pelo servidor do Next.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    API_URL_INTERNA=http://api:8080 \
    DOMINIO_BASE=localhost \
    APP_URL=http://localhost:8080
COPY --from=build --chown=node:node /repo/apps/landing/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/landing/.next/static ./apps/landing/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/landing/server.js"]
