# Repassa os eventos do Stripe (modo de teste) para o backend local, em /api/v1/webhooks/stripe (COB-06).
# Inclui os eventos das contas conectadas das funerárias (Connect). Deixe rodando enquanto testa os pagamentos.
#
# Uso:  powershell -File scripts/stripe-webhook.ps1 [-EnvBackend caminho\do\.env] [-Api http://localhost:5080]
#
# A chave secreta vem do STRIPE_SECRET_KEY no .env do backend; o segredo do webhook que o backend usa
# (STRIPE_WEBHOOK_SECRET) é o que "stripe listen --print-secret" mostra para essa mesma chave.
param(
  [string]$EnvBackend = "$HOME\Ampara_beck\Ampara\.env",
  [string]$Api = 'http://localhost:5080',
  [string]$Stripe = "$env:LOCALAPPDATA\stripe-cli\stripe.exe"
)

$linha = Select-String -Path $EnvBackend -Pattern '^STRIPE_SECRET_KEY=(.+)$' | Select-Object -First 1
if (-not $linha) { throw "STRIPE_SECRET_KEY não encontrada em $EnvBackend" }
$chave = $linha.Matches[0].Groups[1].Value.Trim()

$destino = "$Api/api/v1/webhooks/stripe"
Write-Host "Repassando os eventos do Stripe para $destino (Ctrl+C para parar)"
& $Stripe listen --api-key $chave --all-snapshot --forward-to $destino --forward-connect-to $destino
