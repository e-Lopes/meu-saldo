# Validação manual — Meu Saldo

Não há suíte de testes da aplicação; os scripts de release possuem verificações isoladas. A validação técnica usa checagem TypeScript e compilação Android; a conferência de uso deve ser manual em aparelho físico, com dados fictícios. Não usar emulador neste projeto.

## Recursos implementados

- Temas Sistema/Claro/Escuro; ocultar valores pelo botão de olho, com preferências persistidas separadamente do JSON financeiro.
- Data inicial no mês escolhido, descrição do período, erros junto ao valor, limpar valor e Salvar acessível com teclado.
- Desfazer exclusão na fila de gravação; o registro original, seu identificador e sua categoria são preservados.
- Atalho ao mês atual; histórico virtualizado, subtotal filtrado e limpar filtros; filtros preservados na edição.
- Busca de categorias, contagem de registros e seção de arquivadas; arquivar preserva referências existentes.
- Última exportação registrada somente depois de escrever o backup; cancelamento não registra data. Lembrete após 14 dias, sem garantia de existência do arquivo.
- Botão Voltar retorna à aba anterior; modais protegem alterações ainda não salvas. Controles têm rótulos e gráficos têm alternativas textuais.

## Conferência do código — 02/10/2026

Os recursos das três prioridades foram localizados no código e `npm run typecheck` passou. A implementação está concluída, incluindo feedback de toque no botão +, abas, expansor de concentração e seletores de mês dos gráficos. A conferência visual e de uso em aparelho físico ainda não tem resultados registrados. A matriz por item está em [next_steps.md](../next_steps.md).

A compilação local foi tentada e interrompida a pedido do usuário após dificuldades com caminhos longos e caches do Windows. Não foi gerado um novo APK. Para distribuição, usar o workflow existente do GitHub Actions; o workflow **Gerar candidato Android** gera um candidato sem publicar; **Publicar candidato Android** promove a execução conferida sem recompilar. A conferência no celular fica sugerida para uma etapa posterior e não bloqueia a conclusão da implementação. Nenhum aparelho foi detectado pelo ADB nesta sessão.

## Conferência complementar no celular

1. Conferir mensagens de erro, nomes dos controles e ocultação de valores no Início, Histórico e Gráficos.
2. Conferir teclado do fabricante, fontes ampliadas e gestos de voltar no aparelho utilizado.
3. Exportar para o provedor de arquivos escolhido e confirmar o arquivo; a data no Menu não garante que a cópia ainda exista.

A revisão do código e a checagem de tipos não substituem a avaliação visual e de acessibilidade no aparelho físico. Conferir também os cenários de gráficos, fontes ampliadas, atualização e modo avião listados em [next_steps.md](../next_steps.md).

## Ajustes de interface — 02/10/2026

- Início: resumo e categorias em uma coluna em telas estreitas ou com fonte ampliada.
- Histórico: receitas, despesas e saldo dos resultados; busca por descrição ou categoria sem distinguir acentos; estado dos filtros informado à acessibilidade.
- Formulário: aviso quando a data pertence a outro mês; confirmação de restauração com conteúdo rolável.

Conferir no aparelho: buscar `alimentacao` encontra Alimentação mesmo sem descrição; combinar busca e filtros atualiza os três totais; ocultar valores mascara os totais adicionais; ampliar fontes permite ler os cartões e alcançar os botões de restauração; alterar a data para outro mês exibe o aviso.

Checagem TypeScript concluída para estes ajustes. A validação visual no aparelho continua pendente; não foi compilado um novo APK nesta etapa.

## Organização e design adaptados do Aristocat — 02/10/2026

Conferir no aparelho os cartões de receitas/despesas no Início e Histórico, filtros segmentados, valores alinhados à direita em telas largas e empilhados em telas estreitas/fontes ampliadas. Validar claro, escuro e sistema; ocultação também deve mascarar métricas e rótulos de acessibilidade.

No backup: cancelar a confirmação, cancelar o seletor, importar arquivo inválido, cancelar a prévia e confirmar restauração. Verificar que somente restauração concluída limpa filtros e desfazer. Na navegação, conferir botão +, Voltar e preservação do mês.

Estas mudanças passaram pela checagem de tipos e formatação; não houve nova instalação ou avaliação visual nesta etapa.

## Simplificação da interface — 02/10/2026

- Cabeçalho sem slogans ou gradiente; o botão de ocultação aparece nas telas financeiras.
- Início com saldo, receitas/despesas e até quatro principais categorias. “Ver todos os gastos” abre Gráficos; mês vazio oferece ação para adicionar o primeiro lançamento.
- Histórico mantém lista virtualizada, saldo filtrado, busca e tipos/categorias, com totais compactos em texto.
- Menu com uma seção de detalhes aberta por vez. Aparência, cópia de segurança, atualizações, ajuda e privacidade ficam recolhidas. Falha de leitura abre recuperação; atualização disponível abre seu detalhe.
- Aviso de atualização compacto no Início; notas da versão aparecem somente ao abrir “O que mudou”.
- Formulário com categoria escolhida por lista expansível, busca para mais de seis categorias, descrição opcional recolhida e ação Salvar fixa. Limpar valor fica em um ícone junto ao campo. O aviso de outro mês continua visível quando necessário.
- Categorias com lista de edição sem ações destrutivas repetidas. Cor/ícone e opções de arquivamento, exclusão ou reativação aparecem sob demanda; Salvar permanece acessível com o teclado.
- Desfazer exclusão usa uma faixa compacta, mantendo o prazo ajustado pelo Android.

Conferência manual sugerida:

1. No Início, conferir mês vazio, somente receitas e mais de quatro categorias; confirmar acesso a todos os gastos e ao histórico de uma categoria.
2. No formulário, tentar salvar sem valor ou categoria; buscar uma categoria com/sem acento; alternar receita/despesa; fechar a lista com Voltar; preencher e recolher descrição sem perder o texto; alterar a data para outro mês.
3. Em Categorias, criar somente com nome, personalizar cor/ícone, editar com teclado aberto, arquivar uma categoria usada, excluir uma sem registros e reativar uma arquivada. Conferir confirmação ao descartar alterações ainda não salvas.
4. No Menu, alternar detalhes, tema e cópia; confirmar que o arquivo exportado continua recuperável. Ao falhar a leitura, usar o atalho de recuperação.
5. Conferir atualização disponível, dispensar aviso, abrir as notas e cancelar download. Em fonte ampliada, todos os controles e textos devem continuar alcançáveis.
6. Conferir temas, ocultação no Início/Histórico/Gráficos e rótulos de acessibilidade. Excluir e desfazer deve recuperar exatamente o registro anterior.

`npm run validate` passou. Não houve compilação de APK nem validação visual em aparelho físico nesta etapa.

## Revisão local após a versão 1.5.0 — 03/10/2026

`npm run validate` passou com `noUnusedLocals` e `noUnusedParameters` habilitados. Os nove testes existentes dos scripts de release passaram. Verificações temporárias, executadas com dados fictícios e dependências nativas simuladas, aprovaram:

| Cenário | Resultado local |
| --- | --- |
| Centavos, valores inválidos, saldo negativo, mês vazio e acumulado por categoria | Aprovado |
| Troca de dezembro/janeiro e rejeição de data civil inexistente | Aprovado |
| Busca sem acentos e rejeição de categoria inexistente/registro duplicado | Aprovado |
| Backup dos 24 ícones e emojis compostos; rejeição de texto e múltiplos emojis | Aprovado |
| Cancelar importação, arquivo inválido e cancelar prévia sem substituir dados | Aprovado com módulo nativo simulado |
| Restauração confirmada chama limpeza somente depois de salvar | Aprovado com módulo nativo simulado |
| Cancelar exportação/seletor não atualiza a data; exportação concluída atualiza | Aprovado com módulo nativo simulado |
| Cache atrasado de atualização não sobrescreve versão mais recente | Aprovado com módulo nativo simulado |
| Toques repetidos em instalar não abrem chamadas simultâneas | Aprovado com módulo nativo simulado |

Removida a cópia local antiga em `.tools/legacy-compose/`, a dependência de gradiente, imports e tokens sem uso, reexportações e a apresentação antiga do aviso de atualização. Os recursos financeiros e o módulo nativo atual permanecem referenciados pelo app.

O ADB não encontrou aparelho conectado. Estas verificações não comprovam comportamento no Android real. Não houve geração de APK, instalação, publicação nem conferência visual nesta revisão.

No aparelho, além do roteiro anterior, conferir:

1. Seleção azul em ambas as visualizações de Gráficos no tema escuro; tema claro e sistema.
2. Criar/editar categoria com ícone e emoji, reiniciar e exportar/restaurar; confirmar preservação das categorias anteriores.
3. Nomes longos e fontes ampliadas nos filtros do Histórico e formulário; TalkBack deve anunciar a categoria sem repetir o emoji decorativo.
4. Instalar a atualização sobre a versão anterior sem desinstalar e verificar os registros e preferências após reiniciar.
5. Seletores reais de backup, gravação interrompida, exclusão/desfazer, modo avião e cancelamento de download.

Registrar aparelho, Android, versão anterior e resultado de cada cenário quando executado. As prioridades 1 e 2 do `next_steps.md` permanecem como roteiro dessa conferência física.

## Primeira publicação automática — 03/10/2026

A [execução 37097752926](https://github.com/e-Lopes/meu-saldo/actions/runs/37097752926) gerou e publicou a [versão 1.0.0](https://github.com/e-Lopes/meu-saldo/releases/tag/v1.0.0), com `versionCode` 8. Passaram tipos, formatação, 11 testes dos scripts de release, compilação Android em Linux e verificações de assinatura, identificador, versão, tamanho, SHA-256 e correspondência das notas. A publicação reutilizou o APK gerado e marcou a release como `latest`.

Não houve instalação nem conferência em aparelho físico durante esta publicação. A geração automática não altera os cenários manuais pendentes acima. Para conferir a atualização a partir da 1.5.0, use Menu → Atualizações → Verificar atualizações e confirme a instalação no Android, sem desinstalar.
