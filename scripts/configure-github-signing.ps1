param([string]$Repository = 'e-Lopes/meu-saldo')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$values = @{}
Get-Content -LiteralPath (Join-Path $projectRoot 'keystore.properties') | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') { $values[$matches[1]] = $matches[2] }
}
$keyPath = Join-Path $projectRoot $values['storeFile']
if (-not (Test-Path -LiteralPath $keyPath)) { throw 'Original signing key was not found.' }
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes($keyPath)) | gh secret set MEUSALDO_KEYSTORE_BASE64 --repo $Repository
if ($LASTEXITCODE -ne 0) { throw 'Could not upload the signing key as an encrypted Actions secret.' }
foreach ($pair in @(@('MEUSALDO_STORE_PASSWORD', 'storePassword'), @('MEUSALDO_KEY_ALIAS', 'keyAlias'), @('MEUSALDO_KEY_PASSWORD', 'keyPassword'))) {
    if (-not $values[$pair[1]]) { throw 'Missing signing property.' }
    $values[$pair[1]] | gh secret set $pair[0] --repo $Repository
    if ($LASTEXITCODE -ne 0) { throw 'Could not configure an Actions signing secret.' }
}
Write-Output 'The four signing secrets are configured. No credentials were written to the repository.'
