# Meu Saldo

Organize suas finanças e acompanhe para onde vai o seu dinheiro. O Meu Saldo é um aplicativo gratuito para Android que reúne receitas, despesas e saldo mensal em um só lugar.

**Funciona sem internet, sem cadastro e sem anúncios.** Seus registros ficam no seu celular.

[**Baixar para Android**](https://github.com/e-Lopes/meu-saldo/releases/latest/download/meu-saldo.apk) · [Ver versões e novidades](https://github.com/e-Lopes/meu-saldo/releases/latest)

## O que você pode fazer

- **Acompanhar o mês:** veja quanto recebeu, quanto gastou e o saldo restante.
- **Registrar receitas e despesas:** adicione valores, datas e descrições; edite quando precisar.
- **Duplicar um lançamento:** crie uma cópia com a data de hoje, mantendo valor, descrição e categoria; a cópia não inicia uma recorrência.
- **Planejar o próximo período:** consulte as recorrências previstas para sete dias e a diferença de receitas e despesas em relação ao mês anterior.
- **Repetir lançamentos:** registre receitas e despesas semanais ou mensais automaticamente ao abrir o aplicativo.
- **Organizar por categorias:** separe receitas e despesas em grupos com nomes, emojis ou ícones prontos; a cor é escolhida automaticamente.
- **Entender seus hábitos:** consulte os gastos por categoria e compare receitas e despesas dos últimos seis meses.
- **Encontrar um lançamento:** busque no histórico e filtre por tipo ou categoria.
- **Consultar com clareza:** escolha o tema claro ou escuro em **Ajustes → Aparência**, com valores sempre visíveis.
- **Guardar uma cópia:** salve seus registros em um arquivo para recuperá-los depois ou levar para outro celular.
- **Lembrar do backup:** escolha exportar agora, adiar ou autorizar cópias em uma pasta. Depois de três meses, a cópia automática acontece ao entrar no aplicativo, com ele aberto.

O saldo considera as receitas menos as despesas do mês escolhido. Valores de meses anteriores não são somados automaticamente.

## Como instalar

Você precisa de um celular com **Android 8 ou superior**. A instalação é feita pelo arquivo do aplicativo, chamado APK, disponível aqui no GitHub.

1. Toque em [Baixar para Android](https://github.com/e-Lopes/meu-saldo/releases/latest/download/meu-saldo.apk).
2. Abra o arquivo `meu-saldo.apk` depois de concluir o download.
3. Se o Android solicitar, autorize a instalação pelo navegador ou aplicativo que abriu o arquivo.
4. Confirme a instalação e abra o Meu Saldo.

Se já usa o aplicativo, instale a nova versão sobre a anterior, **sem desinstalar**. Salve uma cópia dos seus registros antes de atualizar.

## Comece a usar

Toque em **+** e escolha **Despesa** ou **Receita** para registrar um lançamento. Preencha tipo, valor, descrição opcional, categoria, data e recorrência. Receitas podem ficar sem categoria. Crie uma categoria diretamente no lançamento ou em **Ajustes → Organização → Categorias**: escolha o tipo, informe o nome e, se quiser, use um emoji ou um ícone pronto.

Marque **Repetir lançamento** para escolher repetição mensal ou semanal. Confira a mensagem antes de salvar. Os registros vencidos são gerados ao abrir ou voltar ao aplicativo, mesmo sem internet; os próximos ainda não entram no saldo. Se o mês não tiver o dia escolhido, será usado o último dia do mês. Ao editar, escolha alterar só o lançamento atual ou também os próximos. Desmarcar a repetição e salvar apenas interrompe os próximos registros automáticos, mantendo o lançamento atual e o histórico.

No **Resumo**, acompanhe o saldo, os totais e até três principais grupos de receitas e despesas em duas colunas, com valores e percentuais; toque nos totais ou categorias para ver seus lançamentos e use **Ver todas** para consultar os gráficos de cada tipo. No **Histórico**, consulte, edite ou exclua lançamentos. Em **Gráficos**, veja a distribuição por categoria e a evolução dos últimos seis meses na mesma tela.

Os valores e percentuais ficam sempre visíveis. As categorias recebem uma das 12 cores da paleta, distribuídas de forma equilibrada e preservadas ao editar; a personalização da cor é opcional.

## Privacidade e cópias de segurança

Seus registros financeiros ficam armazenados no celular e não são enviados para servidores. Não há conexão com contas bancárias nem sincronização automática entre aparelhos. Cada pessoa mantém seus próprios dados.

A internet é usada para verificar e baixar atualizações pelo GitHub. Esses acessos não enviam suas receitas, despesas ou arquivos de cópia.

Para guardar uma cópia, abra **Ajustes → Dados e backup → Exportar backup**. Confira se o arquivo foi salvo e mantenha-o em um lugar seguro: ele contém seus registros e não tem proteção por senha.

**Desinstalar o aplicativo ou limpar seus dados apaga os registros do celular.** Para recuperá-los, você precisará de uma cópia salva anteriormente. Ao restaurar uma cópia, os registros atuais são substituídos após sua confirmação.

## Atualizações e ajuda

Consulte **Ajustes → Sobre o app → Atualizações → Verificar atualizações** para buscar uma nova versão. O download precisa de internet; as funções financeiras continuam disponíveis sem conexão.

Encontrou um problema ou tem uma sugestão? [Abra uma mensagem no projeto](https://github.com/e-Lopes/meu-saldo/issues). Descreva o que aconteceu e, se possível, informe o modelo do celular e a versão do aplicativo. Evite incluir dados financeiros pessoais.

Você pode compartilhar o [link de download](https://github.com/e-Lopes/meu-saldo/releases/latest/download/meu-saldo.apk) com amigos e familiares. Compartilhar o aplicativo não compartilha seus registros.

## Sobre o projeto

O Meu Saldo foi pensado para o acompanhamento das finanças pessoais e familiares, com registro manual e uso no próprio celular.

Para contribuir com o código ou conhecer os detalhes técnicos, consulte a [documentação de desenvolvimento](docs/desenvolvimento.md).

O ícone do aplicativo fica em [`assets/icon.png`](assets/icon.png), configurado em `app.json`. O plugin Android usa a mesma imagem na tela de abertura. Alterações no ícone exigem gerar e instalar um novo APK.
