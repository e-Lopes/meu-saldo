# Próximos passos — Meu Saldo

Atualizado em **08/10/2026**. O código continua Android, offline, com dados locais e distribuição por APK assinado. Versão preparada: 1.1.0 (`versionCode` 10). A preparação e geração do candidato não significam publicação.

## Implementado no código atual

- Recorrências semanais/mensais com recuperação de vencidos, cursor persistido, edição atual/próximos e encerramento preservando o histórico.
- Categorias de receitas/despesas, paleta de 12 cores com colorKey persistida, migração do JSON antigo e backup com séries.
- Resumo com totais dentro do saldo, até três grupos por coluna, percentuais alinhados e Ver todas em ambas.
- Histórico com busca, quatro filtros alinhados, grupos por data e indicador de recorrência junto ao nome.
- Formulário compacto, criação de categoria sem perder o lançamento e exclusão em Mais ações.
- Tema escuro fixo, paleta unificada e valores sempre visíveis; removidos seletor de tema e ocultação.
- Ajustes com Organização primeiro e explicação de dados locais em Privacidade. Atualizações somente nos Ajustes.
- Novo ícone em assets/icon.png, usado no aplicativo e na abertura Android.

## Validação concluída

46 testes financeiros e de interação, checagem de tipos e formatação. APK debug compilado; a conferência visual anterior no Pixel 7/API 36 cobriu Resumo, Histórico, Gráficos, Ajustes e abertura, com dados preservados. A duplicação e a escolha de pasta para backup automático ainda precisam de conferência manual. Consulte [ui-validation.md](docs/ui-validation.md) para os limites dessa conferência.

## Prioridade antes de distribuir

Concluir no Android os cenários de teclado aberto, fonte ampliada, TalkBack, histórico extenso, fluxos completos de recorrência e seletores reais de backup. Conferir abertura em Android anterior à API 31 e instalação de APK release sobre a versão anterior assinada.

Após a conferência, preparar uma nova versão e suas notas, gerar um candidato, testar no aparelho físico e publicar o mesmo APK. A versão publicada anteriormente continua disponível em [Releases](https://github.com/e-Lopes/meu-saldo/releases/latest); este trabalho não alterou sua numeração nem disparou uma publicação manual.

Manter android/ gerada pelo Expo, com personalizações no plugin e módulo local. Preservar pacote e chave de assinatura. Não há necessidade de login, sincronização, API financeira ou banco de dados para o escopo atual.

## Melhorias futuras nos gráficos

Referência: [análise do Thunder Wallet](docs/analise-thunder-wallet.md). Estas melhorias ficam planejadas; não incluem mudanças no processo de distribuição.

- **Donut interativo:** tocar em uma fatia ou na legenda destaca a categoria e exibe nome, valor e participação. Permitir desfazer a seleção e oferecer a mesma ação pela legenda, com áreas de toque de pelo menos 48 dp e suporte a TalkBack. Usar a `colorKey` persistida da categoria, independentemente da posição no ranking, seguindo a paleta e o tema escuro do Meu Saldo. Manter a alternância entre receitas e despesas e o mês escolhido.
- **Comparação mensal nos Gráficos:** apresentar receitas, despesas e saldo do mês escolhido ao lado do mês anterior, com diferença em reais e percentual quando a base permitir interpretação clara. Complementar a diferença simples já implementada no Resumo. Não mostrar percentual sobre base zero ou saldo anterior negativo; explicar quando não houver registros. Identificar o mês atual como parcial, evitando sugerir uma comparação entre dois meses completos.
- **Consistência dos dados:** manter cálculos em centavos, os seis meses consecutivos (inclusive meses sem registros), períodos explícitos e previsões de recorrência fora dos totais realizados. Distinguir receitas e despesas por texto e sinais, além de cores; não incluir nota financeira ou julgamento de comportamento. Preservar o resumo por categoria e as barras de participação, sem reintroduzir “Ver análise detalhada”.
- **Validação:** conferir seleção e limpeza do destaque, cores estáveis ao reordenar categorias, ausência de dados, meses vazios, virada do ano, valores grandes e acessibilidade no Android.

## Distribuição — decisão mantida

Continuar com o pipeline atual do Meu Saldo: APK assinado com a chave original, secrets obrigatórios, conferência do certificado esperado, checksum SHA-256, testes e validações antes da publicação e manutenção das arquiteturas atendidas. Não adotar a chave de CI em cache nem restringir a distribuição a `arm64-v8a` como no repositório analisado. A inspiração fica restrita às melhorias de interação e apresentação dos gráficos.
