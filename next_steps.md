# Próximos passos — Meu Saldo

Roteiro da versão 1.4.0, mantendo Android, dados locais, gratuidade e distribuição por APK. A implementação das prioridades 1, 2 e 3 está concluída, incluindo os ajustes de feedback de toque. A geração do APK fica no fluxo de release pelo GitHub Actions; compilar localmente e conferir a interface no celular não bloqueiam a conclusão desta implementação. A validação de uso ainda não foi realizada; consulte [docs/ui-validation.md](docs/ui-validation.md).

## Conferência do código — 02/10/2026

| Itens | Evidência | Situação |
| --- | --- | --- |
| Gráficos por categoria, concentração acumulada e evolução de seis meses | `src/Charts.tsx`; filtro e mês encaminhados em `App.tsx` | Implementados |
| Menu, privacidade, ajuda e backup recolhido | `src/MenuScreen.tsx` | Implementados |
| Data no mês visualizado e formulário de valor | `src/EntryForm.tsx`, `src/finance.ts` | Implementados |
| Ocultar valores e temas com preferências separadas | `src/Appearance.tsx`, `MeuSaldoModule.kt` | Implementados |
| Desfazer exclusão preservando registro e fila de gravação | `App.tsx`, `src/useLedger.ts` | Implementado |
| Mês atual, histórico virtualizado, total filtrado e limpar filtros | `src/ui.tsx`, `src/HistoryScreen.tsx` | Implementados |
| Busca, arquivamento e contagem de categorias | `src/CategoryScreen.tsx` | Implementados |
| Data de exportação após gravação e lembrete de backup | `MeuSaldoModule.kt`, `src/MenuScreen.tsx` | Implementados |
| Voltar nas abas/modais e preservar filtros ao editar | `App.tsx`, `src/EntryForm.tsx`, `src/CategoryScreen.tsx` | Implementados |
| Consistência visual e legibilidade | Estilos compartilhados; Início adapta colunas à largura e fonte; restauração rolável; feedback de toque nos controles revisados | Implementados; validação visual pendente |
| Acessibilidade e legibilidade | Rótulos, estados dos filtros, erros e alternativas textuais dos gráficos | Recursos presentes; contraste e fontes ampliadas pendentes de validação |
| Atualização sobre versão anterior e uso em modo avião | `app.json`, `plugins/withMeuSaldo.js`, módulo nativo e arquivo local | Fluxo presente; preservação de dados na instalação e uso offline pendentes de validação |

`npm run typecheck` passou nesta conferência. A compilação local foi interrompida a pedido do usuário após dificuldades com caminhos longos e caches do Windows; não foi gerado um novo APK. Não há suíte de testes da aplicação nem configuração de emulador no projeto. A conferência de uso continua sugerida em aparelho físico, sem adicionar emulador ou uma suíte extensa de testes.

## Melhorias desta entrega

- Gráficos separados em **Por categoria** e **Evolução mensal**.
- Resumo de despesas e principal categoria, com barras proporcionais ao total e valores ao lado dos nomes.
- Toque na categoria abre o Histórico já filtrado, no mesmo mês.
- Concentração acumulada disponível como detalhe expansível, com escala percentual e alternativa textual.
- Comparação dos seis meses com escala em reais, seleção por barras ou botões e resumo do mês selecionado.
- Menu com banner de privacidade no topo, opções compactas, ajuda rápida e informações do aplicativo.
- Cópia de segurança em uma seção recolhida por padrão, com os avisos necessários dentro do fluxo.
- Início com cartões em uma coluna em telas estreitas ou com fontes ampliadas.
- Histórico com receitas, despesas e saldo dos resultados; busca por descrição ou categoria sem distinguir acentos.
- Filtros do Histórico informam seu estado expandido à acessibilidade.
- Formulário avisa quando a data fica fora do mês visualizado; confirmação de restauração permite rolagem.

## Prioridade 1 — melhorar o uso diário (implementada)

| Recomendação | Benefício | Critério de conclusão |
| --- | --- | --- |
| Alinhar a data inicial do formulário ao mês visualizado | Evitar registrar sem perceber no mês errado | Ao adicionar em um mês passado, o formulário deixa claro o período escolhido e permite ajustar a data. |
| Botão para ocultar valores | Evitar expor o saldo ao abrir o app em público | Um toque oculta valores no Início, Histórico e Gráficos; nomes e navegação continuam utilizáveis. Preferência local, separada do arquivo financeiro. |
| Desfazer exclusão de lançamento | Reduzir erros em ações destrutivas | Após excluir, oferecer uma ação breve para recuperar exatamente o registro, respeitando a fila de gravação. |
| Melhorar o formulário de valor | Acelerar cadastros frequentes | Teclado e ação de salvar acessíveis, valor fácil de corrigir e mensagens de erro junto ao campo. |

Implementado: data alinhada ao mês; ocultação persistida separadamente; desfazer por 15 segundos (ajustado ao tempo de acessibilidade do Android); erros junto ao valor e Salvar fora da área rolável.

## Prioridade 2 — organização e legibilidade (implementada)

- **Voltar ao mês atual:** um atalho discreto após navegar entre meses, sem perder o mês escolhido ao trocar de aba.
- **Histórico eficiente:** lista virtualizada para muitos registros, total filtrado visível e ação clara para limpar filtros.
- **Categorias:** busca, seção específica para arquivadas e contagem de lançamentos associados. Preservar o histórico ao arquivar.
- **Cópia de segurança:** mostrar a data da última exportação concluída e lembrar discretamente quando fizer sentido. Não registrar sucesso em seleção cancelada ou gravação com erro; a data não garante que a cópia ainda exista.
- **Consistência visual:** estilos compartilhados aplicados ao Início e aos formulários. Feedback de toque por opacidade aplicado ao botão central +, às abas, ao expansor de concentração dos gráficos e aos seletores de mês do gráfico mensal, preservando os estados selecionado e desabilitado.
- **Acessibilidade e legibilidade:** nomes dos controles, fontes ampliáveis e alternativas textuais presentes. Os gráficos mantêm valores consultáveis em texto. Contraste e leitura com fonte ampliada ainda precisam de conferência no aparelho.
- **Navegação:** botão Voltar retorna entre abas e fecha telas modais com proteção de alterações; filtros são preservados quando o usuário retorna de uma edição.

## Prioridade 3 — tema escuro (implementada)

| Ideia | Quando faz sentido |
| --- | --- |
| Tema escuro | Depois de consolidar cores e contraste no tema atual. Salvar a preferência localmente. |

Implementado: Sistema, Claro e Escuro no Menu, com preferências locais e calendário nativo acompanhando o tema escolhido.

Não adicionar login, sincronização, API financeira ou banco de dados para resolver necessidades que o arquivo local já atende. Não migrar para EAS Update apenas por esta mudança visual: o fluxo atual de APKs assinados já preserva compatibilidade com as instalações existentes.

## Validação manual sugerida no celular

Esta lista é uma conferência de uso dos recursos implementados. Ainda não há resultados registrados em aparelho físico. Não usar emulador nem adicionar uma suíte extensa de testes automatizados.

1. Em Gráficos, conferir uma categoria, várias categorias e um mês vazio; percentuais devem corresponder ao total de despesas.
2. Tocar em uma categoria e confirmar o mês e o filtro no Histórico.
3. Selecionar os seis meses, incluindo mudança de ano, meses sem lançamentos e saldo negativo.
4. Ampliar fontes e verificar se valores, botões e nomes longos continuam legíveis.
5. No Menu, abrir privacidade, ajuda, atualizações e cópia de segurança. Cancelar seletores de arquivo e conferir a confirmação de restauração.
6. Instalar o APK sobre a versão anterior e confirmar os registros. Usar modo avião e continuar registrando normalmente.
7. Buscar `alimentacao` e conferir lançamentos de Alimentação sem descrição; combinar busca, tipo e categoria e verificar receitas, despesas e saldo. Ocultar valores deve mascarar os três totais.
8. Criar em mês passado, mudar a data para outro mês e conferir o aviso; editar sem perder os filtros; usar Voltar com alterações ainda não salvas.
9. Excluir e desfazer: conferir identificador, data, valor, descrição e categoria originais; deixar o prazo terminar e confirmar que a ação desaparece.
10. Arquivar e reativar categorias, conferir contagens e referências no Histórico. Exportar com sucesso, cancelar e simular falha; somente a exportação concluída deve registrar nova data.
11. Reiniciar o app e conferir tema e ocultação; abrir o calendário nos temas claro/escuro. Conferir mensagens de erro, filtros e ausência de valores expostos quando ocultos.

## Implementação concluída e distribuição posterior

- Concluído: uniformizar os feedbacks de toque identificados na prioridade 2; checagem TypeScript passou.
- Geração do APK: usar o workflow existente **Gerar candidato Android** no GitHub Actions. Executar manualmente para gerar um candidato sem publicação; ele compila em Linux, verifica a assinatura original e disponibiliza o artefato `meu-saldo-candidate`. A compilação local deixou de ser requisito desta implementação.
- Conferência no celular: sugestão para uma etapa posterior, quando houver aparelho disponível. Não foi executada e não bloqueia a implementação; registrar resultados em `docs/ui-validation.md` quando ocorrer.

Não foi adicionada suíte de testes da aplicação; os scripts de release possuem verificações isoladas. Checagem de tipos e compilação verificam a entrega técnica; a avaliação visual e de usabilidade continua manual.

## Arquitetura e publicação — 02/10/2026

- `release:prepare` alinha app/package/lockfile, incrementa versionCode e preserva notas anteriores; a versão atual não foi alterada nesta implementação.
- Candidato e publicação são workflows separados. Publicação seleciona uma execução conferida e reutiliza seus bytes, manifesto, notas e commit.
- Início, cartão de atualização, navegação inferior e backup foram extraídos de `App.tsx`.
- Tokens/paletas, cartões de métricas, cabeçalhos, filtros segmentados e linha adaptável do Histórico foram incorporados a partir do estudo do Aristocat.
- Preservados: centavos, datas civis, JSON/AtomicFile, assinatura/pacote, ocultação global, dois temas e lista virtualizada.
- Conferência da interface e execução real dos novos workflows continuam pendentes. Consulte [releases](docs/releases.md).

## Simplificação de UI/UX — 02/10/2026

Implementados cabeçalho compacto, resumo de quatro categorias no Início, totais compactos no Histórico, detalhes exclusivos no Menu, atualização resumida, formulário com escolhas progressivas e edição de categorias com opções recolhidas e Salvar fixo. As telas continuam com dados locais, dois temas, ocultação global, lista virtualizada e confirmação de operações destrutivas.

Tipos e formatação passaram; a conferência em aparelho físico continua pendente, com roteiro atualizado em [docs/ui-validation.md](docs/ui-validation.md).
