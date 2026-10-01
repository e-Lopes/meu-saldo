# Próximos passos — Meu Saldo

Recomendações para evoluir o aplicativo mantendo Android, dados locais, gratuidade e distribuição por APK. Este arquivo é um roteiro; os itens abaixo não estão implementados, exceto os descritos na primeira seção.

## Melhorias desta entrega

- Gráficos separados em **Por categoria** e **Evolução mensal**.
- Resumo de despesas e principal categoria, com barras proporcionais ao total e valores ao lado dos nomes.
- Toque na categoria abre o Histórico já filtrado, no mesmo mês.
- Concentração acumulada disponível como detalhe expansível, com escala percentual e alternativa textual.
- Comparação dos seis meses com escala em reais, seleção por barras ou botões e resumo do mês selecionado.
- Menu com banner de privacidade no topo, opções compactas, ajuda rápida e informações do aplicativo.
- Cópia de segurança em uma seção recolhida por padrão, com os avisos necessários dentro do fluxo.

## Prioridade 1 — melhorar o uso diário

| Recomendação | Benefício | Critério de conclusão |
| --- | --- | --- |
| Validar esta UI no celular | Confirmar leitura, toques e navegação em situações reais | Gráficos e Menu utilizáveis com fonte ampliada, tela pequena, meses vazios, saldo negativo e várias categorias. |
| Alinhar a data inicial do formulário ao mês visualizado | Evitar registrar sem perceber no mês errado | Ao adicionar em um mês passado, o formulário deixa claro o período escolhido e permite ajustar a data. |
| Botão para ocultar valores | Evitar expor o saldo ao abrir o app em público | Um toque oculta valores no Início, Histórico e Gráficos; nomes e navegação continuam utilizáveis. Preferência local, separada do arquivo financeiro. |
| Desfazer exclusão de lançamento | Reduzir erros em ações destrutivas | Após excluir, oferecer uma ação breve para recuperar exatamente o registro, respeitando a fila de gravação. |
| Melhorar o formulário de valor | Acelerar cadastros frequentes | Teclado e ação de salvar acessíveis, valor fácil de corrigir e mensagens de erro junto ao campo. |

Recomendação de ordem: validar as telas atuais, ajustar a data do formulário e depois implementar ocultação de valores e desfazer.

## Prioridade 2 — organização e acessibilidade

- **Voltar ao mês atual:** um atalho discreto após navegar entre meses, sem perder o mês escolhido ao trocar de aba.
- **Histórico eficiente:** lista virtualizada para muitos registros, total filtrado visível e ação clara para limpar filtros.
- **Categorias:** busca, seção específica para arquivadas e contagem de lançamentos associados. Preservar o histórico ao arquivar.
- **Cópia de segurança:** mostrar a data da última exportação concluída e lembrar discretamente quando fizer sentido. Não registrar sucesso em seleção cancelada ou gravação com erro; a data não garante que a cópia ainda exista.
- **Consistência visual:** aplicar os mesmos espaçamentos, títulos, ícones e feedback de toque ao Início e aos formulários.
- **Acessibilidade:** conferir TalkBack, contraste, nomes dos controles e fontes ampliadas. Os gráficos devem manter valores consultáveis em texto e não depender apenas das cores.
- **Navegação:** avaliar o comportamento do botão Voltar nas abas e telas modais e preservar filtros quando o usuário retorna de uma edição.

## Prioridade 3 — avaliar depois de usar

| Ideia | Quando faz sentido |
| --- | --- |
| Tema escuro | Depois de consolidar cores e contraste no tema atual. Salvar a preferência localmente. |
| Metas mensais por categoria | Quando o usuário sentir falta de acompanhar limites de gastos; metas não devem bloquear lançamentos. |
| Favoritos de lançamento | Para despesas repetidas cadastradas manualmente, sempre confirmando valor e data. |
| Backup criptografado opcional | Quando houver necessidade de compartilhar ou guardar arquivos sensíveis; explicar a senha e a impossibilidade de recuperar uma senha perdida antes de adotar. |
| Recorrências | Somente com regras claras para evitar duplicatas, permitir exceções e manter tudo offline. |

Não adicionar login, sincronização, API financeira ou banco de dados para resolver necessidades que o arquivo local já atende. Não migrar para EAS Update apenas por esta mudança visual: o fluxo atual de APKs assinados já preserva compatibilidade com as instalações existentes.

## Validação manual sugerida para esta entrega

1. Em Gráficos, conferir uma categoria, várias categorias e um mês vazio; percentuais devem corresponder ao total de despesas.
2. Tocar em uma categoria e confirmar o mês e o filtro no Histórico.
3. Selecionar os seis meses, incluindo mudança de ano, meses sem lançamentos e saldo negativo.
4. Ampliar fontes e verificar se valores, botões e nomes longos continuam legíveis.
5. No Menu, abrir privacidade, ajuda, atualizações e cópia de segurança. Cancelar seletores de arquivo e conferir a confirmação de restauração.
6. Instalar o APK sobre a versão anterior e confirmar os registros. Usar modo avião e continuar registrando normalmente.

Não foi adicionada suíte de testes. Checagem de tipos e compilação verificam a entrega técnica; a avaliação visual e de usabilidade continua manual.
