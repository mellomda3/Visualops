# Crea usuarios demo en Supabase Auth (requiere service role key).
# Uso: .\scripts\seed-users.ps1 -Url "https://xxx.supabase.co" -ServiceRoleKey "eyJ..."

param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [Parameter(Mandatory = $true)]
    [string]$ServiceRoleKey,
    [string]$Password = "demo1234"
)

$users = @(
    @{ email = "admin@visualops.local"; full_name = "Admin"; role = "admin" },
    @{ email = "recepcion@visualops.local"; full_name = "Recepcion"; role = "recepcion" },
    @{ email = "graduacion@visualops.local"; full_name = "Graduacion"; role = "graduador" },
    @{ email = "optico@visualops.local"; full_name = "Optico"; role = "optico" }
)

$headers = @{
    apikey         = $ServiceRoleKey
    Authorization  = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
}

foreach ($u in $users) {
    $body = @{
        email         = $u.email
        password      = $Password
        email_confirm = $true
        user_metadata = @{
            full_name = $u.full_name
            role      = $u.role
        }
    } | ConvertTo-Json -Depth 5

    try {
        $resp = Invoke-RestMethod -Method Post -Uri "$Url/auth/v1/admin/users" -Headers $headers -Body $body
        Write-Host "OK $($u.email) -> $($resp.id)"
    }
    catch {
        $msg = $_.Exception.Message
        if ($msg -match "already") {
            Write-Host "SKIP $($u.email) (ya existe)"
        }
        else {
            Write-Error "FAIL $($u.email): $msg"
        }
    }
}

Write-Host "Listo. Password demo: $Password"
