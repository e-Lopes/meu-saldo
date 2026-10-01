# Validação manual — Meu Saldo 1.4.0

Não foi adicionada suíte de testes. A entrega usa checagem TypeScript, compilação Android e conferência manual em emulador com dados fictícios. Nenhum aparelho físico está conectado neste ambiente.

## Recursos implementados

- Temas Sistema/Claro/Escuro; ocultar valores pelo botão de olho, com preferências persistidas separadamente do JSON financeiro.
- Data inicial no mês escolhido, descrição do período, erros junto ao valor, limpar valor e Salvar acessível com teclado.
- Desfazer exclusão na fila de gravação; o registro original, seu identificador e sua categoria são preservados.
- Atalho ao mês atual; histórico virtualizado, subtotal filtrado e limpar filtros; filtros preservados na edição.
- Busca de categorias, contagem de registros e seção de arquivadas; arquivar preserva referências existentes.
- Última exportação registrada somente depois de escrever o backup; cancelamento não registra data. Lembrete após 14 dias, sem garantia de existência do arquivo.
- Botão Voltar retorna à aba anterior; modais protegem alterações ainda não salvas. Controles têm rótulos e gráficos têm alternativas textuais.

## Conferência em andamento

A compilação e a conferência no emulador estão em andamento. Esta seção será atualizada com resultados reais antes da conclusão.

## Conferência complementar no celular

1. Com TalkBack, conferir ordem de foco, anúncios de erros, nomes dos controles e valores ocultos.
2. Conferir teclado do fabricante, fontes ampliadas e gestos de voltar no aparelho utilizado.
3. Exportar para o provedor de arquivos escolhido e confirmar o arquivo; a data no Menu não garante que a cópia ainda exista.

Os resultados em emulador não substituem a avaliação visual e de acessibilidade no aparelho físico.
