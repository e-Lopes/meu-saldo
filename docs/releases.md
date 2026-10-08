# Releases e atualizações do Meu Saldo

## Endereços públicos

- Releases: https://github.com/e-Lopes/meu-saldo/releases
- Última versão: https://github.com/e-Lopes/meu-saldo/releases/latest
- APK mais recente: https://github.com/e-Lopes/meu-saldo/releases/latest/download/meu-saldo.apk
- Informações de atualização: https://github.com/e-Lopes/meu-saldo/releases/latest/download/update.json

O app utiliza o último endereço sem token, conta ou autenticação. O repositório e as releases precisam continuar públicos. Não renomeie os assets `meu-saldo.apk` e `update.json`.

## Como o atualizador funciona

Ao entrar no app, uma consulta em segundo plano verifica uma nova versão, respeitando um intervalo de 6 horas. O botão nos Ajustes ignora esse intervalo e verifica imediatamente. A consulta não transmite dados financeiros. Uma falha de rede não bloqueia lançamentos, histórico, gráficos ou backups.

Se `versionCode` for maior e a versão for compatível com o Android instalado, o app mostra a atualização. O usuário toca para baixar e pode cancelar o download. O APK só é oferecido ao instalador depois das verificações de tamanho, SHA-256, identificador, versão e assinatura. O aplicativo não aceita uma chave diferente da instalada.

Na primeira instalação feita pelo próprio Meu Saldo, o usuário pode precisar autorizar **Instalar apps desconhecidos** para o Meu Saldo. Depois, confirma a instalação no Android. Caso cancele, o app continua funcionando e permite tentar novamente. A instalação silenciosa não é garantida.

As versões históricas 1.0 e 1.1, anteriores à migração, não possuem atualizador: precisam instalar uma versão atual manualmente uma vez, sobre a instalação existente. A nova 1.0.0, com `versionCode` 8, mantém o atualizador e sucede a 1.5.0.

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

## Preparar uma versão

Em 03/10/2026, a próxima entrega recebeu a versão pública `1.0.0`, sucedendo a `1.5.0`, por decisão do responsável pelo projeto. O `versionCode` aumenta de 7 para 8, preservando a ordem de atualização no Android. Foi uma alteração excepcional nos arquivos de configuração; o comando abaixo continua exigindo uma versão pública maior que a atual. As notas da 1.5.0 estão em `release/history/1.5.0.md`. A numeração reiniciada não autoriza reutilizar tags ou sobrescrever releases existentes; confira os números já publicados ao escolher as próximas versões.

Na raiz do projeto:

```powershell
npm run release:prepare -- 1.0.1
```

O comando exige X.Y.Z maior que a versão atual, alinha `app.json`, `package.json` e as duas versões do `package-lock.json`, e incrementa `android.versionCode` uma vez. Não cria commit, tag nem publicação. As notas anteriores são preservadas em `release/history/<versão>.md`; `release/notes.md` recebe um modelo para a nova versão.

Edite `release/notes.md` com as mudanças reais. O marcador `RELEASE_NOTES_PENDING` bloqueia a geração dos assets até ser removido. Para simular sem alterar arquivos:

```powershell
npm run release:prepare -- 1.0.1 --dry-run
```

Execute `npm run validate`, faça commit dos arquivos e envie o código. A versão do exemplo deve ser ajustada para uma versão ainda não publicada.

## Geração automática de candidatos

O envio à `main` de alterações em `app.json`, `release/notes.md`, no workflow de geração ou em `scripts/check_release.py` dispara a geração e publicação automática após as verificações técnicas. A consulta inicial pula versões já publicadas com APK e manifesto completos; drafts, pré-releases incompletas e falhas de consulta não são tratados como versões disponíveis para sobrescrita.

Para cada entrega:

1. Prepare uma versão ainda não publicada com `npm run release:prepare -- X.Y.Z`.
2. Complete `release/notes.md`, registrando validações realizadas e pendentes.
3. Faça commit das mudanças e push para `main`.
4. Acompanhe o workflow **Gerar candidato Android**. Ele verifica tipos, formatação, cálculos, backups e scripts, compila em Linux com a assinatura original, arquiva o candidato, verifica novamente o APK e publica a release como `latest`. A conferência em aparelho físico deve ser registrada separadamente; a automação não declara que ela aconteceu.

Na publicação, o script cria a tag no commit compilado e marca a release como `latest`. Isso permite que o atualizador do celular encontre também a numeração reiniciada 1.0.0. Não há recompilação na publicação nem substituição de releases existentes. O `versionCode` precisa superar todas as releases públicas. Um push com uma nova versão preparada publica o novo APK; versões já publicadas são ignoradas.

Pushes à `main` publicam automaticamente uma versão ainda não publicada após as verificações técnicas. Em **Run workflow**, marque **Publicar automaticamente depois de compilar e verificar** para publicar, ou deixe desmarcado para gerar apenas um candidato. A automação não declara que houve teste no celular.

## Alternativa manual: gerar candidato → conferir no celular → publicar

1. Em **Actions → Gerar candidato Android → Run workflow**, escolha o commit/branch preparado e deixe a opção de publicação automática desmarcada. Nesse modo o workflow somente compila. Não há disparo por tags.
2. Depois de concluir, baixe o artefato **meu-saldo-candidate**. Ele contém `meu-saldo.apk`, `update.json` e `release-notes.md`, com retenção de 30 dias. Anote o ID da execução mostrado no resumo e na URL de Actions (`.../actions/runs/ID`).
3. Instale esse APK sobre uma versão release anterior, sem desinstalar. Confira registros, cadastre um lançamento, exporte um backup e restaure-o. Use dados fictícios na conferência; valide também tema escuro fixo, valores sempre visíveis, fontes ampliadas e modo avião.
4. Abra **Actions → Publicar candidato Android → Run workflow**, informe o ID da execução escolhida e marque a confirmação de publicação. Sem essa confirmação, o job de publicação não é executado. A confirmação autoriza publicar o candidato; ela não declara que houve teste em aparelho físico. Registre nas notas as verificações realizadas e as que ainda estiverem pendentes.
5. O workflow obtém o artefato da execução informada e faz checkout do commit que o produziu. Verifica novamente assinatura, identificador, versão, tamanho, SHA-256 e correspondência das notas. Não executa npm, prebuild ou Gradle e não regrava os arquivos do candidato.
6. Publica exatamente `meu-saldo.apk` e `update.json` do candidato, usando as notas arquivadas nele. A tag `vX.Y.Z` é criada no commit da compilação; uma tag já existente só é aceita se apontar para esse mesmo commit. A release nasce como draft, recebe os assets e então se torna pública e latest.

Não é preciso criar ou enviar a tag manualmente. Candidatos de outro repositório, de outro workflow, de execução que não terminou com sucesso ou com artefato expirado são recusados. Alterações feitas depois do candidato não entram nessa publicação.

Releases existentes, inclusive drafts, nunca são sobrescritas. Um candidato com `versionCode` menor ou igual ao de uma release pública também é recusado. Se uma falha deixar um draft, confira-o no GitHub antes de decidir removê-lo ou finalizá-lo; uma nova tentativa não substituirá seus arquivos automaticamente. Se o candidato expirou ou precisa de correção, gere e confira outro candidato.

As versões antigas 1.0/1.1, anteriores ao atualizador, podem não ter `update.json`; o verificador trata essas tags históricas separadamente.

## Verificações de desenvolvimento

```powershell
npm run validate
npm test
python scripts/test_release_tools.py
```

`validate` verifica TypeScript e formatação. `npm test` executa cinco testes focados nos módulos TypeScript reais: valores em centavos, datas, backups válidos/inválidos e totais mensais, sem dependências de teste adicionais. Os onze testes dos scripts de release usam arquivos temporários e ferramentas simuladas: verificam alinhamento de versões, recusas, assinatura, integridade do candidato e publicação sem alterar bytes. Não instalam o aplicativo, não acessam a rede nem substituem a conferência em aparelho físico ou os testes do formulário.

O workflow **Validar projeto** executa essas verificações e a conferência de configuração em todos os pushes e PRs, sem assinatura, publicação ou geração de APK. PRs usam apenas permissão de leitura, sem secrets de assinatura. As Actions dos workflows estão fixadas por SHA; o Dependabot propõe atualizações semanais dessas referências. Mudanças propostas devem passar pela validação antes de serem incorporadas.

O GitHub Actions gera Android em Linux usando a configuração Expo, o plugin e o módulo local. `android/` continua gerada e ignorada pelo Git. Não há EAS obrigatório.

## Compilação local alternativa

Para diagnóstico ou conferência local, compile com a assinatura original:

```powershell
npm ci
npx expo prebuild --platform android --no-install
.\android\gradlew.bat -p android assembleRelease '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64'
python scripts/prepare_release.py --apk android/app/build/outputs/apk/release/app-release.apk --aapt CAMINHO_DO_SDK/build-tools/36.0.0/aapt.exe --apksigner CAMINHO_DO_SDK/build-tools/36.0.0/apksigner.bat
```

Para distribuir pelo procedimento padrão, use um candidato gerado no Actions. O script requer Python 3.11 ou superior e usa a biblioteca padrão. APKs acima de 100 MB são recusados para preservar compatibilidade com o atualizador da versão 1.2. O APK continua incluindo armeabi-v7a, arm64-v8a e x86_64.

## Interface do update.json

Os campos são `versionCode` (inteiro crescente), `versionName` (X.Y.Z), `minSdk`, `apkUrl` (asset da tag correspondente), `sha256` (hexadecimal), `sizeBytes` e `notes`. O app aceita apenas HTTPS e downloads do repositório configurado. As URLs de redirecionamento são limitadas ao GitHub e seus servidores de assets. O APK tem limite de 100 MB e as informações de versão, 64 KB.

Fontes: [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository), [secrets do Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [autorização de instalação no Android](https://developer.android.com/reference/android/content/pm/PackageManager#canRequestPackageInstalls()).

Referências do fluxo de promoção: [download de artefatos de outra execução](https://github.com/actions/download-artifact#download-artifacts-from-other-workflow-runs-or-repositories), [criação de releases pelo GitHub CLI](https://cli.github.com/manual/gh_release_create).
