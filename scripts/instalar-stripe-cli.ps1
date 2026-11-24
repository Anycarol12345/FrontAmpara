# Instala o Stripe CLI (github.com/stripe/stripe-cli) em %LOCALAPPDATA%\stripe-cli, conferindo a soma SHA-256
# com a publicada pelo Stripe. Usado pelo scripts/stripe-webhook.ps1.
param([string]$Versao = '1.55.6')

$ErrorActionPreference = 'Stop'
$destino = Join-Path $env:LOCALAPPDATA 'stripe-cli'
$download = Join-Path $destino 'download'
New-Item -ItemType Directory -Force -Path $download | Out-Null

$base = "https://github.com/stripe/stripe-cli/releases/download/v$Versao"
$zip = Join-Path $download "stripe_$($Versao)_windows_x86_64.zip"
$somas = Join-Path $download 'stripe-windows-checksums.txt'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -UseBasicParsing -Uri "$base/stripe_$($Versao)_windows_x86_64.zip" -OutFile $zip
Invoke-WebRequest -UseBasicParsing -Uri "$base/stripe-windows-checksums.txt" -OutFile $somas

$esperada = (Select-String -Path $somas -Pattern 'windows_x86_64\.zip').Line.Split(' ')[0]
$obtida = (Get-FileHash -Algorithm SHA256 $zip).Hash.ToLower()
if ($esperada -ne $obtida) { throw "Soma SHA-256 diferente da publicada pelo Stripe: o arquivo não foi instalado." }

Expand-Archive -Force -Path $zip -DestinationPath $destino
& (Join-Path $destino 'stripe.exe') version
Write-Host "Stripe CLI instalado em $destino"
