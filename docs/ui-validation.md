# Validação do Meu Saldo

Atualizado em **10/10/2026** para a entrega 1.1.6. A conferência mais recente está em [testes-manuais-2026-10-10.md](testes-manuais-2026-10-10.md).

## Verificações automatizadas

- `npm test`: 56 testes financeiros e de interação, incluindo ativação de recorrência em lançamentos antigos, rolagem do formulário, navegação rápida entre meses, duplicação independente, previsão de recorrências, comparação mensal e lembrete/backup automático.
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
- Temas claro e escuro persistidos, valores visíveis, ações/filtros em turquesa com texto escuro e cores próprias das categorias.
- Ajustes com Aparência, Organização, Dados e backup e Sobre o app. Texto sobre armazenamento local somente em Privacidade. Atualizações com “Buscar uma nova versão do aplicativo”.
- Migração de cores com lançamentos e regras preservados, sem recolorir ao reabrir.
- Ícone fornecido em `assets/icon.png`, conferido na abertura do APK atualizado sobre fundo escuro.

As capturas e os dados do emulador são artefatos locais ignorados pelo Git. Não há dados financeiros pessoais nos arquivos versionados de teste.

## Escopo encerrado desta entrega

O relatório de 10/10 registra os fluxos efetivamente percorridos no emulador e suas limitações. A análise externa está em [analise-thunder-wallet.md](analise-thunder-wallet.md).

O responsável dispensou as validações adicionais em aparelho físico, leitor de tela, APK de produção independente, Android antigo e situações especiais do dispositivo, incluindo passagem real de três meses para o backup automático. Elas ficam fora do escopo desta entrega e não são pendências para publicação. As limitações da cobertura realizada permanecem registradas no relatório.

A entrega 1.1.6 segue o fluxo de publicação automática documentado em [releases.md](releases.md).
