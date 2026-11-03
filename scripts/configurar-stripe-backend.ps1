# Prepara o backend local para o Stripe em modo de teste (COB-05, COB-06):
#  - confere a STRIPE_SECRET_KEY no .env do backend;
#  - grava em STRIPE_WEBHOOK_SECRET o segredo que o "stripe listen" usa para assinar os eventos;
#  - cria o docker-compose.override.yml que repassa as duas variáveis para a API (fora do git do backend).
# Depois, recrie a API: docker compose up -d --no-build --no-deps api (na pasta do backend).
param(
  [string]$Backend = "$HOME\Ampara_beck\Ampara",
  [string]$Stripe = "$env:LOCALAPPDATA\stripe-cli\stripe.exe"
)

$ErrorActionPreference = 'Stop'
$arquivoEnv = Join-Path $Backend '.env'
$linhas = [System.Collections.Generic.List[string]](Get-Content $arquivoEnv)

$chave = ($linhas | Where-Object { $_ -match '^STRIPE_SECRET_KEY=(.+)$' } | Select-Object -First 1)
if (-not $chave) {
  throw "Coloque STRIPE_SECRET_KEY=sk_test_... em $arquivoEnv e rode de novo."
}
$chave = $chave.Substring('STRIPE_SECRET_KEY='.Length).Trim()

$segredo = (& $Stripe listen --print-secret --api-key $chave).Trim()
if (-not $segredo.StartsWith('whsec_')) { throw "O Stripe CLI não devolveu o segredo do webhook." }

$sem = $linhas | Where-Object { $_ -notmatch '^STRIPE_WEBHOOK_SECRET=' }
$novas = [System.Collections.Generic.List[string]]($sem)
$novas.Add("STRIPE_WEBHOOK_SECRET=$segredo")
# UTF-8 sem BOM: o Windows PowerShell põe BOM com -Encoding utf8, e o docker compose leria a 1ª variável errada.
[IO.File]::WriteAllLines($arquivoEnv, $novas, (New-Object Text.UTF8Encoding $false))

$override = Join-Path $Backend 'docker-compose.override.yml'
if (-not (Test-Path $override)) {
  Set-Content -Path $override -Encoding utf8 -Value @(
    '# Configuração local (não vai para o repositório): repassa o Stripe do .env para a API.',
    'services:',
    '  api:',
    '    environment:',
    '      Stripe__SecretKey: ${STRIPE_SECRET_KEY:-}',
    '      Stripe__WebhookSecret: ${STRIPE_WEBHOOK_SECRET:-}'
  )
}
$exclude = Join-Path $Backend '.git\info\exclude'
if ((Test-Path $exclude) -and -not (Select-String -Path $exclude -Pattern '^docker-compose\.override\.yml$' -Quiet)) {
  Add-Content -Path $exclude -Value 'docker-compose.override.yml'
}

Write-Host "STRIPE_SECRET_KEY: definida ($($chave.Substring(0, 8))...)"
Write-Host "STRIPE_WEBHOOK_SECRET: gravada ($($segredo.Substring(0, 6))...)"
Write-Host "docker-compose.override.yml: $(if (Test-Path $override) { 'ok' } else { 'faltando' })"
