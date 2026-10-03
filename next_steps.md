# Próximos passos — Meu Saldo

Atualizado em **03/10/2026**, após a publicação da **versão 1.5.0** (`versionCode` 7). O projeto continua Android, gratuito, offline, com dados locais e distribuição por APK assinado.

**Versão atual publicada: [1.0.0](https://github.com/e-Lopes/meu-saldo/releases/tag/v1.0.0) (`versionCode` 8).** A numeração pública foi reiniciada a pedido do responsável pelo projeto; o código interno continua crescente. Esta entrega sucede a 1.5.0 e foi gerada e publicada automaticamente na [execução 37097752926](https://github.com/e-Lopes/meu-saldo/actions/runs/37097752926), com a assinatura original. As notas da 1.5.0 foram preservadas em `release/history/1.5.0.md`. A conferência no celular permanece pendente.

## Entrega concluída

- [Release 1.5.0 publicado](https://github.com/e-Lopes/meu-saldo/releases/tag/v1.5.0), com APK e manifesto de atualização disponíveis.
- [Candidato Android](https://github.com/e-Lopes/meu-saldo/actions/runs/37091615803) compilado em Linux; [publicação](https://github.com/e-Lopes/meu-saldo/actions/runs/37092379142) concluída reutilizando o mesmo APK, sem recompilar. Hash SHA-256 do arquivo publicado conferido com o candidato e o manifesto.
- Checagem TypeScript, formatação, nove testes dos scripts de release e verificações de configuração, versão e assinatura passaram.
- `npm run release:prepare -- <versão>` sincroniza os arquivos de versão, incrementa `versionCode` e preserva notas anteriores.
- Início, atualização, navegação inferior e backup separados de `App.tsx`; cálculos, persistência e contrato nativo mantidos em suas responsabilidades atuais.
- Interface simplificada: cabeçalho compacto, até quatro categorias no Início, totais compactos no Histórico, detalhes sob demanda no Menu, atualização discreta e formulários com opções recolhidas e Salvar acessível com teclado.
- Mantidos gráficos, filtros, busca sem distinguir acentos, categorias arquivadas, desfazer exclusão, temas Sistema/Claro/Escuro e ocultação de valores. Preservados centavos, datas civis, JSON/AtomicFile, pacote e assinatura originais.

**A conferência visual e de uso em aparelho físico continua pendente.** Publicação bem-sucedida e verificações técnicas não comprovam preservação dos dados durante uma instalação real nem usabilidade no celular. O roteiro detalhado está em [docs/ui-validation.md](docs/ui-validation.md); os registros anteriores desse documento descrevem etapas anteriores à publicação da 1.5.0.

## Revisão local concluída — 03/10/2026

Os itens das prioridades abaixo já possuem implementação. Esta revisão corrigiu problemas encontrados no código e removeu partes antigas; os cenários que dependem de um celular continuam pendentes.

- Gráficos: seleção e resumo em azul no tema escuro, incluindo os períodos da evolução mensal.
- Categorias: 24 ícones e emoji personalizado com prévia; validação e backup preservam ícones anteriores, famílias, bandeiras e tons de pele.
- Histórico: filtros de categoria distribuídos em linhas; nomes longos cabem nos seletores. Emojis decorativos não crescem além do ícone nem repetem sua leitura por acessibilidade.
- Atualizações: uma resposta atrasada do cache não substitui a versão obtida na verificação; toques repetidos não abrem instalações simultâneas. O botão informa quando está abrindo o instalador.
- Limpeza: excluída a cópia local `.tools/legacy-compose/`, sem referência no projeto atual; removidos `expo-linear-gradient`, imports, tokens, reexportações e o fluxo antigo do cartão de atualização sem uso. TypeScript agora rejeita variáveis, imports e parâmetros não utilizados.
- Verificação local: `npm run validate`, os nove testes de release e verificações temporárias de cálculos, datas, emojis, backups e concorrência do atualizador passaram. Nenhuma suíte extensa da aplicação foi adicionada.

`adb devices -l` não encontrou aparelho conectado. Não foram realizados instalação sobre a versão anterior, testes com teclado/TalkBack/fontes no celular, seletores reais de arquivos ou download/instalação de APK. Não houve geração nem publicação de nova versão nesta revisão. Os resultados e cenários pendentes estão em [docs/ui-validation.md](docs/ui-validation.md).

## Prioridade 1 — conferir a atualização no celular

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
- Categorias: criar, personalizar, arquivar uma categoria usada, reativar e excluir uma sem registros; preservar referências e confirmar descarte de alterações.
- Menu e atualizações: abrir uma seção por vez, consultar notas, dispensar aviso e cancelar download; testar recuperação de backup com dados fictícios quando a leitura falhar.
- Acessibilidade: temas claro/escuro/sistema, fonte ampliada, nomes longos, telas estreitas e rótulos. Ocultar valores deve mascarar também totais, gráficos e textos de acessibilidade.

Corrigir os problemas encontrados antes de ampliar funcionalidades. Não há suíte de testes da aplicação; manter a conferência manual em aparelho físico, sem adicionar emulador ou uma suíte extensa apenas para esta revisão.

## Distribuição e próximas versões

Fluxo automático: **preparar versão → completar notas → commit e push na main → gerar e publicar o mesmo APK**. A publicação ocorre após as verificações técnicas, com assinatura original, manifesto de atualização e marcação `latest`; versões já publicadas não são sobrescritas. A geração sem publicação e a promoção manual continuam disponíveis para conferir antes de distribuir. Os comandos, workflows e verificações estão em [docs/releases.md](docs/releases.md). Registrar sempre as validações realizadas e pendentes nas notas; publicação automática não declara teste em aparelho físico.

Manter a compilação no GitHub Actions em Linux e `android/` gerada pelo Expo, com personalizações no plugin e módulo local. Preservar pacote e chave de assinatura para permitir atualização sobre instalações existentes. Login, sincronização, API financeira, migração de banco ou EAS Update não são próximos passos necessários para o uso pessoal e familiar atual.
