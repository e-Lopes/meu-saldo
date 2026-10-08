# Thunder Wallet: analytics e distribuição

Análise em 08/10/2026 do código da branch `master`, commit `15bc010df0587c9490f6fb29ff1e6cc88bce85d5`. Leitura estática; o aplicativo externo e seus scripts não foram executados.

## Analytics financeiros

O [MainApp.js](https://github.com/iamtejas23/thunder-wallet/blob/15bc010df0587c9490f6fb29ff1e6cc88bce85d5/MainApp.js) implementa donut interativo, participação por categoria, comparação mensal, gastos por dia da semana, maiores despesas, orçamentos e simulação de economia. As categorias menores são agrupadas em “Other”. A projeção anual multiplica a economia mensal por 12, sem prever rendimentos.

Cuidados encontrados:

- O donut usa despesas; suas cores dependem da posição no ranking e podem mudar.
- O histórico mostra os últimos seis meses **com despesas**, omitindo meses vazios.
- Dias da semana e insights usam todo o histórico, enquanto outros cards usam o mês atual.
- A comparação usa mês atual parcial contra mês anterior completo.
- A variação percentual do saldo pode induzir interpretações erradas quando a base é negativa.
- Há nota financeira e julgamentos de comportamento, incompatíveis com a orientação atual do Meu Saldo.

Para o Meu Saldo, aproveitar seleção no donut e comparação objetiva; manter `colorKey`, meses consecutivos, períodos explícitos e valores em centavos.

## Telemetria

Não encontrei SDKs de Firebase Analytics, Mixpanel, Amplitude, PostHog ou Sentry nas dependências diretas, nem integração correspondente nas buscas do código. “Analytics” designa os indicadores financeiros locais. Isso é uma constatação da leitura estática, sem auditoria de tráfego ou dependências transitivas. [Dependências](https://github.com/iamtejas23/thunder-wallet/blob/15bc010df0587c9490f6fb29ff1e6cc88bce85d5/package.json).

## Build e distribuição

O [script de release](https://github.com/iamtejas23/thunder-wallet/blob/15bc010df0587c9490f6fb29ff1e6cc88bce85d5/scripts/release.js) sincroniza versões e incrementa `versionCode`; permite simulação, alteração apenas dos arquivos ou commit/tag sem push. Por padrão, faz commit, cria tag e envia ao remoto. Não executei esse script.

O [workflow Android](https://github.com/iamtejas23/thunder-wallet/blob/15bc010df0587c9490f6fb29ff1e6cc88bce85d5/.github/workflows/android-release.yml) compila via Gradle, confere versões, verifica assinatura e publica APK no GitHub Releases. O APK contém somente `arm64-v8a`: reduz tamanho, mas não atende ao emulador x86_64 nem a aparelhos ARM de 32 bits.

A assinatura usa secrets quando disponíveis. Na ausência deles, gera uma chave de CI e a guarda no cache. Isso cria risco de mudar o certificado quando o cache deixa de existir. Verificar uma assinatura válida e rejeitar certificado de debug não garante continuidade com o certificado da versão anterior. Não há etapas explícitas de testes automatizados, tipos ou formatação nesse workflow, nem publicação de checksum do APK.

O [EAS](https://github.com/iamtejas23/thunder-wallet/blob/15bc010df0587c9490f6fb29ff1e6cc88bce85d5/eas.json) configura preview interno e produção com AAB Android, além de perfis iOS. Configuração não comprova publicação na Play Store ou App Store. A pasta `docs` contém a página de apresentação; não é um backend de dados financeiros.

## Atualizações dentro do aplicativo

O [UpdateChecker.js](https://github.com/iamtejas23/thunder-wallet/blob/15bc010df0587c9490f6fb29ff1e6cc88bce85d5/UpdateChecker.js) consulta a última release, compara versões e mantém cache por seis horas. Seleciona o primeiro asset sem filtrar extensão ou arquitetura. O [UpdateModal.js](https://github.com/iamtejas23/thunder-wallet/blob/15bc010df0587c9490f6fb29ff1e6cc88bce85d5/UpdateModal.js) pede backup antes de encaminhar para o download. Esse fluxo não demonstra validação do arquivo baixado pelo aplicativo.

## Aplicação ao Meu Saldo

Manter o pipeline existente: secrets obrigatórios, conferência do certificado esperado, SHA-256 do APK, testes e validações, além das arquiteturas já atendidas. Fontes locais: `scripts/configure_ci_signing.py`, `scripts/prepare_release.py` e `.github/workflows/release.yml`.

Priorizar melhorias de interação dos gráficos. Não substituir a distribuição atual pela alternativa de chave em cache, não reduzir arquiteturas sem uma decisão explícita e não acrescentar nota financeira. Nenhum código externo foi incorporado ao aplicativo nesta análise.
