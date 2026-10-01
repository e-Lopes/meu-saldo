# Meu Saldo — Android

Aplicativo Android nativo, gratuito e offline, desenvolvido em Kotlin e Jetpack Compose. Android 8.0 ou superior. A imagem `imagem-ilustrativa.jpg` é apenas referência visual.

## Privacidade e armazenamento

Sem navegador, login, Google Drive, banco de dados, backend financeiro, anúncios ou analytics. Categorias e lançamentos ficam em `files/saldo.json`, dentro do armazenamento privado do app. A gravação é atômica: a interface só publica alterações depois de salvar. Dados inválidos não são sobrescritos automaticamente.

A internet é usada exclusivamente para consultar versões e baixar APKs do GitHub Releases. Nenhum lançamento, categoria, saldo ou backup é enviado. O GitHub recebe os dados normais de uma requisição de download, como IP e identificação da versão do app. Sem conexão, todos os recursos financeiros continuam funcionando.

O backup automático e a transferência automática de dados do Android estão desativados. Desinstalar ou limpar os dados apaga os registros. Faça backups manuais regularmente. O backup JSON não é criptografado; quem tiver acesso ao arquivo pode ler os dados.

O limite do arquivo local e de restauração é de 10 MB. Ao atingir o limite, o app informa a falha e preserva a versão anterior.

## Uso

- Início: selecione o mês e consulte saldo, receitas, despesas e categorias.
- Adicionar: registre receita ou despesa em tela completa; escolha a categoria pelo ícone, a data pelo calendário e informe valores como `125,50`.
- Transações: filtre e toque em um lançamento para editar ou excluir.
- Gráficos: Pareto dos gastos e comparação dos últimos seis meses.
- Menu: gerencie categorias ou exporte/restaure backups pelo seletor de arquivos do Android.
- Atualizações: ao abrir, o app consulta novas versões no máximo a cada 6 horas. No Menu, você também pode verificar imediatamente. Quando houver uma nova versão, toque em **Baixar e atualizar** e confirme no instalador do Android.

O saldo não é o saldo bancário: é receitas menos despesas do mês, sem transportar saldo anterior. Categorias utilizadas são arquivadas em vez de excluídas. Recorrências, sincronização, orçamento e datas de corte não fazem parte desta versão.

## Desenvolvimento

Abra a raiz no Android Studio. Instale Android SDK Platform 35 e Build Tools 35.0.0. Use JDK 17 ou 21 e Gradle 8.11.1. Na primeira compilação, ferramentas e dependências precisam de internet; o aplicativo instalado funciona offline.

```powershell
.\gradlew.bat assembleDebug
```

O SDK pode ser configurado em `local.properties` com `sdk.dir=C:/caminho/Android/Sdk`. O arquivo não entra no Git.

## APK assinado

Gere sua chave uma única vez usando `scripts/create-signing.ps1`. A chave e as senhas serão guardadas em arquivos ignorados pelo Git. Se os arquivos já existirem, o script não os substitui.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/create-signing.ps1
.\gradlew.bat assembleRelease
```

APK: `app/build/outputs/apk/release/app-release.apk`. A versão atual está em `.dist/meu-saldo-1.2.0.apk`. O download público fica em [GitHub Releases](https://github.com/e-Lopes/meu-saldo/releases/latest), com um [link fixo para o APK mais recente](https://github.com/e-Lopes/meu-saldo/releases/latest/download/meu-saldo.apk). Compartilhe somente o APK por arquivo ou link. No celular, autorize a instalação de apps pelo aplicativo que abriu o APK. Não é necessário publicar na Play Store.

A versão 1.1 traz categorias em grade no início, gráficos com rótulos, histórico agrupado por dia, formulário em tela completa e calendário para a data. Instale o APK sobre a versão 1.0 para preservar os registros.

A versão 1.2 inclui o atualizador. Quem está na versão 1.0 ou 1.1 precisa instalar a 1.2 manualmente uma única vez, sem desinstalar. A partir dela, o app busca novas versões e baixa a atualização quando você solicita. O Android pode pedir autorização para instalar apps pelo Meu Saldo e confirmação da instalação; não há promessa de instalação silenciosa.

Antes de abrir o instalador, o app verifica tamanho, SHA-256, identificador, versão e assinatura do APK. Os arquivos de atualização ficam separados em `cache/updates`; o atualizador não lê nem modifica `files/saldo.json`. A assinatura e o identificador originais são preservados para atualizar mantendo os registros.

Guarde uma cópia segura de `.tools/meu-saldo-release.jks` e `keystore.properties` fora do projeto. Não compartilhe esses arquivos com quem recebe o APK. Sem a chave original você não poderá atualizar o app existente.

Para atualizar, mantenha `applicationId` e chave de assinatura, aumente `versionCode` e atualize `versionName` em `app/build.gradle.kts`. Instale sobre a versão anterior, sem desinstalar. Mudanças futuras no formato JSON precisam de migração explícita antes de incrementar sua versão.

## Publicar próximas versões

O workflow `.github/workflows/release.yml` compila e publica uma release ao enviar uma tag `vX.Y.Z`. Não executa a suíte de testes. A chave original fica nos secrets criptografados do GitHub Actions, nunca no Git ou no APK. A publicação gera `meu-saldo.apk` e `update.json` juntos e recusa APKs com assinatura diferente da original.

Veja [o guia de releases e atualizações](docs/releases.md) para configurar secrets, publicar versões e entender a preservação dos dados. A validação das telas continua manual, conforme a proposta do projeto.

## Validação

Foi mantido apenas um arquivo de testes unitários essenciais para cálculos e integridade dos dados. A execução é opcional: `.\gradlew.bat testDebugUnitTest`. Não há suíte de testes automatizados de interface; a validação das telas fica para os testes manuais.

Antes de distribuir, valide em aparelho ou emulador: criar/editar/excluir, reiniciar o app, exportar/restaurar, cancelar seleção de arquivo, usar modo avião, ampliar fontes e instalar atualização preservando dados. Testes unitários não substituem a verificação da gravação atômica no Android real.

Ferramentas oficiais: [Android Studio](https://developer.android.com/studio), [Jetpack Compose](https://developer.android.com/develop/ui/compose), [AtomicFile](https://developer.android.com/reference/android/util/AtomicFile).
