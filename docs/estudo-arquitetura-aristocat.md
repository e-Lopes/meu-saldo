# Estudo de arquitetura e design: Meu Saldo × Aristocat Mobile

Data: 02/10/2026.

Implementação posterior neste repositório: preparação automática de versões, geração/promoção separadas do candidato, extração de Início/atualizações/backup/navegação, tokens e paletas, métricas compartilhadas, filtros segmentados e linhas adaptáveis do Histórico. Consulte [releases](releases.md) e [validação manual](ui-validation.md). As recomendações abaixo preservam o diagnóstico feito antes dessas alterações.

## Conclusão

O Aristocat oferece referências úteis de organização visual e composição de telas. O Meu Saldo possui uma implementação mais completa de dados locais, preferências, backup e distribuição Android. A recomendação é adaptar seletivamente o design e a organização do Aristocat, mantendo os contratos financeiros e nativos do Meu Saldo.

O maior retorno está em: tokens visuais, componentes reutilizáveis, telas extraídas de `App.tsx`, apresentação de métricas e filtros segmentados. Expo Router, animações e fontes personalizadas são evoluções opcionais. Login, integração bancária, estado remoto e internacionalização não atendem a uma necessidade demonstrada do Meu Saldo.

## Escopo e limites

Estudo estático do código, configurações e documentação dos dois diretórios. Não foram compilados APKs, executadas aplicações, instaladas dependências ou avaliadas telas no aparelho. As observações visuais derivam dos estilos e componentes; contraste, fluidez e comportamento com fontes ampliadas precisam de validação prática.

O `AGENTS.md` do Aristocat foi consultado. Os arquivos `prompts/05-mobile.md`, `07-tdd-and-spikes.md` e `08-complexity.md` referenciados nele não estão presentes no diretório analisado. Não houve alteração de código no Aristocat.

## 1. Comparação da base existente

| Aspecto | Meu Saldo | Aristocat Mobile | Consequência |
| --- | --- | --- | --- |
| Plataforma | Android configurado explicitamente | Comandos Android, iOS e web | Preservar o escopo Android do Meu Saldo |
| Stack principal | Expo 57, React Native 0.86, React 19, TypeScript 6 | Mesmas linhas de versões principais | Padrões de componentes são próximos; integração ainda exige adaptar contratos e tema |
| Produto | Lançamentos e categorias reais, dados locais | Telas financeiras com dados de `src/mock/finance.ts` | Não confundir navegação visual com funcionalidades completas |
| Composição | `App.tsx` reúne navegação, Início, atualizações, backup e desfazer | Rotas, layouts, componentes e apresentação separados | Extrair responsabilidades do Meu Saldo gradualmente |
| Tema | Claro, escuro e sistema, com preferência persistida | Tokens de uma paleta escura e provider estático | Aproveitar estrutura de tokens, conservar o tema funcional atual |
| Dinheiro | Centavos inteiros e validação centralizada | Formatação e cálculos sobre valores dos mocks nas telas | Manter `finance.ts` como fonte das regras |
| Persistência | JSON versionado, AtomicFile e fila de gravação | Sem persistência financeira implementada | Nenhuma substituição recomendada |
| Histórico | `SectionList`, filtros, busca e agrupamento por data | `map` dentro de layout com `ScrollView` | Adaptar aparência das linhas, preservar virtualização |
| Ferramentas | npm, TypeScript, Prettier | pnpm, ESLint, TypeScript, Prettier e Jest | Adotar controles úteis sem trocar o gerenciador por imitação |
| Distribuição | APK assinado, Actions, Releases e atualizador | Sem pipeline de APK assinado encontrado no diretório | O Meu Saldo já tem a referência mais adequada neste aspecto |

Referências: [Meu Saldo: App](../App.tsx), [preferências e tema](../src/Appearance.tsx), [persistência](../src/useLedger.ts), [workflow](../.github/workflows/release.yml), [Aristocat: README](../../aristocat-mobile/README.md), [dependências](../../aristocat-mobile/package.json), [rotas](../../aristocat-mobile/src/app/_layout.tsx).

## 2. O que trazer, com prioridade e adaptação

### 2.1 Tokens de design — prioridade alta, esforço baixo a médio

**Origem:** [tokens do Aristocat](../../aristocat-mobile/src/theme/tokens.ts).

O Aristocat nomeia espaçamentos, raios, tipografia, tamanhos de ícones e duração de animações. O Meu Saldo já centraliza cores e estilos básicos em `Appearance.tsx`, mas ainda espalha números e algumas cores pelas telas.

**Adaptação:** criar `src/theme/tokens.ts` com uma escala pequena de espaçamento, raios, tipografia e dimensões de controles. Extrair as paletas atuais para um arquivo próprio e manter a resolução claro/escuro/sistema no provider existente. Gradientes e cores de receita/despesa devem acompanhar a paleta.

**Ganho:** ajustes visuais consistentes, menos valores repetidos e menor custo para manter dois temas.

**Critério de conclusão:** componentes compartilhados e telas principais usam a mesma escala; claro, escuro e sistema continuam funcionando; controles preservam a área de toque atual. Não transportar tokens de login, bancos e investimentos sem uso no Meu Saldo.

### 2.2 Componentes de composição — prioridade alta, esforço médio

**Origem:** [UI](../../aristocat-mobile/src/components/ui.tsx), [layout](../../aristocat-mobile/src/components/AppScreenLayout.tsx) e [navegação](../../aristocat-mobile/src/components/AppBottomNavigation.tsx).

O Aristocat oferece `Card`, `Section`, `Header` e `ListItem`. No Meu Saldo, essas composições aparecem repetidas com `View`, `Text` e estilos. Seus botões, campos e chips já oferecem recursos úteis de interação e acessibilidade.

**Adaptação:** acrescentar `Card`, `SectionHeader`, `MetricCard` e uma linha reutilizável para lançamentos. Extrair a barra de abas atual para `BottomNavigation`. Um layout compartilhado deve permitir conteúdo rolável e conteúdo virtualizado; não envolver o Histórico em um `ScrollView` genérico.

**Ganho:** padronizar apresentação sem reescrever os componentes funcionais existentes.

**Critério de conclusão:** cartões e cabeçalhos têm variantes justificadas por uso real; o Histórico continua com `SectionList`; navegação mantém mês, filtros, Voltar e acesso ao botão de adicionar.

### 2.3 Separação de telas e fluxos — prioridade alta, esforço médio

**Origem:** [rota fina de Início](../../aristocat-mobile/src/app/(protected)/(tabs)/home.tsx) e [tela de apresentação](../../aristocat-mobile/src/presentation/HomeScreen.tsx).

**Adaptação:** retirar `Home` e `UpdateCard` de `App.tsx`, extrair um hook de backup e, se continuar grande, o fluxo de exclusão com desfazer. Manter leitura, gravação e atualização nos hooks existentes. Não é necessário introduzir Router ou Zustand para fazer essa separação.

**Ganho:** cada alteração passa a ter um lugar mais previsível, com menos interação acidental entre navegação e operações de dados.

**Critério de conclusão:** `App.tsx` compõe telas e coordena navegação; backup possui um fluxo identificável; alterações continuam publicadas somente após gravação concluída.

O princípio de telas pequenas é útil, mas o Aristocat ainda tem telas extensas, cálculo dentro da apresentação e versões alternativas em `PrototypeScreens.tsx`. A estrutura de pastas não comprova por si só uma separação completa.

### 2.4 Cartões de métricas e hierarquia do saldo — prioridade alta, esforço baixo a médio

**Origem:** [Início](../../aristocat-mobile/src/presentation/HomeScreen.tsx) e [Extrato](../../aristocat-mobile/src/presentation/StatementScreen.tsx).

O Aristocat diferencia valor principal, valores secundários, rótulos e superfícies de receitas/despesas. O Meu Saldo já tem resumo mensal e totais filtrados; o ganho seria na apresentação desses dados.

**Adaptação:** usar uma hierarquia consistente para saldo, receitas e despesas; aplicar fundos discretos associados aos tipos; avaliar números tabulares para melhorar alinhamento. Reutilizar a mesma linguagem no Início e no resumo do Histórico.

**Ganho:** leitura rápida do mês e melhor distinção entre totais.

**Critério de conclusão:** números grandes e fontes ampliadas não cortam; métricas passam para uma coluna quando necessário; os textos continuam dizendo “saldo do mês” ou “saldo filtrado”. Não adotar “saldo consolidado”, que representa outro conceito no Aristocat.

Não é necessário importar as três famílias e onze variantes de fontes carregadas pelo Aristocat. Começar com a fonte do sistema; fontes locais adicionais só se a avaliação visual justificar.

### 2.5 Filtros segmentados — prioridade média, esforço baixo a médio

**Origem:** seletores em [Extrato](../../aristocat-mobile/src/presentation/StatementScreen.tsx) e [Gráficos](../../aristocat-mobile/src/presentation/ChartsScreen.tsx).

**Adaptação:** um componente `SegmentedControl` para “Todos / Receitas / Despesas” e “Por categoria / Evolução mensal”. Manter chips para categorias, que têm quantidade variável. Preservar rótulos, estado selecionado, feedback de toque e uma alternativa de layout para fontes ampliadas.

**Ganho:** deixar mais clara a seleção de uma opção entre poucas alternativas.

**Critério de conclusão:** os mesmos filtros continuam disponíveis, as seleções permanecem ao editar e os rótulos não precisam ser abreviados para caber.

### 2.6 Linhas do Histórico — prioridade média, esforço médio

**Origem:** `TransactionRow` em [StatementScreen](../../aristocat-mobile/src/presentation/StatementScreen.tsx).

**Adaptação:** ícone à esquerda, descrição e categoria no centro, valor alinhado à direita quando houver largura suficiente. Usar o layout empilhado atual em telas estreitas ou com fonte ampliada. Manter toque para edição, agrupamento por data, indicação de categoria arquivada e ocultação nos rótulos de acessibilidade.

**Ganho:** mais lançamentos legíveis por tela, com comparação visual de valores.

**Critério de conclusão:** nomes longos e valores grandes continuam consultáveis; sem perda da virtualização nem ocultação global.

### 2.7 Qualidade de desenvolvimento — prioridade média, esforço baixo a médio

**Origem:** [ESLint](../../aristocat-mobile/eslint.config.mjs), [TypeScript](../../aristocat-mobile/tsconfig.base.json) e scripts em `package.json`.

**Adaptação:** adicionar `lint`, `format:check` e `validate`, continuando com npm. Ignorar diretórios gerados e caches do Meu Saldo. Começar com regras práticas de TypeScript e lint; avaliar `noUncheckedIndexedAccess` separadamente.

**Ganho:** detectar erros e inconsistências antes de compilar o APK.

**Cuidado:** os limites do Aristocat — complexidade 5, profundidade 3 e complexidade cognitiva 8 — são agressivos para as telas existentes. Copiá-los integralmente pode incentivar fragmentação sem melhorar a compreensão.

O Aristocat tem dois arquivos de testes, voltados a um formulário técnico e mensagens de erro. Isso não demonstra cobertura do produto financeiro. O Meu Saldo registra preferência por validação manual e ausência de suíte extensa; este estudo não propõe copiar Jest ou criar testes automaticamente. Uma futura mudança nessa estratégia deve focar riscos concretos de dinheiro, backup e migração.

### 2.8 Animação discreta de gráficos — prioridade baixa, esforço médio

**Origem:** [useChartReveal](../../aristocat-mobile/src/hooks/useChartReveal.ts) e [ChartMotion](../../aristocat-mobile/src/components/ChartMotion.tsx).

**Adaptação:** se desejado, animar somente a entrada do gráfico ou das barras atuais. Reutilizar o princípio de respeitar redução de movimento e interromper a animação ao sair da tela. Como o Meu Saldo não usa React Navigation, o hook precisa receber ativação pela navegação existente em vez de importar `useIsFocused` diretamente.

**Ganho:** acabamento visual. É menor que o ganho de legibilidade e organização.

**Critério de conclusão:** valores e alternativas textuais aparecem imediatamente; nenhum desenho revela dados quando ocultos; redução de movimento é respeitada; não é necessário substituir SVG por segmentos de `View`.

## 3. Itens condicionais e itens que não agregam agora

| Item do Aristocat | Avaliação para o Meu Saldo |
| --- | --- |
| Expo Router e rotas tipadas | Considerar quando o número de telas ou a navegação crescer. Hoje exige adaptar Voltar, proteção de formulários, mês e filtros, sem benefício imediato proporcional |
| React Hook Form + Zod | Úteis com vários formulários complexos. O exemplo do Aristocat valida um único identificador e não resolve dinheiro, datas e categorias do Meu Saldo. Manter a validação central atual |
| TanStack Query | Dependência declarada, sem fluxo remoto financeiro implementado encontrado. Não introduzir para o arquivo local ou apenas para imitar a stack |
| Zustand | No código analisado guarda somente `hasSeenBootstrap` em memória. Não substituir a fila persistente de `useLedger` |
| i18next | Só agregar se existir demanda por outros idiomas. A Home ainda mantém traduções próprias; o padrão do Aristocat não está unificado |
| ToastProvider | Atualmente `show` não faz nada. É uma intenção de arquitetura, não um recurso pronto para trazer |
| useVisualState | Retorna apenas o estado inicial. Não implementa transições nem substitui estados reais de carregamento/erro |
| BottomSheet | Avaliar para seleção curta, como categoria. O componente básico não oferece por si só um fluxo completo de foco, teclado, fechamento e Voltar |
| Tema escuro completo do Aristocat | Usar como referência estética opcional; o Meu Saldo já atende claro, escuro e sistema |
| Login, perfil, investimentos, contas bancárias e Open Banking | São outro escopo de produto; as telas são majoritariamente demonstrativas. Não ajudam no controle local simples |
| pnpm e Node 24 | Não há ganho demonstrado que justifique migrar as ferramentas do Meu Saldo apenas para igualar projetos |

## 4. Cuidados ao aproveitar o código visual

- **Ocultação:** na Home do Aristocat a opção esconde saldo e valores de contas, mas receitas/despesas continuam visíveis. O Meu Saldo tem ocultação mais abrangente, inclusive nos gráficos e rótulos de acessibilidade. Preservar essa implementação.
- **Tema:** componentes do Aristocat importam cores estáticas diretamente. A adaptação deve usar a paleta resolvida do Meu Saldo para evitar telas parcialmente escuras no modo claro.
- **Legibilidade:** a escala do Aristocat inclui rótulos de navegação de 9 e textos de 10–12. Aproveitar hierarquia e espaçamento, escolhendo tamanhos adequados ao público e validando no celular.
- **Gráficos:** em `ChartsScreen.tsx`, os resumos atribuem a cor destrutiva aos créditos e a primária aos débitos, ao contrário da legenda. A fórmula da proporção não trata período totalmente zerado; o cálculo de pontos pressupõe mais de um valor. Reutilizar apresentação exige corrigir esses casos, não transportar fórmulas.
- **Entrada:** `package.json` usa `expo-router/entry`, enquanto `index.js` registra um `App.tsx` que retorna `null`. A documentação descreve esse segundo caminho. Isso precisa ser conciliado no Aristocat antes de tratá-lo como referência de bootstrap; não foi verificado por execução.
- **Navegação:** o Aristocat declara Tabs com barra oculta e também renderiza uma barra própria nas telas. Não transportar duas fontes de navegação para o Meu Saldo.

## 5. Estrutura sugerida, sem obrigação de migração integral

```text
App.tsx                       composição e navegação
src/
  theme/
    tokens.ts                 espaçamento, raios, tipografia, dimensões
    palettes.ts               claro e escuro
  Appearance.tsx              tema, ocultação e preferências persistidas
  components/
    Card.tsx
    MetricCard.tsx
    SectionHeader.tsx
    SegmentedControl.tsx
    LedgerRow.tsx
    BottomNavigation.tsx
    UpdateCard.tsx
  HomeScreen.tsx
  HistoryScreen.tsx
  CategoryScreen.tsx
  EntryForm.tsx
  Charts.tsx
  MenuScreen.tsx
  useBackup.ts
  useLedger.ts
  useUpdates.ts
  finance.ts
  native.ts
modules/meu-saldo-native/      armazenamento, backup e atualização Android
plugins/withMeuSaldo.js        configuração nativa reproduzível
```

Aproveitar a separação do Aristocat não exige introduzir simultaneamente `features`, `presentation`, `stores`, `services` e `contexts`. Cada pasta deve corresponder a uma responsabilidade que realmente existe.

## 6. Ordem recomendada de implementação

1. Extrair tokens/paletas e `HomeScreen`/`UpdateCard`, preservando aparência e comportamento atuais.
2. Criar componentes de cartões, métricas e cabeçalhos com suporte aos dois temas.
3. Aplicar hierarquia visual ao Início e aos totais do Histórico; adaptar linhas com fallback para fonte ampliada.
4. Uniformizar seletores com filtro segmentado, preservando busca e estado das telas.
5. Extrair backup e completar lint/formatação verificável no fluxo existente.
6. Só então avaliar animações, fonte personalizada e migração de navegação.

Validar cada etapa no aparelho: temas, ocultação, fontes ampliadas, teclado, Voltar, filtros e uso offline. Se houver alteração nos fluxos de backup ou publicação, conferir também exportar/restaurar e instalar sobre uma versão anterior assinada.

## 7. Desenvolvimento e distribuição

Não foi encontrado no Aristocat um pipeline equivalente ao APK assinado e atualizador do Meu Saldo. Portanto, não há um mecanismo de distribuição de lá a substituir o atual.

O que pode ser incorporado é um comando único de validação antes do workflow já existente. Continuam úteis as recomendações anteriores de separar o pacote de desenvolvimento, automatizar versões e facilitar a validação do candidato; elas são melhorias próprias do Meu Saldo, não recursos existentes identificados no Aristocat.

Pacote de produção, chave de assinatura, `saldo.json`, formato do backup e contrato de `update.json` devem ser preservados nas alterações visuais e de organização propostas.
