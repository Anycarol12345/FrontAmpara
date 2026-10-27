#!/bin/sh
# Gera o /config.js com as variáveis do container (FE-09).
# As variáveis do Vite são fixadas no build; assim a mesma imagem serve qualquer ambiente.
set -eu

# Escapa \ e " para o valor caber numa string JavaScript.
json() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

cat > /usr/share/nginx/html/config.js <<CONFIG
window.__AMPARA_CONFIG__ = {
  apiUrl: "$(json "${API_URL:-}")",
  hubUrl: "$(json "${HUB_URL:-/hubs/eventos}")",
  dominioBase: "$(json "${DOMINIO_BASE:-localhost}")",
  tenantPadrao: "$(json "${TENANT_PADRAO:-}")"
};
CONFIG
