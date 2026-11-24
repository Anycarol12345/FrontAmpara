# Imagem do apps/web (FE-09): build com pnpm e arquivos estáticos servidos pelo nginx.
# Build a partir da raiz do monorepo: docker build -f apps/web/Dockerfile -t ampara-web .

FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter "@ampara/web..."
RUN pnpm --filter @ampara/web build

FROM nginx:1.27-alpine
# Templates em /etc/nginx/templates passam pelo envsubst ao iniciar (imagem oficial do nginx).
COPY apps/web/docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY apps/web/docker/gerar-config.sh /docker-entrypoint.d/40-gerar-config.sh
RUN chmod +x /docker-entrypoint.d/40-gerar-config.sh
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

# Endereço do backend visto pelo nginx; /api e /hubs são repassados para ele (mesma origem, sem CORS).
ENV API_UPSTREAM=api:8080 \
    API_URL="" \
    HUB_URL=/hubs/notificacoes \
    DOMINIO_BASE=localhost \
    TENANT_PADRAO="" \
    SITE_URL=http://localhost:3000

EXPOSE 80
