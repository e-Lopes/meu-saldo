# Meu Saldo 1.0.1 — Cadastro rápido e tema unificado

- Corrigida a seleção automática no campo de valor que fazia o segundo dígito substituir o primeiro.
- Botão de limpar com posição fixa e dica de formato do valor.
- Tema escuro unificado em azul para seleções, filtros, botões, navegação e campos de texto; cores de receita e despesa preservadas.
- Até três categorias mais usadas disponíveis diretamente no cadastro.
- Opção “Salvar e adicionar outro”, mantendo data, tipo e categoria e limpando valor e descrição.
- Confirmação visual após salvar e Histórico sem repetição da categoria quando não há descrição.
- Remoção individual dos filtros de tipo, categoria e busca.
- Validação em pushes e PRs, testes financeiros e Actions fixadas por commit com atualizações propostas pelo Dependabot.
- Push de release gera candidato; publicação após promoção ou opção explícita no disparo manual.

Validação local: TypeScript, formatação, cinco testes financeiros, onze testes de release, configuração e estrutura dos workflows aprovados. O candidato Android e a publicação passam pelas verificações de assinatura, pacote, versão, tamanho e SHA-256 no GitHub Actions.

A conferência visual, teclado, cadastro em sequência, instalação sobre a versão anterior e preservação dos dados em aparelho físico permanecem pendentes. A publicação foi solicitada sem essa conferência.

Instale sobre a versão anterior, sem desinstalar. Mantidos o identificador, a assinatura original e o formato dos dados locais. Versão interna Android: 9.
