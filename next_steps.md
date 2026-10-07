# Próximos passos — Meu Saldo

Atualizado em **07/10/2026**, com a versão **1.0.1** (`versionCode` 9) preparada para publicação. O projeto continua Android, gratuito, offline, com dados locais e distribuição por APK assinado.

## Entrega concluída

- [Release 1.5.0 publicado](https://github.com/e-Lopes/meu-saldo/releases/tag/v1.5.0), com APK e manifesto de atualização disponíveis.
- [Candidato Android](https://github.com/e-Lopes/meu-saldo/actions/runs/37091615803) compilado em Linux; [publicação](https://github.com/e-Lopes/meu-saldo/actions/runs/37092379142) concluída reutilizando o mesmo APK, sem recompilar. Hash SHA-256 do arquivo publicado conferido com o candidato e o manifesto.
- Checagem TypeScript, formatação, nove testes dos scripts de release e verificações de configuração, versão e assinatura passaram.
- `npm run release:prepare -- <versão>` sincroniza os arquivos de versão, incrementa `versionCode` e preserva notas anteriores.
- Início, atualização, navegação inferior e backup separados de `App.tsx`; cálculos, persistência e contrato nativo mantidos em suas responsabilidades atuais.
- Interface simplificada: cabeçalho compacto, até quatro categorias no Início, totais compactos no Histórico, detalhes sob demanda no Menu, atualização discreta e formulários com opções recolhidas e Salvar acessível com teclado.
- Mantidos gráficos, filtros, busca sem distinguir acentos, categorias arquivadas, desfazer exclusão, temas Sistema/Claro/Escuro e ocultação de valores. Preservados centavos, datas civis, JSON/AtomicFile, pacote e assinatura originais.

**A conferência visual e de uso em aparelho físico continua pendente.** Publicação bem-sucedida e verificações técnicas não comprovam preservação dos dados durante uma instalação real nem usabilidade no celular. O roteiro detalhado está em [docs/ui-validation.md](docs/ui-validation.md); os registros anteriores desse documento descrevem etapas anteriores à publicação da 1.5.0.

## Correção local — 07/10/2026

- Campo de valor: desativada a seleção automática que fazia o segundo dígito substituir o primeiro no cadastro rápido.
- UI/UX: botão de limpar sempre no mesmo lugar, desabilitado quando o campo está vazio ou durante o salvamento; o campo não muda de largura após o primeiro dígito.
- Incluída a dica visual “Em reais. Ex.: 25 ou 25,50.” e desativada a autocorreção do valor.
- Removida, a pedido do usuário, a orientação falada adicionada ao campo (`accessibilityHint`). Não adicionar orientações para TalkBack ou recursos semelhantes nesta correção.
- Tema escuro unificado: azul para seleções, filtros, botões, navegação, cursor e seleção de texto. Removida a paleta exclusiva dos Gráficos; cores de receita/despesa preservadas. Cor do texto sobre botões centralizada na paleta para manter contraste.
- TypeScript e formatação do formulário passaram. A confirmação da digitação e do layout no Android continua pendente; não houve geração nem publicação de APK nesta correção.

## Prioridade 1 — conferir a atualização no celular

### Melhorias locais de cadastro e Histórico — 07/10/2026

- Até três categorias ativas mais usadas aparecem no formulário; ordenação por quantidade de despesas, sem selecionar automaticamente. O seletor completo continua disponível.
- “Salvar e adicionar outro” disponível em novos lançamentos: mantém data, tipo e categoria, limpa valor/descrição e retorna ao valor. O formulário limpo pode ser fechado sem pedir descarte; erros de gravação preservam o preenchimento. Proteção contra toques repetidos durante o salvamento.
- Confirmação visual de salvamento por três segundos, na tela principal ou no cadastro em sequência, somente após gravar os dados; sem orientação falada adicionada.
- Histórico sem repetir a categoria quando não há descrição; identificação de categorias arquivadas preservada.
- Filtros ativos de tipo, categoria e busca com botão de remoção individual; mantida a opção de limpar todos.
- `npm run validate` passou. Validar no celular: vários cadastros seguidos sem duplicação, manutenção da data/categoria, fechamento após salvar, recuperação de falha de gravação, confirmação temporária, categorias arquivadas e remoção de cada filtro sem afetar os demais. Conferir teclado aberto e telas estreitas. Sem APK gerado ou publicado nesta etapa.

Usar dados fictícios para os cenários destrutivos e guardar uma cópia de segurança antes da atualização.

1. Instalar a 1.5.0 sobre a versão anterior, sem desinstalar. Confirmar registros, categorias, tema e preferência de ocultação após abrir e reiniciar o app.
2. Cadastrar e editar um lançamento; verificar data no mês escolhido, erros de valor/categoria, teclado e botão Salvar. Confirmar preservação dos filtros ao voltar da edição.
3. Exportar um backup e restaurá-lo; conferir os dados recuperados. Cancelar seletores e testar arquivo inválido sem alterar os dados existentes. Só uma exportação concluída deve atualizar sua data no Menu.
4. Excluir e desfazer; confirmar recuperação do identificador, data, valor, descrição e categoria originais. Conferir também o encerramento do prazo da ação.
5. Ativar modo avião e continuar consultando, cadastrando e editando normalmente.
6. Registrar aparelho, versão do Android, versão anterior, resultados e problemas em `docs/ui-validation.md`, distinguindo cenários aprovados dos ainda não executados.

## Prioridade 2 — conferir a interface simplificada

- Início: mês vazio, somente receitas, saldo negativo e mais de quatro categorias; acesso aos Gráficos e ao Histórico filtrado.
- Histórico e Gráficos: busca por `alimentacao`, combinação de filtros, totais, troca de mês/ano e evolução de seis meses com períodos vazios.
- Formulário: alternar receita/despesa, buscar categoria, recolher descrição sem perder texto, alterar a data para outro mês e usar Voltar com alterações não salvas.
- Valor: digitar `1` e depois `2` e confirmar `12`, sem seleção automática; testar `25,50`, apagar dígitos, editar no meio do texto, sair e voltar ao campo e limpar/recomeçar. Confirmar largura estável, dica legível e botão Salvar acessível com o teclado aberto.
- Tema escuro: conferir o mesmo azul nos seletores de lançamento/gráficos/tema, filtros do Histórico, categorias selecionadas, navegação e botões. Verificar cursor e seleção de texto no Android e alternância Sistema/Claro/Escuro, mantendo receita e despesa distinguíveis.
- Categorias: criar, personalizar, arquivar uma categoria usada, reativar e excluir uma sem registros; preservar referências e confirmar descarte de alterações.
- Menu e atualizações: abrir uma seção por vez, consultar notas, dispensar aviso e cancelar download; testar recuperação de backup com dados fictícios quando a leitura falhar.
- Acessibilidade: temas claro/escuro/sistema, fonte ampliada, nomes longos, telas estreitas e rótulos. Ocultar valores deve mascarar também totais, gráficos e textos de acessibilidade.

Corrigir os problemas encontrados antes de ampliar funcionalidades. Há cinco testes focados de valores, datas, backups e totais; o formulário e a interface continuam exigindo conferência manual em aparelho físico.

## Distribuição e próximas versões

- Validação em todos os pushes e PRs: TypeScript, formatação, cinco testes financeiros, onze testes de release e configuração. Sem gerar APK ou acessar secrets de assinatura nessa rotina.
- Push de release gera candidato sem publicar; publicação após conferência pelo workflow de promoção. Publicação imediata disponível somente como opção explícita no disparo manual.
- Actions fixadas por commits consultados nos repositórios oficiais, com propostas semanais de atualização pelo Dependabot. Credenciais de assinatura criadas apenas após as validações e geração do projeto Android.
- Verificações locais aprovadas. Publicação da 1.0.1 solicitada pelo usuário; executar a validação no GitHub, gerar candidato e publicar os mesmos bytes. Registrar os resultados após a conclusão. Conferência em aparelho físico pendente.

Fluxo recomendado: **preparar versão → gerar candidato → conferir no celular → publicar o mesmo candidato**. Os comandos, workflows e verificações estão em [docs/releases.md](docs/releases.md). A confirmação de publicação autoriza distribuir; não declara que houve teste em aparelho físico. Registrar sempre as validações realizadas e pendentes nas notas.

Manter a compilação no GitHub Actions em Linux e `android/` gerada pelo Expo, com personalizações no plugin e módulo local. Preservar pacote e chave de assinatura para permitir atualização sobre instalações existentes. Login, sincronização, API financeira, migração de banco ou EAS Update não são próximos passos necessários para o uso pessoal e familiar atual.
