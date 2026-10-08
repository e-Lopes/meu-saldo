# Validação do Meu Saldo

Atualizado em **08/10/2026**. Este roteiro descreve o código atual; não anuncia uma nova versão publicada.

## Verificações automatizadas

- `npm test`: 39 testes financeiros e de interação.
- `npm run validate`: TypeScript e formatação.
- `npm run release:check`: ferramentas de preparação, versão, configuração e assinatura.
- `git diff --check`: espaços e integridade dos diffs.

Os testes cobrem centavos e datas civis, recorrências semanais/mensais, meses curtos e ano bissexto, recuperação de períodos vencidos, prevenção de duplicações, edição atual/próximos e encerramento preservando o histórico. Incluem migração JSON 1/2, cores persistidas, restauração com referências válidas, falhas de gravação e fila, categorias por tipo, formulários e filtros. Testes de contraste verificam textos e valores com pelo menos 4,5:1 e ícones de categoria com pelo menos 3:1.

## Conferência no emulador

Pixel 7 virtual, Android 16/API 36, x86_64. APK de desenvolvimento compilado e instalado sobre o anterior, preservando os registros; execução pelo Metro com redirecionamento da porta 8081. Dados fictícios de outubro incluíram Alimentação, Transporte, Salário e Freelances.

Conferidos:

- Resumo com saldo e totais, duas colunas com até três categorias, nomes alinhados, valores à esquerda e percentuais à direita; “Ver todas” nas duas colunas e conteúdo final acessível acima da barra.
- Cadastro pelo + com escolha de tipo, ordem valor/descrição/categoria/data/recorrência e frequência condicional; seletor único de categoria e criação pelo lançamento preservando os dados do formulário.
- Ausência de aviso de descarte ao mudar somente o tipo de uma categoria nova vazia.
- Histórico com busca e quatro filtros ocupando a largura, grupos por data, descrições em uma linha, somente categoria como informação secundária, valores à direita e recorrência junto ao nome.
- Gráficos com rosca e total central, legendas, barras de participação e comparação de seis meses; ausência de análise detalhada.
- Tema escuro fixo, valores visíveis, ações/filtros em turquesa com texto escuro e cores próprias das categorias.
- Ajustes com Organização primeiro, seguido de Dados e backup e Sobre o app. Texto sobre armazenamento local somente em Privacidade. Atualizações com “Buscar uma nova versão do aplicativo”.
- Migração de cores com lançamentos e regras preservados, sem recolorir ao reabrir.
- Ícone fornecido em `assets/icon.png`, conferido na abertura do APK atualizado sobre fundo escuro.

As capturas e os dados do emulador são artefatos locais ignorados pelo Git. Não há dados financeiros pessoais nos arquivos versionados de teste.

## Cenários ainda pendentes no Android

1. **Teclado e fonte ampliada:** digitar valores e descrições longas, rolar o formulário, alcançar Salvar e voltar sem perder o conteúdo. Conferir telas estreitas, textos grandes e TalkBack em aparelho físico.
2. **Histórico extenso:** rolar muitos lançamentos nos dois sentidos, com filtros e fonte ampliada, sem saltos. A conferência com poucos registros no emulador não comprova esse cenário.
3. **Recorrências completas pela interface:** confirmar/cancelar frequências, editar somente atual e atual/próximos, desmarcar e salvar, excluir somente ocorrência e excluir/encerrar, incluindo Desfazer. Calendário e regras têm cobertura automatizada, mas o fluxo completo no dispositivo segue pendente.
4. **Categorias:** arquivar usadas por séries, mudar tipo bloqueado, criar pelo lançamento com tipo diferente, personalizar cor e alternar emoji/ícone. Verificar quantias grandes ao lado dos percentuais no Resumo.
5. **Backup:** exportar e restaurar pelo provedor real de arquivos, importar JSON antigo, cancelar seletores e preservar dados em falhas. Restauração substitui dados; usar registros fictícios para a conferência.
6. **Atualização release:** instalar sobre APK release anterior com a chave original, sem desinstalar; conferir dados e backups em modo avião. O APK debug do emulador não valida atualização de produção.
7. **Abertura em Android antigo:** conferir ícone e fundo nas versões anteriores à API 31; a conferência visual atual foi feita na API 36.

Publicação de uma nova versão está fora desta implementação. O checklist de distribuição está em [releases.md](releases.md).
