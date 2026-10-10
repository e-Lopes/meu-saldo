# Testes de interface — 10/10/2026

57 cenários concluídos pela interface do Pixel 7 virtual, Android 16/API 36, x86_64. A conferência utilizou toques, digitação e rolagem por ADB, inspeção de capturas e da árvore de acessibilidade, e comparação dos registros efetivamente gravados. Esses resultados não garantem ausência de todos os bugs.

## Correções verificadas

- Recorrência em receita/despesa antiga: o interruptor usa o evento nativo do Android, mantém estado e frequências sincronizados, fecha o teclado e rola para as opções após a atualização do conteúdo.
- Aviso simplificado: “Desligando a recorrência, não haverá mais lançamentos como este nos próximos meses.” Para séries semanais, usa “nas próximas semanas”. Séries já encerradas começam com “Recorrência desligada”.
- Navegação entre meses: com histórico extenso, toques rápidos usavam o mês da renderização anterior e perdiam mudanças. A atualização agora usa o estado mais recente; 33 toques consecutivos chegaram ao mês esperado.

## Resultados

| Nº | Cenário | Resultado | Evidência conferida |
| --- | --- | --- | --- |
| 1 | Instalação e abertura | Passou | APK debug 1.1.5 instalado sobre o anterior; 11 lançamentos, 6 categorias e uma regra preservados. |
| 2 | Despesa antiga: ativação | Passou | Toque no interruptor nativo ativou a repetição e mostrou ambas as frequências. |
| 3 | Cancelar confirmação mensal | Passou | Não gravou a recorrência; formulário manteve a seleção. |
| 4 | Despesa antiga: mensal salva | Passou | Identidade, valor e data preservados; regra mensal criada. |
| 5 | Reabrir recorrência | Passou | Interruptor ativo e frequência mensal persistidos. |
| 6 | Alternar recorrência repetidamente | Passou | Dez alternâncias consecutivas mantiveram botão e opções sincronizados. |
| 7 | Receita antiga: semanal salva | Passou | Regra semanal salva com valor, data e categoria preservados. |
| 8 | Descarte e Voltar Android | Passou | Alteração apenas na repetição exige descarte; Voltar cancela o diálogo e descarte preserva a regra salva. |
| 9 | Editar somente ocorrência atual | Passou | Descrição da ocorrência mudou; regra e demais lançamentos preservados. |
| 10 | Editar atual e próximas | Passou | Confirmação adicional exibida; regra atualizada sem alterar outros lançamentos. |
| 11 | Alterar frequência de série ativa | Passou | Mensal virou semanal com cursor correto, após escolha de alcance e confirmação. |
| 12 | Encerrar recorrência | Passou | Desativar e salvar encerrou a regra sem excluir a ocorrência e sem pedir alcance de edição. |
| 13 | Reativar recorrência | Passou | Regra reativada sem duplicar lançamentos consumidos. |
| 14 | Excluir somente ocorrência e Desfazer | Passou | Ocorrência recuperada; regra continua ativa e dados anteriores conferidos. |
| 15 | Excluir e encerrar com Desfazer | Passou | Exclusão encerrou a regra; Desfazer restaurou ocorrência e atividade da série. |
| 16 | Duplicar ocorrência recorrente | Passou | Cópia independente salva na data atual, sem vínculo nem alteração da série de origem. |
| 17 | Digitar e apagar centavos | Passou | 12345 produziu R$ 123,45; apagar gerou R$ 12,34 e redigitar recuperou o valor. |
| 18 | Despesa sem categoria | Passou | Salvar manteve o formulário aberto e exibiu validação, sem gravar. |
| 19 | Categoria sem nome | Passou | Validação impediu criar uma categoria vazia. |
| 20 | Criar categoria pelo lançamento | Passou | Categoria de despesa criada com cor azul e ícone Casa, vinculada sem perder o valor do formulário. |
| 21 | Descrição longa e teclado na recorrência | Passou | Texto limitado a 300 caracteres; ativar recorrência fechou o teclado e revelou as frequências. |
| 22 | Salvar e adicionar outro | Passou | Despesa recorrente salva uma vez; novo formulário manteve categoria e limpou valor, descrição e recorrência. |
| 23 | Receita sem categoria | Passou | Receita salva com 12345 centavos e sem categoria. |
| 24 | Bloquear valor zero | Passou | Formulário impediu salvar receita com R$ 0,00. |
| 25 | Tipo de categoria usada | Passou | Troca de tipo está bloqueada quando há lançamentos ou recorrências vinculadas. |
| 26 | Arquivar categoria usada | Passou | Categoria arquivada; lançamentos e recorrências mantidos integralmente. |
| 27 | Reativar categoria | Passou | Categoria voltou à lista ativa mantendo cor, ícone e vínculos. |
| 28 | Cancelar categoria vazia | Passou | Mudar somente o tipo de uma nova categoria vazia não abriu aviso de descarte. |
| 29 | Excluir categoria sem uso | Passou | Categoria sem vínculos foi excluída após confirmação, sem remover dados financeiros. |
| 30 | Validar emoji pelo componente nativo | Passou | Texto abc rejeitado como emoji e categoria inválida não gravada. |
| 31 | Trocar emoji inválido por ícone | Passou | Escolher ícone limpou o erro e permitiu salvar a categoria. |
| 32 | Tema claro | Passou | Tema claro foi aplicado e persistido no armazenamento nativo. |
| 33 | Tema escuro | Passou | Tema escuro foi aplicado e persistido no armazenamento nativo. |
| 34 | Exportar pelo Android | Passou | Arquivo JSON gravado em Downloads pelo provedor real; conteúdo conferido integralmente. |
| 35 | Cancelar seletor de backup | Passou | Voltar no seletor de arquivos retornou ao app sem mudar os registros. |
| 36 | Cancelar substituição | Passou | Prévia exibida e cancelada sem alterar dados. |
| 37 | Backup inválido | Passou | JSON inválido foi rejeitado com aviso; registros existentes preservados. |
| 38 | Restaurar JSON antigo | Passou | Backup versão 1 migrado para versão 2 mantendo valor, data, categoria e ícone. |
| 39 | Restaurar exportação | Passou | Arquivo exportado pelo app restaurado pelo seletor com todos os registros e vínculos iguais. |
| 40 | Telas sem lançamentos | Passou | Resumo, Histórico e Gráficos acessíveis com mensagens de estado vazio após restauração. |
| 41 | Importar histórico extenso | Passou | Backup com 3017 lançamentos importado pelo provedor real sem perda de registros. |
| 42 | Totais com histórico extenso | Passou | Saldo, receitas e despesas de outubro conferidos contra a soma dos centavos armazenados. |
| 43 | Rolar histórico extenso | Passou | Oito rolagens em cada sentido percorreram datas e registros diferentes; navegação e lista permaneceram disponíveis. |
| 44 | Busca e filtros combinados | Passou | Busca exata encontrou uma receita; filtro de despesas não encontrou resultados; Alimentação mostrou os 173 registros esperados e limpar recuperou a lista. |
| 45 | Gráficos com histórico extenso | Passou | Distribuição por categoria e comparação mensal acessíveis com 3017 registros. |
| 46 | Receita de mês anterior: mensal | Passou | Receita de setembro convertida em mensal; data e centavos preservados, próxima ocorrência em 30/10. |
| 47 | Navegação rápida entre meses | Passou | 33 toques consecutivos na seta anterior levaram outubro/2026 a janeiro/2024, sem perder mudanças de mês. |
| 48 | Data antiga, mês curto e ano bissexto | Passou | Despesa de 31/01/2024 convertida pela interface; recuperação incluiu 29/02/2024 e 28/02/2025, sem duplicatas. |
| 49 | Backup automático com pasta real | Passou | Pasta autorizada pelo Android; primeira cópia conferida integralmente e ativação refletida nos Ajustes. |
| 50 | Desativar backup automático | Passou | Novas cópias desativadas sem apagar a cópia gravada na pasta autorizada. |
| 51 | Persistência e reabertura | Passou | Fechar o processo e reabrir preservou todos os lançamentos e regras sem duplicar ocorrências recuperadas. |
| 52 | Fonte ampliada | Passou | Fonte do Android em 200%; frequências acessíveis e ações Salvar/Salvar e adicionar outro alcançadas no formulário. |
| 53 | Tela estreita | Passou | Resolução reduzida a 720x1600; opções mensais e semanais acessíveis após ativar a recorrência. |
| 54 | Consulta em modo avião | Passou | Resumo, Histórico e Gráficos continuaram acessíveis com modo avião ligado e Wi-Fi desligado, sem alterar registros. JS previamente carregado pelo Metro via USB. |
| 55 | Verificar atualização sem internet | Passou | Falha de conexão exibiu aviso de continuar usando o app offline e preservou os dados. |
| 56 | Restaurar ambiente original | Passou | 11 lançamentos, 6 categorias, regra original, tema e preferências restaurados; reabertura conferida sem dados fictícios adicionais. |
| 57 | Aviso simples de recorrência | Passou | Textos mensal e semanal conferidos na interface; cancelar a edição manteve a regra e os registros originais. |

## Verificações complementares

- `npm test`: 56 testes aprovados, sem falhas, cancelamentos ou testes ignorados.
- `npm run validate`: TypeScript e formatação aprovados.
- `python scripts/test_release_tools.py`: 11 testes aprovados.
- `git diff --check`: aprovado.
- APK debug 1.1.5 compilado e instalado sobre o anterior. Nenhuma publicação de versão foi realizada.

## Ambiente e preservação

Os dados usados incluíram registros fictícios, um backup antigo, um backup inválido e um histórico de 3.017 lançamentos. As capturas, XMLs, cópias originais e registros detalhados ficam em `.dist/manual-2026-10-10/`, ignorado pelo Git. O armazenamento financeiro e as preferências originais do emulador foram restaurados e conferidos após reabrir o app; o APK com as correções ficou instalado.

## Limites da conferência

As validações adicionais abaixo foram dispensadas pelo responsável em 10/10/2026 para lançar a versão 1.1.6. Elas documentam limites dos testes realizados e não constituem pendências desta entrega. Leitor de tela está fora do escopo solicitado.

- O aplicativo foi executado em desenvolvimento pelo Metro. Atualização com a assinatura de produção e abertura de APK independente em modo avião não foram conferidas manualmente.
- O teclado configurado no emulador era o Gboard em modo flutuante com teclado físico. O teste confirmou o fechamento ao ativar a recorrência; teclado normal ancorado e diferentes fabricantes não foram conferidos.
- A árvore de acessibilidade foi inspecionada; leitura e gestos com TalkBack não foram validados.
- Outros níveis de API, falhas reais de armazenamento, revogação de permissões e passagem real de três meses para o backup automático não foram reproduzidos. Existem testes automatizados de falhas de gravação e da política do backup.
- A rolagem foi conferida funcionalmente; não houve medição de FPS, memória ou desempenho de produção.
