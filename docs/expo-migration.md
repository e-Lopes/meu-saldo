# Migração para Expo

A versão 1.3.0 (versionCode 4) substitui a interface Kotlin/Compose por React Native e TypeScript com Expo. A entrega continua sendo um APK Android, gratuito e independente de navegador, Metro ou serviços de hospedagem em produção.

## Evolução atual — 08/10/2026

O código atual usa JSON 2, com categorias por tipo, colorKey persistida, regras separadas e vínculos das ocorrências. Arquivos JSON 1 são migrados com preservação dos lançamentos. Tema escuro é fixo e ocultação foi removida; somente a data de exportação é usada das preferências financeiras. Os detalhes abaixo registram a migração original; consulte [desenvolvimento](desenvolvimento.md) para o modelo atual.

## Compatibilidade com os dados existentes

O aplicativo mantém o pacote `br.com.meusaldo`, o certificado original e o arquivo `context.filesDir/saldo.json`. O módulo local `MeuSaldoNative` lê esse mesmo arquivo diretamente; não copia os registros para outra pasta e não cria banco de dados.

Na migração original para Expo, o formato continuou com `version: 1`, categorias (`id`, `name`, `color`, `icon`, `archived`) e lançamentos (`id`, `kind`, `cents`, `date`, `categoryId`, `description`). As cores continuam números ARGB e os ícones continuam os identificadores usados no JSON anterior. A interface exibe ícones vetoriais a partir desses identificadores.

Leitura e gravação usam Android AtomicFile, incluindo recuperação do `.bak` de uma gravação interrompida. A fila TypeScript calcula cada alteração sobre o último estado salvo. A interface só publica o novo estado depois que a gravação nativa conclui. Dados inválidos produzem um aviso e permanecem no disco, permitindo recuperação por backup manual.

Centavos e somas precisam ser inteiros seguros em JavaScript. Um backup com soma acima de `Number.MAX_SAFE_INTEGER` é recusado sem modificar o arquivo; isso evita arredondamentos silenciosos. O limite por lançamento permanece em 100 bilhões de centavos e o limite do arquivo permanece em 10 MB.

Datas são strings civis YYYY-MM-DD. O mês é obtido diretamente da string; não usamos ISO/UTC para atribuir lançamentos ao mês.

A versão 1.4.0 adiciona preferências em `app_preferences` para tema, ocultação e data da última exportação. Elas não mudam o formato financeiro, não são incluídas no backup JSON e ficam separadas de `app_updates`. Instalar sobre a versão anterior preserva os registros; escolher um tema não regrava o arquivo financeiro.

## Recursos Android mantidos

- Exportação e importação pelo Storage Access Framework, sem permissão ampla de armazenamento.
- Validação e resumo antes da substituição confirmada dos registros na restauração.
- Backup automático e transferência de dados desativados pelo config plugin.
- Orientação retrato e interface ajustada ao teclado e às áreas seguras.
- Consulta de versões no GitHub, intervalo de 6 horas, download cancelável e instalador Android.
- Verificação de tamanho, SHA-256, pacote, versão e certificado antes da instalação.

O atualizador permanece separado do arquivo financeiro. Seus APKs ficam em `cache/updates` e as preferências existentes `app_updates` são reutilizadas. A versão 1.2 já consegue baixar a versão Expo porque mantemos o contrato de `update.json` e o limite de 100 MB do APK.

## Desenvolvimento e publicação

O módulo Android é autolinkado pelo Expo a partir de `modules/meu-saldo-native/`. Ele não faz parte do Expo Go: use `npm run android` para instalar um development build e `npm start` para o Metro. O development build usa assinatura debug; use release assinado para atualizar o app de produção preservando dados.

O projeto usa geração nativa: `android/` não é versionada. O config plugin deve reproduzir todas as personalizações após cada prebuild. Não há necessidade de EAS Build, EAS Update, conta Expo ou servidor. O GitHub Actions compila o APK e publica a release com os secrets já configurados.

## Validação manual antes de compartilhar

Instale o release sobre um APK anterior com registros, sem desinstalar, e confirme categorias, valores e histórico. Valide criar/editar/excluir, arquivos de backup antigos, cancelar restauração, reiniciar o app, modo avião, fontes ampliadas e teclado. Para testar o atualizador, use duas versões release com a mesma assinatura e versionCode crescente.

Não foram adicionadas suítes de testes. A checagem de tipos e a compilação são verificações de desenvolvimento; não substituem a validação em aparelho.
