# Próximos passos — Meu Saldo

Atualizado em **08/10/2026**. O código continua Android, offline, com dados locais e distribuição por APK assinado. A versão configurada permanece 1.0.1 (`versionCode` 9); as alterações atuais ainda não representam uma nova publicação.

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

39 testes financeiros e de interação, checagem de tipos e formatação. APK debug compilado e instalado no Pixel 7/API 36, com dados preservados e conferência visual de Resumo, Histórico, Gráficos, Ajustes e abertura. Consulte [ui-validation.md](docs/ui-validation.md) para os limites dessa conferência.

## Prioridade antes de distribuir

Concluir no Android os cenários de teclado aberto, fonte ampliada, TalkBack, histórico extenso, fluxos completos de recorrência e seletores reais de backup. Conferir abertura em Android anterior à API 31 e instalação de APK release sobre a versão anterior assinada.

Após a conferência, preparar uma nova versão e suas notas, gerar um candidato, testar no aparelho físico e publicar o mesmo APK. A versão publicada anteriormente continua disponível em [Releases](https://github.com/e-Lopes/meu-saldo/releases/latest); este trabalho não alterou sua numeração nem disparou uma publicação manual.

Manter android/ gerada pelo Expo, com personalizações no plugin e módulo local. Preservar pacote e chave de assinatura. Não há necessidade de login, sincronização, API financeira ou banco de dados para o escopo atual.
