# Configura Supabase remoto: link, migraciones y usuarios demo.
# Requiere: SUPABASE_ACCESS_TOKEN en el entorno O pasar -AccessToken

param(
    [string]$AccessToken = $env:SUPABASE_ACCESS_TOKEN,
    [string]$ProjectRef = "visualops",
    [string]$DbPassword = "",
    [string]$ServiceRoleKey = "",
    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not $AccessToken) {
    Write-Host @"
Falta SUPABASE_ACCESS_TOKEN.
1. Entra a https://supabase.com/dashboard/account/tokens
2. Genera un token (scopes: projects + database)
3. Ejecuta: `$env:SUPABASE_ACCESS_TOKEN='sbp_...'; .\scripts\setup-supabase.ps1
"@
    exit 1
}

$env:SUPABASE_ACCESS_TOKEN = $AccessToken

Write-Host ">> Creando proyecto (si no existe)..."
$createArgs = @("projects", "create", $ProjectRef, "--db-password", $(if ($DbPassword) { $DbPassword } else { -join ((65..90 + 97..122 + 48..57 | Get-Random -Count 24 | ForEach-Object { [char]$_ })) }), "--region", "sa-east-1")
try {
    npx --yes supabase @createArgs 2>&1
}
catch {
    Write-Host "Proyecto puede existir ya; continuando..."
}

Write-Host ">> Vinculando proyecto..."
npx --yes supabase link --project-ref $ProjectRef

Write-Host ">> Aplicando migraciones..."
npx --yes supabase db push

$url = "https://$ProjectRef.supabase.co"
Write-Host ">> URL: $url"

if (-not $SkipSeed -and $ServiceRoleKey) {
    & "$root\scripts\seed-users.ps1" -Url $url -ServiceRoleKey $ServiceRoleKey
}

Write-Host @"

Siguiente:
1. Copia URL y anon key desde Project Settings > API
2. Crea .env local (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
3. Netlify: npx netlify env:set VITE_SUPABASE_URL ... && npx netlify env:set VITE_SUPABASE_ANON_KEY ...
4. android/local.properties: SUPABASE_URL y SUPABASE_ANON_KEY
"@
