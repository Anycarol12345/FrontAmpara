# Imagem do apps/landing (FE-09): build standalone do Next.js.
# Build a partir da raiz do monorepo: docker build -f apps/landing/Dockerfile -t ampara-landing .
# As variáveis NEXT_PUBLIC_* são fixadas no build e vão como build args.

FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_APP_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm install --frozen-lockfile --filter "@ampara/landing..."
RUN pnpm --filter @ampara/landing build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /repo/apps/landing/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/landing/.next/static ./apps/landing/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/landing/server.js"]
