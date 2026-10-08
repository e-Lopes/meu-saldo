# Desenvolvimento do Meu Saldo

Guia para configurar o ambiente, contribuir com o código e entender a arquitetura do aplicativo. Para conhecer os recursos e instalar o app, consulte o [README](../README.md).

O projeto é uma aplicação Android independente em Expo, React Native e TypeScript. Pode ser clonado sem workspace externo.

## Estado atual

O Resumo destaca o saldo mensal, receitas e despesas e até três categorias de cada tipo em duas colunas. Valores e percentuais são alinhados; “Ver todas” aparece em ambas as colunas. O botão + abre o formulário na ordem tipo, valor, descrição opcional, categoria, data e recorrência. A frequência aparece somente quando a repetição está ativada.

O Histórico usa uma única SectionList com chaves estáveis e grupos por data, sem cabeçalhos fixos. Busca e quatro filtros ocupam o cabeçalho; descrições têm uma linha, categoria abaixo, valor à direita e indicador de recorrência junto ao nome. Gráficos reúne distribuição por categoria, participação e comparação de seis meses, para receitas e despesas. A análise detalhada foi removida.

Ajustes começa com Organização/Categorias, seguido de Dados e backup e Sobre o app. Privacidade explica o armazenamento local e a necessidade de exportação para recuperar os dados. Atualizações permanecem nos Ajustes, sem aviso no Resumo.

O tema escuro é fixo e os valores permanecem visíveis; preferências antigas de tema e ocultação são ignoradas. A paleta está em `src/theme/palettes.ts`: fundo #0D1B2A, superfície #1B2D3E, estado pressionado #263E52 e ações/filtros ativos #5DD4C7 com texto escuro. Receitas usam menta, despesas/erros coral e avisos âmbar. Categorias usam uma paleta independente de 12 cores, com chave persistida, distribuição equilibrada e personalização opcional.

Categorias possuem tipo Despesa/Receita, nome, emoji e ícones prontos. O tipo só pode mudar quando não há lançamentos nem regras vinculadas. A criação pelo lançamento preserva o formulário; selecionar um tipo diferente salva a categoria sem vinculá-la ao lançamento atual. Arquivar categorias não encerra recorrências.

A navegação usa Resumo/Histórico/Gráficos/Ajustes e formulários modais em retrato. Exclusões podem ser desfeitas por 15 segundos, ampliados conforme a configuração de acessibilidade do Android. O app instalado funciona offline; a internet é usada para verificar versões e baixar APKs. Não há autenticação, API financeira, sincronização, anúncios ou analytics.

## Responsabilidade

O aplicativo é responsável pela experiência de usuário, navegação, estado local, formulários, acessibilidade, validação e cálculos financeiros. Valores são centavos inteiros; datas são civis, sem conversão para UTC. O saldo é receitas menos despesas do mês, sem transportar saldo anterior.

O módulo Android local é responsável pela gravação atômica do JSON, seletor de backup e instalação de atualizações verificadas. Nenhum lançamento ou categoria é enviado para serviços remotos.

## Requisitos e instalação

- Node.js 22.13 ou superior na linha 22;
- npm 10, com `package-lock.json` versionado;
- JDK 21;
- Android SDK Platform 36 e Build Tools 36.0.0;
- emulador ou aparelho Android 8 ou superior; a conferência final em aparelho físico continua recomendada.

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
| `npm test`                            | Executa testes financeiros e de interação.                              |
| `npm run validate`                     | Verifica tipos e formatação.                                           |
| `npm run release:prepare -- X.Y.Z`     | Alinha versões, incrementa versionCode e prepara notas.                |
| `python scripts/test_release_tools.py` | Confere os scripts de release sem rede ou compilação Android.          |
| `npm run format`                       | Formata o código TypeScript e as configurações do Expo.                |
| `npm start -- --clear`                 | Inicia o Metro limpando o cache.                                       |

`npm test` executa 39 testes financeiros e de interação: calendário, recorrências, migração, backup, persistência, filtros e formulários. Os testes simulam fronteiras nativas; gestos, teclado, TalkBack e seletores de arquivos precisam de validação no Android. Consulte [ui-validation.md](ui-validation.md). Não há destinos web ou iOS configurados.

## Estrutura

```text
App.tsx                            navegação e composição das telas
index.ts                           entrada Expo
src/
  Appearance.tsx                   tema escuro fixo e preferências locais
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
  MenuScreen.tsx                   organização, backup, atualizações e privacidade
  finance.ts                       tipos, validação e cálculos locais
  useLedger.ts                     fila de alterações e estado salvo
  useUpdates.ts                    estado e fluxo de atualização
  native.ts                        contrato com o módulo Android
modules/meu-saldo-native/           AtomicFile, backup e atualizador
assets/icon.png                    ícone do aplicativo e da abertura
plugins/withMeuSaldo.js             privacidade, ícone, abertura e assinatura
app.json                           versão, identificador e plugins
scripts/                           assinatura e preparação de releases
.github/workflows/release.yml       geração do candidato Android
.github/workflows/publish.yml       publicação do candidato conferido
docs/                              migração e guia de releases
```

`android/` é gerada pelo Expo e ignorada pelo Git. Personalizações devem ficar em `app.json`, no plugin e no módulo local. Para inspeção nativa, abra `android/` no Android Studio.

## Armazenamento e privacidade

Categorias, lançamentos e regras de recorrência ficam em `files/saldo.json`, no armazenamento privado do aplicativo, com formato versionado e limite de 10 MB. O Android AtomicFile preserva o arquivo anterior em caso de gravação interrompida. A interface publica alterações somente depois de salvar. Arquivos inválidos não são substituídos automaticamente.

Backup automático e transferência automática do Android estão desativados. **Desinstalar ou limpar os dados apaga os registros.** Exporte backups regularmente pelos Ajustes.

O backup JSON não é criptografado: quem tiver acesso ao arquivo poderá ler os registros. A restauração valida o arquivo, mostra um resumo e exige confirmação antes de substituir os dados.

A data da última exportação fica em `SharedPreferences/app_preferences`, separada de `saldo.json` e do backup financeiro. A data é registrada depois de concluir a escrita; cancelamentos e falhas não registram sucesso. Ela não comprova que o arquivo ainda exista. Após 14 dias sem exportação, os Ajustes mostram um lembrete discreto se houver lançamentos.


O GitHub recebe os dados normais das requisições de atualização, como IP e versão do app. Nenhum registro financeiro ou backup é enviado.

## Recorrências e compatibilidade do JSON

O formato 2 contém `categories`, `entries` e `recurrences`. Categoria inclui `kind` e `colorKey`, mantendo `color` numérico para compatibilidade. Lançamentos gerados identificam a série por `recurrenceId` e a data prevista por `occurrenceDate`. A regra separada guarda frequência, data âncora, cursor da próxima ocorrência e estado ativo.

Ao abrir ou retornar ao app, ocorrências vencidas são geradas e persistidas junto com o cursor, sem duplicações nem ocorrências futuras no saldo. Meses curtos usam o último dia e retomam o dia âncora no seguinte. Ativar em registro existente aproveita a primeira ocorrência. Edição permite somente atual ou atual e próximos; desmarcar interrompe os próximos registros, preservando atual e histórico. Excluir uma ocorrência não a recria; também é possível encerrar a série.

Migração e restauração aceitam formatos 1 e 2, preservam lançamentos e validam referências, identificadores e valores. Categorias antigas são despesas; receitas sem categoria continuam assim. Cores faltantes recebem `colorKey` uma única vez, com gravação na fila existente. Novas categorias usam a cor menos utilizada, com desempate determinístico pelo ID. Exportação inclui regras e vínculos; uma versão antiga do aplicativo não deve ser usada para ler o JSON 2.

## Ícone e tela de abertura

A imagem base está em `assets/icon.png`, referenciada por `app.json`. O plugin copia a imagem para recursos Android e a usa como ícone e splash sobre fundo #0D1B2A. API 31+ usa os atributos nativos de abertura; versões anteriores usam uma layer-list centralizada. Para substituir, troque a imagem e gere um novo APK; não edite recursos em `android/`, que é gerada. O Metro ignora `.tools` e `.dist` para evitar indexar SDKs e artefatos de teste.

## APK, distribuição e atualizações

Baixe o [APK mais recente](https://github.com/e-Lopes/meu-saldo/releases/latest/download/meu-saldo.apk) ou acesse [GitHub Releases](https://github.com/e-Lopes/meu-saldo/releases/latest). Compartilhe o APK ou o link com amigos e familiares. Cada celular mantém seus próprios registros.

**Instale sobre a versão anterior, sem desinstalar.** O aplicativo mantém `br.com.meusaldo`, a assinatura original e `files/saldo.json`; o formato financeiro atual é JSON 2, com migração do formato 1. Não é necessário exportar/importar para migrar. Faça um backup manual antes de atualizar.

A partir da versão 1.2, o aplicativo verifica versões ao abrir, no máximo a cada 6 horas, e permite verificar imediatamente pelos Ajustes. O usuário solicita o download e confirma a instalação no Android. Versões 1.0 e 1.1 precisam instalar um APK atual manualmente uma vez.

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
