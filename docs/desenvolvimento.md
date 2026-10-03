# Desenvolvimento do Meu Saldo

Guia para configurar o ambiente, contribuir com o código e entender a arquitetura do aplicativo. Para conhecer os recursos e instalar o app, consulte o [README](../README.md).

O projeto é uma aplicação Android independente em Expo, React Native e TypeScript. Pode ser clonado sem workspace externo.

## Estado atual

O aplicativo possui início com saldo mensal, cadastro e edição de receitas/despesas, categorias, histórico com busca e filtros, gráficos, backup manual e atualizador por GitHub Releases.

Os Gráficos oferecem gastos por categoria com acesso ao Histórico e evolução dos seis meses com seleção de período. O Menu destaca a privacidade e reúne categorias, atualizações, ajuda e cópia de segurança em opções expansíveis.

Temas claro, escuro e do sistema e ocultação de valores ficam salvos localmente. O Histórico usa lista virtualizada, mostra o saldo filtrado e preserva filtros ao editar. Categorias têm busca, contagem de lançamentos e seção de arquivadas. Exclusões podem ser desfeitas por 15 segundos, ampliados conforme a configuração de acessibilidade do Android.

Categorias oferecem 24 ícones e um emoji personalizado com prévia em “Cor e ícone”. As opções são preservadas nos backups JSON. No tema escuro, os destaques selecionados em Gráficos usam azul.

Novos lançamentos começam no mês visualizado, com data ajustável. O formulário mantém Salvar acessível com o teclado aberto e mostra erros junto ao campo. As abas preservam o mês escolhido e oferecem um atalho ao mês atual.

A navegação usa tabs de Início/Histórico/Gráficos/Menu e telas modais para lançamentos e categorias. A orientação é fixa em retrato. A imagem `imagem-ilustrativa.jpg` é apenas referência visual.

O app instalado funciona offline. Não possui API financeira, autenticação, banco de dados, Google Drive, anúncios ou analytics. A internet é usada somente para verificar versões e baixar APKs.

## Responsabilidade

O aplicativo é responsável pela experiência de usuário, navegação, estado local, formulários, acessibilidade, validação e cálculos financeiros. Valores são centavos inteiros; datas são civis, sem conversão para UTC. O saldo é receitas menos despesas do mês, sem transportar saldo anterior.

O módulo Android local é responsável pela gravação atômica do JSON, seletor de backup e instalação de atualizações verificadas. Nenhum lançamento ou categoria é enviado para serviços remotos.

## Requisitos e instalação

- Node.js 22.13 ou superior na linha 22;
- npm 10, com `package-lock.json` versionado;
- JDK 21;
- Android SDK Platform 36 e Build Tools 36.0.0;
- aparelho físico com Android 8 ou superior para desenvolvimento e validação manual.

Na raiz deste repositório:

```powershell
npm ci
```

Configure `ANDROID_HOME` para o SDK. O Gradle instala o NDK e CMake necessários na primeira compilação. Ferramentas e dependências precisam de internet durante a instalação e o build.

Dependências, lockfile, TypeScript, entrada Expo e configurações pertencem a este repositório. Não há `.env` obrigatório, workspace npm externo nem conta Expo necessária.

## Execução

Para gerar, compilar e instalar o development build Android:

```powershell
npm run android
```

Depois de instalado, inicie o Metro para desenvolver as telas:

```powershell
npm start
```

`index.ts` registra `App.tsx`. Este projeto usa um módulo Android próprio: **Expo Go não executa o aplicativo completo**. Use o development build. A versão de produção empacota o JavaScript no APK e funciona sem Metro ou servidor.

O development build usa assinatura debug e não substitui o APK de produção. Para validar atualização preservando dados, use builds release com a chave original.

## Comandos

| Comando                                | Finalidade                                                             |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `npm ci`                               | Instala as dependências do lockfile.                                   |
| `npm start`                            | Inicia o Metro para o development build.                               |
| `npm run android`                      | Gera, compila e instala o app Android de desenvolvimento.              |
| `npm run prebuild`                     | Gera o projeto Android a partir da configuração Expo.                  |
| `npm run typecheck`                    | Verifica TypeScript e rejeita imports, variáveis e parâmetros sem uso. |
| `npm run validate`                     | Verifica tipos e formatação.                                           |
| `npm run release:prepare -- X.Y.Z`     | Alinha versões, incrementa versionCode e prepara notas.                |
| `python scripts/test_release_tools.py` | Confere os scripts de release sem rede ou compilação Android.          |
| `npm run format`                       | Formata o código TypeScript e as configurações do Expo.                |
| `npm start -- --clear`                 | Inicia o Metro limpando o cache.                                       |

Não há suíte de testes da aplicação. Há verificações isoladas dos scripts de release, usando arquivos temporários. A validação das telas e do uso no aparelho continua manual, conforme solicitado. Não há destinos web ou iOS configurados.

## Estrutura

```text
App.tsx                            navegação e composição das telas
index.ts                           entrada Expo
src/
  Appearance.tsx                   temas e preferências locais
  theme/                           paletas e tokens de design
  HomeScreen.tsx                   saldo e métricas do mês
  UpdateCard.tsx                   apresentação de atualizações
  BottomNavigation.tsx             abas e botão adicionar
  LedgerRow.tsx                    linha adaptável do Histórico
  useBackup.ts                     exportação, prévia e restauração
  ui.tsx                           componentes reutilizáveis
  HistoryScreen.tsx                histórico virtualizado e filtros
  EntryForm.tsx                    formulário e calendário
  CategoryScreen.tsx               gerenciamento de categorias
  categoryIcons.ts                 catálogo e validação de ícones/emojis
  Charts.tsx                       gráficos e valores em texto
  MenuScreen.tsx                   privacidade, opções e ajuda
  finance.ts                       tipos, validação e cálculos locais
  useLedger.ts                     fila de alterações e estado salvo
  useUpdates.ts                    estado e fluxo de atualização
  native.ts                        contrato com o módulo Android
modules/meu-saldo-native/           AtomicFile, backup e atualizador
plugins/withMeuSaldo.js             privacidade, ícone e assinatura
app.json                           versão, identificador e plugins
scripts/                           assinatura e preparação de releases
.github/workflows/release.yml       geração do candidato Android
.github/workflows/publish.yml       publicação do candidato conferido
docs/                              migração e guia de releases
```

`android/` é gerada pelo Expo e ignorada pelo Git. Personalizações devem ficar em `app.json`, no plugin e no módulo local. Para inspeção nativa, abra `android/` no Android Studio.

## Armazenamento e privacidade

Categorias e lançamentos ficam em `files/saldo.json`, no armazenamento privado do aplicativo, com formato versionado e limite de 10 MB. O Android AtomicFile preserva o arquivo anterior em caso de gravação interrompida. A interface publica alterações somente depois de salvar. Arquivos inválidos não são substituídos automaticamente.

Backup automático e transferência automática do Android estão desativados. **Desinstalar ou limpar os dados apaga os registros.** Exporte backups regularmente pelo Menu.

O backup JSON não é criptografado: quem tiver acesso ao arquivo poderá ler os registros. A restauração valida o arquivo, mostra um resumo e exige confirmação antes de substituir os dados.

Tema, ocultação de valores e data da última exportação ficam em `SharedPreferences/app_preferences`, separados de `saldo.json` e do backup financeiro. A data é registrada depois de concluir a escrita; cancelamentos e falhas não registram sucesso. Ela não comprova que o arquivo ainda exista. Após 14 dias sem exportação, o Menu mostra um lembrete discreto se houver lançamentos.

Ocultar valores mascara quantias e percentuais nas três telas financeiras, inclusive nos rótulos de acessibilidade, e esconde os desenhos dos gráficos. Abrir um lançamento para editar revela seu valor no formulário. A ocultação protege a visualização cotidiana; não criptografa o arquivo ou o backup.

O GitHub recebe os dados normais das requisições de atualização, como IP e versão do app. Nenhum registro financeiro ou backup é enviado.

## APK, distribuição e atualizações

Baixe o [APK mais recente](https://github.com/e-Lopes/meu-saldo/releases/latest/download/meu-saldo.apk) ou acesse [GitHub Releases](https://github.com/e-Lopes/meu-saldo/releases/latest). Compartilhe o APK ou o link com amigos e familiares. Cada celular mantém seus próprios registros.

**Instale sobre a versão anterior, sem desinstalar.** A versão Expo 1.3 mantém `br.com.meusaldo`, a assinatura original, `files/saldo.json` e o formato JSON 1. Não é necessário exportar/importar para migrar. Faça um backup manual antes de atualizar.

A partir da versão 1.2, o aplicativo verifica versões ao abrir, no máximo a cada 6 horas, e permite verificar imediatamente pelo Menu. O usuário solicita o download e confirma a instalação no Android. Versões 1.0 e 1.1 precisam instalar um APK atual manualmente uma vez.

O atualizador verifica tamanho, SHA-256, identificador, versão e assinatura. Downloads ficam em `cache/updates`, separados dos dados financeiros. Uma falha de rede não bloqueia o uso offline. Não usamos EAS Build ou EAS Update; a publicação ocorre pelo GitHub Actions, sem serviço pago obrigatório.

Para compilar um release local, mantenha a chave original e `keystore.properties` na raiz:

```powershell
npx expo prebuild --platform android --no-install
.\android\gradlew.bat -p android assembleRelease '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64'
```

APK: `android/app/build/outputs/apk/release/app-release.apk`. O plugin recusa um build release sem a configuração da assinatura.

Guarde uma cópia segura de `.tools/meu-saldo-release.jks` e `keystore.properties` fora do Git. Não crie outra chave para atualizar instalações existentes.

O fluxo padrão é **preparar versão → completar notas → commit e push na main**. O GitHub Actions gera e publica automaticamente novas versões, reutilizando o mesmo APK, manifesto e notas sem recompilar. Versões já publicadas são puladas. A geração sem publicação e a promoção manual continuam disponíveis para conferir o APK antes de distribuir. Não há disparo por tag. Consulte o [guia de releases](releases.md).

Consulte [Releases e atualizações](releases.md) e [Migração para Expo](expo-migration.md). O código Kotlin/Compose anterior permanece no histórico do Git; a cópia local de trabalho antiga foi removida.

As recomendações priorizadas de evolução e a validação manual desta UI estão em [next_steps.md](../next_steps.md).

## Troubleshooting

- Dependências ausentes: execute `npm ci` na raiz.
- Cache do Metro: execute `npm start -- --clear`.
- Módulo `MeuSaldoNative` ausente: use o development build; após mudar código nativo ou plugins, gere e compile novamente com `npm run android`.
- SDK não encontrado: configure `ANDROID_HOME` ou `android/local.properties` com `sdk.dir=C:/caminho/Android/Sdk`.
- Windows e erro `Filename longer than 260 characters`: clone em um caminho curto, como `C:/dev/meu-saldo`, e use uma pasta curta para `GRADLE_USER_HOME`. O build de produção no GitHub Actions usa Linux.
- Assinatura incompatível: use a chave original e um APK release. Não desinstale o app para resolver se quiser manter os registros.
- Sem conexão: continue usando os recursos financeiros; verifique atualizações mais tarde.

Referências: [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/), [geração nativa](https://docs.expo.dev/workflow/continuous-native-generation/), [Expo Modules](https://docs.expo.dev/modules/overview/), [Android AtomicFile](https://developer.android.com/reference/android/util/AtomicFile).

## Documentação relacionada

- [Releases e atualizações](releases.md): assinatura, compilação e publicação.
- [Migração para Expo](expo-migration.md): compatibilidade e preservação dos dados.
- [Validação no aparelho](ui-validation.md): cenários e resultados da conferência manual.
- [Estudo de arquitetura](estudo-arquitetura-aristocat.md): decisões de organização e interface.
- [Próximos passos](../next_steps.md): prioridades e pendências.
