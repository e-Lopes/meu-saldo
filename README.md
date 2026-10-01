# meu-saldo
App mobile simples para fazer tracking de despesas

# Especificação de Projeto: App de Controle Financeiro Pessoal ("Meu Saldo")

## 1. Visão Geral do Aplicativo
* **Propósito:** Um aplicativo mobile leve, intuitivo e centrado na privacidade para agrupamento de despesas e controle de entradas de dinheiro por mês.
* **Filosofia:** *Local-First* e *Zero-Data-Collection* (total transparência sobre o fato de que nenhum dado financeiro sai do dispositivo do usuário).
* **Público-alvo:** Amigos e familiares que buscam uma ferramenta simples, gratuita e sem complicações para gerenciar o orçamento mensal.

---

## 2. Arquitetura de Privacidade e Dados
* **Armazenamento 100% Local:** Todos os dados (transações, categorias, saldos) são salvos exclusivamente no armazenamento interno do celular (utilizando IndexedDB / LocalStorage).
* **Ausência de Servidor Central:** Nenhum dado financeiro é enviado a servidores externos.
* **Autenticação Opcional:** Login opcional via Google apenas para fins de autenticação de identidade, permitindo ao usuário (se desejar) salvar um backup criptografado no seu próprio Google Drive pessoal.

---

## 3. Regras de Negócio e Funcionalidades

### 3.1 Gestão de Saldo e Períodos
* **Cálculo do Mês:** As finanças são organizadas por mês civil (com suporte opcional a datas de corte personalizadas).
* **Fórmula do Saldo do Mês:** 
  $$\text{Saldo do Mês} = \sum \text{Receitas} - \sum \text{Despesas}$$
* **Tratamento de Déficit:** Se as despesas superarem as receitas, o saldo do mês é exibido em destaque negativo/vermelho, sem bloqueios ou alertas punitivos, reconhecendo o uso legítimo de reservas ou saldo acumulado em conta.

### 3.2 Grupos e Categorias de Despesas
* Criação, edição e exclusão de grupos personalizados (ex: *Alimentação*, *Transporte*, *Contas*, *Lazer*).
* Atribuição de ícones e cores customizáveis para cada categoria.

### 3.3 Lançamentos
* Registro ágil de entradas (receitas) e saídas (despesas) com valor, categoria, data e descrição opcional.
* Suporte a transações recorrentes geradas localmente no dispositivo.

---

## 4. Stack Tecnológica (100% Gratuita)
* **Frontend:** React.js ou Vue.js com Tailwind CSS (responsivo, focado em experiência mobile nativa).
* **Gráficos:** Chart.js / Recharts para renderização de gráficos.
* **Armazenamento:** IndexedDB (via Dexie.js) para persistência local robusta.
* **Hospedagem:** Vercel ou Netlify (gratuitas e com deploy contínuo via GitHub).
* **Distribuição:** PWA (Progressive Web App) instalável diretamente pelo navegador via link direto (sem taxas de lojas de aplicativos).

---

## 5. Especificação de UI/UX (Layout e Design para Codex)

O design segue uma estética limpa, moderna e em tons de azul escuro/petróleo com cartões de contraste claro (estilo *Neumorphism/Flat Modern*), simulando um app rodando em um smartphone.

### 5.1 Estrutura de Telas e Componentes

#### A. Barra Superior (Header)
* **Nome do App:** "Meu Saldo" (com ícone indicativo).
* **Seletor de Período:** Setas de navegação lateral (`<` e `>`) com o mês e ano corrente em destaque (ex: *Outubro 2023*).

#### B. Card Principal: Saldo do Mês
* **Destaque Numérico:** Valor do saldo centralizado em tamanho grande (ex: `R$ 1.250,00`).
* **Indicador de Status:** Badge lateral ("Sobrou 📈" ou "Negativo 📉").
* **Rodapé do Card:** Detalhamento rápido do total de **Receitas** e **Despesas** do período.

#### C. Seção de Análise Visual (Gráfico de Barras com Linha de Somatório)
* *Substituição do gráfico de rosca tradicional por um gráfico de barras analítico.*
* **Gráfico de Barras:** Barras verticais lado a lado representando o valor gasto em cada categoria (Alimentação, Transporte, Contas, Lazer, Outros).
* **Linha de Somatório Percentual (Curva Pareto / Acumulada):** Uma linha sobreposta ao gráfico de barras indicando a porcentagem acumulada do orçamento consumida conforme as principais categorias avançam.

#### D. Seção de Resumo por Grupos
* Listagem em grade de cartões compactos por categoria.
* Cada cartão exibe: Ícone representativo, Nome do Grupo, Valor Total gasto e a porcentagem correspondente em relação ao total de despesas.

#### E. Barra de Navegação Inferior (Bottom Navigation)
* Ícones fixos para acesso rápido:
  1. `Início` (Dashboard principal)
  2. `Gráficos` (Visão analítica avançada)
  3. `Adicionar` (**Botão Flutuante Central** em destaque para lançamento rápido)
  4. `Transações` (Histórico completo)
  5. `Menu` (Configurações e termos de privacidade)
