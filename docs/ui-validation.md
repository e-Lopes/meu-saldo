# Validação manual — Meu Saldo 1.4.0

Não foi adicionada suíte de testes. A validação técnica usa checagem TypeScript e compilação Android; a conferência de uso deve ser manual em aparelho físico, com dados fictícios. Não usar emulador neste projeto.

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

A compilação local foi tentada e interrompida a pedido do usuário após dificuldades com caminhos longos e caches do Windows. Não foi gerado um novo APK. Para distribuição, usar o workflow existente do GitHub Actions; a execução manual com `publish` desmarcado gera um candidato sem publicar. A conferência no celular fica sugerida para uma etapa posterior e não bloqueia a conclusão da implementação. Nenhum aparelho foi detectado pelo ADB nesta sessão.

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
