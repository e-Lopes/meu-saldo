$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$keyPath = Join-Path $projectRoot '.tools/meu-saldo-release.jks'
$propsPath = Join-Path $projectRoot 'keystore.properties'
if ((Test-Path -LiteralPath $keyPath) -or (Test-Path -LiteralPath $propsPath)) { throw 'Chave ou configuração já existe. Preserve a assinatura original.' }
New-Item -ItemType Directory -Force (Join-Path $projectRoot '.tools') | Out-Null
$randomBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($randomBytes)
$rng.Dispose()
$signingPassword = [Convert]::ToBase64String($randomBytes)
$env:MEUSALDO_SIGNING_PASSWORD = $signingPassword
try {
    & keytool -genkeypair -keystore $keyPath -storetype JKS -alias meu-saldo -keyalg RSA -keysize 3072 -validity 10000 -storepass:env MEUSALDO_SIGNING_PASSWORD -keypass:env MEUSALDO_SIGNING_PASSWORD -dname 'CN=Meu Saldo, OU=Aplicativo local, O=Meu Saldo, C=BR'
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar chave de assinatura.' }
    [System.IO.File]::WriteAllText($propsPath, "storeFile=.tools/meu-saldo-release.jks`nstorePassword=$signingPassword`nkeyAlias=meu-saldo`nkeyPassword=$signingPassword`n")
    Write-Output 'Assinatura criada. Guarde a chave e keystore.properties em um local seguro.'
} finally { Remove-Item Env:MEUSALDO_SIGNING_PASSWORD -ErrorAction SilentlyContinue }
