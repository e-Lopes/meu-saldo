# Releases e atualizações do Meu Saldo

## Endereços públicos

- Releases: https://github.com/e-Lopes/meu-saldo/releases
- Última versão: https://github.com/e-Lopes/meu-saldo/releases/latest
- APK mais recente: https://github.com/e-Lopes/meu-saldo/releases/latest/download/meu-saldo.apk
- Informações de atualização: https://github.com/e-Lopes/meu-saldo/releases/latest/download/update.json

O app utiliza o último endereço sem token, conta ou autenticação. O repositório e as releases precisam continuar públicos. Não renomeie os assets `meu-saldo.apk` e `update.json`.

## Como o atualizador funciona

Ao entrar no app, uma consulta em segundo plano verifica uma nova versão, respeitando um intervalo de 6 horas. O botão no Menu ignora esse intervalo e verifica imediatamente. A consulta não transmite dados financeiros. Uma falha de rede não bloqueia lançamentos, histórico, gráficos ou backups.

Se `versionCode` for maior e a versão for compatível com o Android instalado, o app mostra a atualização. O usuário toca para baixar e pode cancelar o download. O APK só é oferecido ao instalador depois das verificações de tamanho, SHA-256, identificador, versão e assinatura. O aplicativo não aceita uma chave diferente da instalada.

Na primeira instalação feita pelo próprio Meu Saldo, o usuário pode precisar autorizar **Instalar apps desconhecidos** para o Meu Saldo. Depois, confirma a instalação no Android. Caso cancele, o app continua funcionando e permite tentar novamente. A instalação silenciosa não é garantida.

Versões 1.0 e 1.1 não possuem atualizador: precisam instalar a 1.2 ou superior manualmente uma vez, sobre a instalação existente.

## Por que os dados são mantidos

O atualizador utiliza exclusivamente a pasta privada `cache/updates` e suas preferências de atualização. Ele não recebe o repositório financeiro e não acessa `files/saldo.json`. O FileProvider compartilha apenas a pasta de atualizações, sem expor os registros.

Todos os APKs usam `br.com.meusaldo` e a mesma chave de assinatura. O Android instala a atualização sobre o aplicativo existente. Não há desinstalação, limpeza de dados ou restauração automática de backup. O formato financeiro permanece na versão 1.

Se uma versão futura mudar esse formato, implemente uma migração que preserve os registros antes de distribuí-la. Nunca troque a chave ou o applicationId para resolver um erro de atualização. Limpar dados ou desinstalar continua removendo os registros; o backup manual continua disponível.

## Configuração inicial do GitHub Actions

Execute uma única vez, na máquina que contém a assinatura original, com GitHub CLI autenticado e permissão administrativa no repositório:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/configure-github-signing.ps1
```

O script envia quatro secrets criptografados: `MEUSALDO_KEYSTORE_BASE64`, `MEUSALDO_STORE_PASSWORD`, `MEUSALDO_KEY_ALIAS` e `MEUSALDO_KEY_PASSWORD`. Não imprime os valores. A chave base64 é privada; não a coloque em arquivos públicos, issues ou logs. Mantenha uma cópia segura da chave e das senhas fora do GitHub também.

`release/signing-certificate.sha256` contém somente a impressão digital pública do certificado original. O preparador de releases compara esse valor com o APK e recusa uma assinatura diferente.

## Publicar uma versão

1. Atualize `versionName` e aumente `versionCode` em `app/build.gradle.kts`. Use versões como `1.3.0`, sem sufixos. Atualize `release/notes.md` com as mudanças reais dessa versão.
2. Faça a validação manual que considerar necessária e envie o código para `main`.
3. Crie e envie uma tag exatamente igual à versão, com prefixo `v`:

```powershell
git tag v1.3.0
git push origin main
git push origin v1.3.0
```

4. Acompanhe **Actions → Publicar APK Android**. O workflow usa a chave original, compila o release, verifica assinatura e versão e publica os dois assets. Não executa testes automatizados.

As releases existentes não são sobrescritas. Para corrigir uma versão publicada, aumente o versionCode, use uma nova versão/tag e publique novamente. Uma falha de compilação não publica uma release incompleta. Os arquivos são anexados antes de tornar a release pública. Evite publicar releases sem assets ou marcar manualmente versões antigas como latest, pois o app consulta latest.

Também é possível iniciar o workflow manualmente em Actions. Nesse caso, ele publica a versão definida no código escolhido; se já existir, recusa a operação.

## Publicação local alternativa

Compile com a assinatura original e prepare os arquivos (ajuste o caminho do SDK):

```powershell
.\gradlew.bat assembleRelease
python scripts/prepare_release.py --apk app/build/outputs/apk/release/app-release.apk --aapt CAMINHO_DO_SDK/build-tools/35.0.0/aapt.exe --apksigner CAMINHO_DO_SDK/build-tools/35.0.0/apksigner.bat --tag v1.2.0
gh release create v1.2.0 .dist/release/meu-saldo.apk .dist/release/update.json --repo e-Lopes/meu-saldo --target main --title "Meu Saldo 1.2.0" --notes-file release/notes.md --latest
```

O script requer Python 3.11 ou superior e usa apenas a biblioteca padrão. A versão, tamanho, hash e URL são gerados a partir do APK compilado e do código; não edite `update.json` à mão.

## Interface do update.json

Os campos são `versionCode` (inteiro crescente), `versionName` (X.Y.Z), `minSdk`, `apkUrl` (asset da tag correspondente), `sha256` (hexadecimal), `sizeBytes` e `notes`. O app aceita apenas HTTPS e downloads do repositório configurado. As URLs de redirecionamento são limitadas ao GitHub e seus servidores de assets. O APK tem limite de 100 MB e as informações de versão, 64 KB.

Fontes: [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository), [secrets do Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [autorização de instalação no Android](https://developer.android.com/reference/android/content/pm/PackageManager#canRequestPackageInstalls()).
