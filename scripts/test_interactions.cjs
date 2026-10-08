const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Execute real component callbacks and storage hooks with native boundaries simulated.
// This checks behavior; it does not claim to reproduce Android layout or scrolling.
function source(name, dependencies = {}) {
  const filename = path.join(__dirname, '..', 'src', name);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  });
  const module = { exports: {} };
  vm.runInNewContext(`(function(module, exports, require) {${outputText}\n})`, {
    TextEncoder,
    Date,
    Error,
    Promise,
    setInterval,
    clearInterval,
    requestAnimationFrame: (callback) => callback(),
  })(module, module.exports, (name) => {
    if (!Object.hasOwn(dependencies, name)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  });
  return module.exports;
}
const categoryIcons = source('categoryIcons.ts');
const finance = source('finance.ts', { './categoryIcons': categoryIcons });
const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
const runtime = { jsx, jsxs: jsx, Fragment: 'Fragment' };
const ui = Object.fromEntries(
  [
    'Button',
    'CategoryIcon',
    'Chip',
    'Field',
    'IconButton',
    'SegmentedControl',
    'Card',
    'Empty',
    'MetricCard',
    'SectionHeader',
  ].map((name) => [name, name]),
);
const appearance = {
  useAppearance: () => ({ palette: {}, s: {}, money: finance.money }),
};
const flush = () => new Promise((resolve) => setImmediate(resolve));
function hooks() {
  const slots = [];
  const effects = [];
  let position = 0;
  const react = {
    __esModule: true,
    default: { Fragment: 'Fragment' },
    useState(initial) {
      const index = position++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [
        slots[index],
        (value) => {
          slots[index] = typeof value === 'function' ? value(slots[index]) : value;
        },
      ];
    },
    useRef(initial) {
      const index = position++;
      return (slots[index] ??= { current: initial });
    },
    useMemo: (callback) => callback(),
    useEffect(callback) {
      const index = position++;
      if (!(index in slots)) {
        slots[index] = true;
        effects.push(callback);
      }
    },
  };
  const cleanups = [];
  return {
    react,
    render(callback) {
      position = 0;
      const result = callback();
      while (effects.length) cleanups.push(effects.shift()());
      return result;
    },
    unmount() {
      cleanups.forEach((cleanup) => cleanup?.());
    },
  };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function find(tree, type, property, value) {
  const result = nodes(tree).find((node) => node.type === type && node.props[property] === value);
  assert.ok(result, `${type} ${property}=${value} must be visible`);
  return result.props;
}
function seed(date = finance.today()) {
  return finance.saveEntry(
    finance.initialLedger(),
    { id: 'seed', kind: 'DESPESA', cents: 1000, date, categoryId: 'food', description: '' },
    { repeat: true, frequency: 'monthly', scope: 'future' },
    date,
  );
}
function form({
  ledger = finance.initialLedger(),
  entry = null,
  initialKind = 'RECEITA',
  draft,
  onDuplicate,
  onSave = async () => {},
  onClose = () => {},
} = {}) {
  const state = hooks();
  const alerts = [];
  const native = Object.fromEntries(
    [
      'KeyboardAvoidingView',
      'Modal',
      'Pressable',
      'ScrollView',
      'Text',
      'TextInput',
      'Switch',
      'View',
    ].map((name) => [name, name]),
  );
  const { EntryForm } = source('EntryForm.tsx', {
    react: state.react,
    'react/jsx-runtime': runtime,
    'react-native': {
      ...native,
      Alert: { alert: (...args) => alerts.push(args) },
      Keyboard: { dismiss() {} },
    },
    './Appearance': appearance,
    './SaveNotice': { SaveNotice: 'SaveNotice' },
    './SheetDialog': {
      useSheetDialog: () => ({ alert: (...args) => alerts.push(args), dialog: null }),
    },
    './ui': ui,
    './MenuRow': { MenuRow: 'MenuRow' },
    './CategoryScreen': { CategoryScreen: 'CategoryScreen' },
    './theme/tokens': { spacing: {} },
    './finance': finance,
    './useLedger': { errorMessage: (error) => error.message },
    '@react-native-community/datetimepicker': { default: 'DateTimePicker' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
  });
  const render = () =>
    state.render(() =>
      EntryForm({
        entry,
        ledger,
        month: finance.today().slice(0, 7),
        initialKind,
        draft,
        onDuplicate,
        onSave,
        onClose,
        onDelete: async () => {},
        mutate: async () => {},
      }),
    );
  return { render, alerts };
}

test('recurrence confirmation can cancel without saving, and repeated save taps are guarded', async () => {
  const saved = [];
  const app = form({ onSave: async (...args) => saved.push(args) });
  find(app.render(), 'Field', 'label', 'Valor (R$)').onChangeText('100');
  find(app.render(), 'Pressable', 'accessibilityRole', 'switch').onPress();
  const button = find(app.render(), 'Button', 'title', 'Salvar');
  button.onPress();
  button.onPress();
  assert.equal(app.alerts.length, 1);
  assert.match(app.alerts[0][1], /todo mês no dia/);
  app.alerts[0][2][0].onPress();
  await flush();
  assert.equal(saved.length, 0);
  find(app.render(), 'Button', 'title', 'Salvar').onPress();
  app.alerts[1][2][1].onPress();
  await flush();
  assert.equal(saved.length, 1);
  assert.equal(saved[0][1].repeat, true);
});

test('weekly confirmation names the weekday and save errors leave the form open for retry', async () => {
  let closed = false;
  const app = form({
    onSave: async () => {
      throw new Error('Falha de gravação');
    },
    onClose: () => {
      closed = true;
    },
  });
  find(app.render(), 'Field', 'label', 'Valor (R$)').onChangeText('20');
  find(app.render(), 'Pressable', 'accessibilityRole', 'switch').onPress();
  find(app.render(), 'SegmentedControl', 'label', 'Frequência da recorrência').onChange('weekly');
  find(app.render(), 'Button', 'title', 'Salvar').onPress();
  assert.match(
    app.alerts[0][1],
    new RegExp(finance.civilDate(finance.today()).toLocaleDateString('pt-BR', { weekday: 'long' })),
  );
  app.alerts[0][2][1].onPress();
  await flush();
  assert.equal(closed, false);
  assert.ok(nodes(app.render()).some((node) => node.props.children === 'Falha de gravação'));
  assert.equal(find(app.render(), 'Button', 'title', 'Salvar').disabled, false);
});

test('unchecking an active recurrence saves without an edit-scope prompt', async () => {
  const data = seed();
  let result;
  const app = form({
    ledger: data,
    entry: data.entries[0],
    onSave: async (...args) => {
      result = args;
    },
  });
  find(app.render(), 'Pressable', 'accessibilityRole', 'switch').onPress();
  find(app.render(), 'Button', 'title', 'Salvar').onPress();
  await flush();
  assert.equal(app.alerts.length, 0);
  assert.equal(result[1].repeat, false);
  const saved = finance.saveEntry(data, result[0], result[1]);
  assert.equal(saved.entries.length, 1);
  assert.equal(saved.entries[0].id, data.entries[0].id);
  assert.equal(saved.recurrences[0].active, false);
});

test('editing recurrence asks current versus future, and future updates require confirmation', async () => {
  for (const scope of ['current', 'future']) {
    const data = seed();
    let result;
    const app = form({
      ledger: data,
      entry: data.entries[0],
      onSave: async (...args) => {
        result = args;
      },
    });
    find(app.render(), 'Field', 'label', 'Valor (R$)').onChangeText('30');
    find(app.render(), 'Button', 'title', 'Salvar').onPress();
    assert.equal(app.alerts[0][0], 'Editar recorrência');
    app.alerts[0][2][scope === 'current' ? 1 : 2].onPress();
    await flush();
    if (scope === 'future') {
      assert.equal(result, undefined);
      assert.equal(app.alerts[1][0], 'Confirmar recorrência');
      app.alerts[1][2][1].onPress();
      await flush();
    }
    assert.equal(result[1].scope, scope);
  }
});

test('entry form keeps description and categories visible and clears incompatible categories', () => {
  const data = seed();
  const app = form({ ledger: data, entry: data.entries[0] });
  find(app.render(), 'Field', 'label', 'Descrição (opcional)');
  find(app.render(), 'Button', 'title', 'Criar categoria');
  find(app.render(), 'SegmentedControl', 'label', 'Tipo de lançamento').onChange('RECEITA');
  assert.equal(find(app.render(), 'Chip', 'children', 'Sem categoria').selected, true);
});

test('entry editing keeps deletion behind more actions and exposes a single category selector', () => {
  const data = seed();
  const app = form({ ledger: data, entry: data.entries[0] });
  let tree = app.render();
  assert.equal(
    nodes(tree).filter((node) => node.props.accessibilityLabel === 'Selecionar categoria').length,
    1,
  );
  assert.ok(!nodes(tree).some((node) => node.props.title === 'Excluir lançamento'));
  find(tree, 'Button', 'title', 'Mais ações').onPress();
  tree = app.render();
  find(tree, 'Button', 'title', 'Excluir lançamento');
  const labels = nodes(tree)
    .filter((node) => node.type === 'Field')
    .map((node) => node.props.label);
  assert.equal(labels[0], 'Valor (R$)');
  assert.equal(labels[1], 'Descrição (opcional)');
});

test('expanding entry actions scrolls after layout once and collapsing does not scroll', () => {
  const data = seed();
  const app = form({ ledger: data, entry: data.entries[0] });
  let tree = app.render();
  const scroll = nodes(tree).find((node) => node.type === 'ScrollView' && node.props.ref).props;
  const calls = [];
  scroll.ref.current = { scrollToEnd: (options) => calls.push(options.animated) };
  scroll.onContentSizeChange();
  assert.equal(calls.length, 0);
  const actions = nodes(tree).find(
    (node) => node.type === 'Button' && node.props.expanded === false,
  ).props;
  actions.onPress();
  assert.equal(calls.length, 0, 'Wait for the expanded content to be laid out');
  tree = app.render();
  assert.ok(nodes(tree).some((node) => node.type === 'Button' && node.props.expanded === true));
  scroll.onContentSizeChange();
  scroll.onContentSizeChange();
  assert.deepEqual(calls, [true]);
  nodes(tree)
    .find((node) => node.type === 'Button' && node.props.expanded === true)
    .props.onPress();
  app.render();
  scroll.onContentSizeChange();
  assert.deepEqual(calls, [true]);
});

test('category picker opens the selected category for editing and offers filled action buttons', () => {
  const data = seed();
  const app = form({ ledger: data, entry: data.entries[0] });
  let tree = app.render();
  const create = nodes(tree)
    .filter((node) => node.type === 'Button' && node.props.title === 'Criar categoria')
    .at(-1).props;
  const edit = find(tree, 'Button', 'title', 'Editar categoria');
  assert.equal(create.secondary, undefined);
  assert.equal(edit.secondary, undefined);
  assert.equal(edit.disabled, false);
  edit.onPress();
  tree = app.render();
  const category = data.categories.find((value) => value.id === data.entries[0].categoryId);
  const screen = find(tree, 'CategoryScreen', 'initialCategory', category);
  assert.equal(screen.createOnly, true);
  assert.equal(find(tree, 'Modal', 'transparent', true).visible, false);
  screen.onClose();
  assert.ok(!nodes(app.render()).some((node) => node.type === 'CategoryScreen'));
  const income = form();
  assert.equal(find(income.render(), 'Button', 'title', 'Editar categoria').disabled, true);
});

test('amount validation preserves input and values are always visible', () => {
  const data = seed();
  const app = form({ ledger: data, entry: data.entries[0] });
  assert.equal(find(app.render(), 'Field', 'label', 'Valor (R$)').secureTextEntry, undefined);
  assert.ok(!nodes(app.render()).some((node) => node.props.label?.includes('Mostrar valor')));
  find(app.render(), 'Field', 'label', 'Valor (R$)').onChangeText('1,234');
  find(app.render(), 'Button', 'title', 'Salvar').onPress();
  const field = find(app.render(), 'Field', 'label', 'Valor (R$)');
  assert.equal(field.value, '1,234');
  assert.match(field.error, /valor/);
});

test('sheet dialog applies only the selected scope and Android back cancels safely', () => {
  const state = hooks();
  const { useSheetDialog } = source('SheetDialog.tsx', {
    react: state.react,
    'react/jsx-runtime': runtime,
    'react-native': {
      Modal: 'Modal',
      Pressable: 'Pressable',
      ScrollView: 'ScrollView',
      Text: 'Text',
      View: 'View',
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    './Appearance': appearance,
    './ui': ui,
  });
  const render = () => state.render(() => useSheetDialog());
  const calls = [];
  const buttons = [
    { text: 'Cancelar', style: 'cancel', onPress: () => calls.push('cancel') },
    { text: 'Somente este', onPress: () => calls.push('current') },
    { text: 'Este e próximos', onPress: () => calls.push('future') },
  ];
  render().alert('Editar recorrência', 'Escolha o alcance', buttons);
  let tree = render().dialog;
  nodes(tree)
    .filter((node) => node.props.accessibilityRole === 'radio')[1]
    .props.onPress();
  find(render().dialog, 'Button', 'title', 'Aplicar alterações').onPress();
  assert.deepEqual(calls, ['future']);
  assert.equal(find(render().dialog, 'Modal', 'visible', false).visible, false);
  render().alert('Editar recorrência', 'Escolha o alcance', buttons);
  find(render().dialog, 'Modal', 'visible', true).onRequestClose();
  assert.deepEqual(calls, ['future', 'cancel']);
});

test('category creation presents type, name, emoji and ready icons in order and honors a changed type', async () => {
  const state = hooks();
  let data = finance.initialLedger();
  let created;
  let closed = false;
  const { CategoryScreen } = source('CategoryScreen.tsx', {
    react: state.react,
    'react/jsx-runtime': runtime,
    'react-native': {
      Alert: { alert() {} },
      KeyboardAvoidingView: 'KeyboardAvoidingView',
      Modal: 'Modal',
      Pressable: 'Pressable',
      ScrollView: 'ScrollView',
      Text: 'Text',
      View: 'View',
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    './Appearance': appearance,
    './finance': finance,
    './ui': ui,
    './categoryIcons': categoryIcons,
    './useLedger': { errorMessage: (error) => error.message },
  });
  const render = () =>
    state.render(() =>
      CategoryScreen({
        ledger: data,
        createOnly: true,
        initialKind: 'DESPESA',
        mutate: async (change) => {
          data = change(data);
        },
        onCreated: (category) => {
          created = category;
        },
        onClose: () => {
          closed = true;
        },
      }),
    );
  const fields = nodes(render())
    .filter((node) => node.type === 'Field' || node.type === 'SegmentedControl')
    .map((node) => node.props.label);
  assert.equal(JSON.stringify(fields), JSON.stringify(['Tipo da categoria', 'Nome', 'Usar emoji']));
  const tree = nodes(render());
  assert.ok(
    tree.findIndex((node) => node.props.children === 'Ícones prontos') >
      tree.findIndex((node) => node.props.label === 'Usar emoji'),
  );
  find(render(), 'SegmentedControl', 'label', 'Tipo da categoria').onChange('RECEITA');
  find(render(), 'IconButton', 'label', 'Voltar').onPress();
  assert.equal(closed, true, 'Changing only the type of an empty new category closes directly');
  closed = false;
  find(render(), 'Field', 'label', 'Nome').onChangeText('Salário');
  find(render(), 'Field', 'label', 'Usar emoji').onChangeText('💰');
  find(render(), 'Button', 'title', 'Salvar categoria').onPress();
  await flush();
  assert.equal(created.kind, 'RECEITA');
  assert.equal(created.icon, 'emoji:💰');
  assert.equal(closed, true);
  assert.equal(
    data.categories.at(-1).colorKey,
    finance.automaticCategoryColorKey(finance.initialLedger().categories, created.id),
  );
});

function ledgerHook(native) {
  const state = hooks();
  let listener;
  const appState = {
    currentState: 'active',
    addEventListener: (_event, callback) => {
      listener = callback;
      return { remove() {} };
    },
  };
  const { useLedger } = source('useLedger.ts', {
    react: state.react,
    'react-native': { AppState: appState },
    './finance': finance,
    './native': { __esModule: true, default: native },
  });
  return {
    render: () => state.render(useLedger),
    unmount: state.unmount,
    activate: () => listener('active'),
  };
}

test('v2 color migration is persisted once and reopening does not recolor or rewrite', async (t) => {
  const initial = finance.initialLedger();
  let disk = JSON.stringify({
    ...initial,
    categories: initial.categories.map(({ colorKey, ...c }) => c),
  });
  let writes = 0;
  const native = {
    readLedger: async () => disk,
    writeLedger: async (text) => {
      disk = text;
      writes++;
    },
  };
  const first = ledgerHook(native);
  t.after(first.unmount);
  first.render();
  await flush();
  assert.equal(writes, 1);
  assert.ok(JSON.parse(disk).categories.every((c) => c.colorKey));
  const migrated = disk;
  first.activate();
  await flush();
  assert.equal(writes, 1);
  const second = ledgerHook(native);
  t.after(second.unmount);
  second.render();
  await flush();
  assert.equal(writes, 1);
  assert.equal(disk, migrated);
});

test('storage writes cursor and occurrences atomically; failure preserves state and retry catches up once', async (t) => {
  const data = seed('2024-01-31');
  let disk = finance.encode(data);
  let fail = true;
  let writes = 0;
  const app = ledgerHook({
    readLedger: async () => disk,
    writeLedger: async (text) => {
      writes++;
      if (fail) throw new Error('Disco indisponível');
      disk = text;
    },
  });
  t.after(app.unmount);
  app.render();
  await flush();
  assert.equal(app.render().ledger.entries.length, 1);
  assert.equal(disk, finance.encode(data));
  fail = false;
  app.activate();
  await flush();
  const count = app.render().ledger.entries.length;
  assert.ok(count > 1);
  assert.equal(finance.decode(disk).entries.length, count);
  const successfulWrites = writes;
  app.activate();
  app.activate();
  await flush();
  assert.equal(app.render().ledger.entries.length, count);
  assert.equal(writes, successfulWrites);
});

test('queued mutations survive a failed write, and legacy migration is persisted before use', async (t) => {
  const initial = finance.initialLedger();
  let disk = JSON.stringify({
    version: 1,
    categories: initial.categories.map(({ kind, colorKey, ...category }) => category),
    entries: [],
  });
  let fail = false;
  const app = ledgerHook({
    readLedger: async () => disk,
    writeLedger: async (text) => {
      if (fail) {
        fail = false;
        throw new Error('Falha');
      }
      disk = text;
    },
  });
  t.after(app.unmount);
  app.render();
  await flush();
  assert.equal(JSON.parse(disk).version, 2);
  const store = app.render();
  const entry = {
    id: 'one',
    kind: 'RECEITA',
    cents: 1000,
    date: finance.today(),
    categoryId: null,
    description: '',
  };
  fail = true;
  const first = store.mutate((l) => ({ ...l, entries: [...l.entries, entry] }));
  const second = store.mutate((l) => ({ ...l, entries: [...l.entries, { ...entry, id: 'two' }] }));
  await assert.rejects(first);
  await second;
  assert.equal(app.render().ledger.entries.length, 1);
  assert.equal(app.render().ledger.entries[0].id, 'two');
  assert.equal(app.render().busy, false);
  assert.equal(finance.decode(disk).entries[0].id, 'two');
});

test('restoring a recurrence backup catches up atomically and a failed restoration preserves the current ledger', async (t) => {
  let disk = finance.encode(finance.initialLedger());
  let fail = false;
  const app = ledgerHook({
    readLedger: async () => disk,
    writeLedger: async (text) => {
      if (fail) throw new Error('Falha');
      disk = text;
    },
  });
  t.after(app.unmount);
  app.render();
  await flush();
  const backup = seed('2024-01-31');
  fail = true;
  await assert.rejects(app.render().restore(backup));
  assert.equal(app.render().ledger.entries.length, 0);
  assert.equal(finance.decode(disk).entries.length, 0);
  fail = false;
  await app.render().restore(backup);
  const count = app.render().ledger.entries.length;
  assert.ok(count > 1);
  assert.equal(finance.decode(disk).entries.length, count);
  app.activate();
  await flush();
  assert.equal(app.render().ledger.entries.length, count);
});

test('home keeps category navigation without duplicate registration shortcuts', () => {
  const state = hooks();
  const adds = [],
    histories = [],
    kinds = [],
    charts = [];
  const { HomeScreen } = source('HomeScreen.tsx', {
    react: state.react,
    'react/jsx-runtime': runtime,
    'react-native': {
      Pressable: 'Pressable',
      Text: 'Text',
      View: 'View',
      useWindowDimensions: () => ({ width: 360, fontScale: 1 }),
    },
    '@expo/vector-icons/Ionicons': { __esModule: true, default: 'Ionicons' },
    './Appearance': appearance,
    './finance': finance,
    './ui': ui,
    './theme/tokens': { spacing: {} },
  });
  const data = finance.initialLedger();
  data.entries.push({
    id: 'income',
    kind: 'RECEITA',
    cents: 1000,
    date: finance.today(),
    description: '',
    categoryId: null,
  });
  const tree = state.render(() =>
    HomeScreen({
      ledger: data,
      month: finance.today().slice(0, 7),
      onAdd: (kind) => adds.push(kind),
      openHistory: (...args) => histories.push(args),
      onKindHistory: (kind) => kinds.push(kind),
      onCharts: (kind) => charts.push(kind),
    }),
  );
  assert.ok(
    !nodes(tree).some((node) => ['Nova receita', 'Nova despesa'].includes(node.props.title)),
  );
  assert.deepEqual(adds, []);
  find(tree, 'MetricCard', 'label', 'Receitas').onPress();
  assert.deepEqual(kinds, ['RECEITA']);
  nodes(tree)
    .find(
      (node) =>
        node.type === 'Pressable' && node.props.accessibilityLabel.startsWith('Sem categoria:'),
    )
    .props.onPress();
  assert.deepEqual(histories, [['', 'RECEITA']]);
  find(tree, 'Pressable', 'accessibilityLabel', 'Ver todas as receitas').onPress();
  find(tree, 'Pressable', 'accessibilityLabel', 'Ver todas as despesas').onPress();
  assert.deepEqual(charts, ['RECEITA', 'DESPESA']);
});

test('history filters uncategorized income and keeps stable date sections without sticky native headers', () => {
  const state = hooks();
  const { HistoryScreen } = source('HistoryScreen.tsx', {
    react: state.react,
    'react/jsx-runtime': runtime,
    'react-native': {
      SectionList: 'SectionList',
      Modal: 'Modal',
      Pressable: 'Pressable',
      ScrollView: 'ScrollView',
      Text: 'Text',
      View: 'View',
    },
    '@expo/vector-icons/Ionicons': { __esModule: true, default: 'Ionicons' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    './Appearance': appearance,
    './finance': finance,
    './ui': ui,
    './LedgerRow': { LedgerRow: 'LedgerRow', historyDateLabel: finance.dateLabel },
  });
  let data = finance.saveCategory(finance.initialLedger(), {
    id: 'salary',
    kind: 'RECEITA',
    name: 'Salário',
    color: 0,
    icon: finance.icons[0],
    archived: false,
  });
  const entry = { kind: 'RECEITA', cents: 1000, date: finance.today(), description: '' };
  data.entries.push(
    { ...entry, id: 'a', categoryId: null },
    { ...entry, id: 'b', categoryId: 'salary' },
  );
  const tree = state.render(() =>
    HistoryScreen({
      ledger: data,
      month: finance.today().slice(0, 7),
      kind: 'RECEITA',
      category: '',
      search: '',
      onCategory() {},
      onSearch() {},
      onKind() {},
      onClear() {},
      onEdit() {},
    }),
  );
  const list = nodes(tree).find((node) => node.type === 'SectionList').props;
  assert.equal(list.sections.length, 1);
  assert.equal(list.sections[0].key, finance.today());
  assert.equal(list.sections[0].data.length, 1);
  assert.equal(list.sections[0].data[0].id, 'a');
  assert.equal(list.stickySectionHeadersEnabled, false);
  assert.equal(list.removeClippedSubviews, false);
  find(tree, 'Pressable', 'accessibilityLabel', 'Todos');
  find(tree, 'Pressable', 'accessibilityLabel', 'Receitas');
  find(tree, 'Pressable', 'accessibilityLabel', 'Despesas');
  find(tree, 'Pressable', 'accessibilityLabel', 'Filtrar por categoria');
  assert.equal(find(tree, 'Field', 'label', 'Buscar lançamentos').hideLabel, true);
  assert.equal(
    list.ListHeaderComponent,
    undefined,
    'Search and filters remain outside the scrolling list',
  );
  assert.equal(list.ListEmptyComponent.props.actionLabel, 'Limpar filtros');
});

test('history rows truncate long descriptions, align amounts right and show categories separately', () => {
  const { LedgerRow, historyDateLabel } = source('LedgerRow.tsx', {
    'react/jsx-runtime': runtime,
    'react-native': {
      Pressable: 'Pressable',
      Text: 'Text',
      View: 'View',
      useWindowDimensions: () => ({ width: 360, fontScale: 1.5 }),
    },
    '@expo/vector-icons/Ionicons': { __esModule: true, default: 'Ionicons' },
    './Appearance': appearance,
    './finance': finance,
    './ui': ui,
  });
  const entry = {
    id: 'a',
    kind: 'DESPESA',
    cents: 987654,
    date: finance.today(),
    categoryId: 'food',
    description: 'Mercado',
    recurrenceId: 'series',
  };
  const tree = LedgerRow({ entry, category: finance.initialLedger().categories[0], onEdit() {} });
  assert.equal(historyDateLabel(finance.today()), 'Hoje');
  assert.ok(nodes(tree).some((node) => node.props.children === 'Mercado'));
  assert.ok(nodes(tree).some((node) => node.props.name === 'repeat-outline'));
  const amount = nodes(tree).find(
    (node) =>
      node.type === 'Text' &&
      Array.isArray(node.props.style) &&
      node.props.style.some((style) => style?.textAlign === 'right'),
  );
  assert.ok(amount);
  assert.ok(JSON.stringify(tree).includes('9.876,54'));
  assert.equal(
    nodes(tree).find((node) => node.props.children === 'Mercado').props.numberOfLines,
    1,
  );
  assert.match(tree.props.accessibilityLabel, /despesa, − R\$/);
});

test('text, financial labels and category icons maintain contrast in the fixed dark theme', () => {
  const { darkColors } = source('theme/palettes.ts');
  const rgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const luminance = (rgb) =>
    rgb
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, index) => sum + v * [0.2126, 0.7152, 0.0722][index], 0);
  const contrast = (foreground, background) => {
    const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  };
  for (const [dark, palette] of [[true, darkColors]]) {
    for (const foreground of ['navy', 'muted', 'income', 'expense', 'warning'])
      for (const background of ['card', 'background', 'soft', 'selected'])
        assert.ok(
          contrast(rgb(palette[foreground]), rgb(palette[background])) >= 4.5,
          `${foreground} on ${background}`,
        );
    assert.ok(contrast(rgb(palette.onAccent), rgb(palette.accent)) >= 4.5);
    assert.ok(contrast(rgb(palette.accent), rgb(palette.card)) >= 4.5);
    assert.ok(contrast(rgb(palette.heroMuted), rgb(palette.hero)) >= 4.5);
    for (const family of finance.categoryPalette) {
      const color = rgb(dark ? family.dark : family.light);
      const alpha = (dark ? 0x22 : 0x10) / 255;
      const background = rgb(palette.card).map((v, i) => v * (1 - alpha) + color[i] * alpha);
      assert.ok(contrast(color, background) >= 3, `${family.key} icon contrast`);
    }
  }
});

test('category charts retain participation bars and six-month comparison without detailed analysis', () => {
  const state = hooks();
  const { Charts } = source('Charts.tsx', {
    react: state.react,
    'react/jsx-runtime': runtime,
    'react-native': {
      Pressable: 'Pressable',
      Text: 'Text',
      View: 'View',
      StyleSheet: { create: (styles) => styles },
    },
    '@expo/vector-icons/Ionicons': { __esModule: true, default: 'Ionicons' },
    'react-native-svg': {
      __esModule: true,
      default: 'Svg',
      Circle: 'Circle',
      G: 'G',
      Line: 'Line',
      Rect: 'Rect',
      Text: 'SvgText',
    },
    './Appearance': appearance,
    './finance': finance,
    './ui': ui,
  });
  const data = seed();
  const props = { ledger: data, month: finance.today().slice(0, 7), onCategory() {} };
  const render = () => state.render(() => Charts(props));
  const category = nodes(render()).find((node) => typeof node.type === 'function');
  const tree = category.type(category.props);
  assert.ok(nodes(tree).some((node) => node.props.children === 'Por categoria'));
  assert.ok(nodes(tree).some((node) => node.type === 'View' && node.props.style?.width === '100%'));
  assert.ok(
    !nodes(tree).some(
      (node) =>
        typeof node.props.children === 'string' &&
        node.props.children.includes('análise detalhada'),
    ),
  );
  const monthly = nodes(render()).filter((node) => typeof node.type === 'function')[1];
  const monthlyState = hooks();
  const trend = monthlyState.render(() => monthly.type(monthly.props));
  assert.ok(nodes(trend).some((node) => node.type === 'Svg'));
  assert.ok(nodes(trend).some((node) => node.props.children === 'Últimos 6 meses'));
});

test('duplicate action opens a new draft and saving does not edit the source or recurrence', async () => {
  const data = seed();
  const original = data.entries[0];
  let draft;
  const editor = form({
    ledger: data,
    entry: original,
    onDuplicate: (entry) => {
      draft = finance.duplicateEntry(entry);
    },
  });
  find(editor.render(), 'Button', 'title', 'Mais ações').onPress();
  find(editor.render(), 'Button', 'title', 'Duplicar lançamento').onPress();
  assert.ok(draft);
  const saved = [];
  const creator = form({ ledger: data, draft, onSave: async (...args) => saved.push(args) });
  assert.equal(
    find(creator.render(), 'Field', 'label', 'Descrição (opcional)').value,
    original.description,
  );
  find(creator.render(), 'Button', 'title', 'Salvar').onPress();
  await flush();
  assert.equal(saved.length, 1);
  assert.notEqual(saved[0][0].id, original.id);
  assert.equal(saved[0][0].date, finance.today());
  assert.equal(saved[0][1].repeat, false);
  assert.equal(data.entries.length, 1);
});

test('backup reminder offers explicit choices; background copy requires prior folder permission', async () => {
  const state = hooks();
  const alerts = [];
  let postponed = 0,
    background = 0;
  const { useBackup } = source('useBackup.ts', {
    react: state.react,
    'react-native': {
      Alert: { alert: (...args) => alerts.push(args) },
      AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
    },
    './finance': finance,
    './native': {
      __esModule: true,
      default: {
        getPreferences: async () => ({ lastBackup: 0, backgroundBackup: false, reminderAfter: 0 }),
        postponeBackup: async () => {
          postponed++;
        },
        backgroundBackup: async () => {
          background++;
        },
      },
    },
    './useLedger': { errorMessage: (error) => error.message },
  });
  state.render(() =>
    useBackup(
      { ledger: seed(), busy: false, loading: false },
      async () => {},
      () => {},
    ),
  );
  await flush();
  assert.equal(alerts[0][0], 'Proteja seus registros');
  assert.equal(background, 0);
  assert.deepEqual(
    Array.from(alerts[0][2], (a) => a.text),
    ['Depois', 'Em segundo plano', 'Fazer agora'],
  );
  alerts[0][2][0].onPress();
  await flush();
  assert.equal(postponed, 1);
});

test('automatic backup writes a complete snapshot and failed writes do not mark success', async () => {
  for (const failing of [false, true]) {
    const state = hooks();
    const data = seed();
    const before = JSON.stringify(data);
    let stored;
    const alerts = [];
    const { useBackup } = source('useBackup.ts', {
      react: state.react,
      'react-native': {
        Alert: { alert: (...args) => alerts.push(args) },
        AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
      },
      './finance': finance,
      './native': {
        __esModule: true,
        default: {
          getPreferences: async () => ({ lastBackup: 0, backgroundBackup: true, reminderAfter: 0 }),
          backgroundBackup: async (text) => {
            if (failing) throw new Error('Pasta indisponível');
            stored = text;
          },
        },
      },
      './useLedger': { errorMessage: (error) => error.message },
    });
    const render = () =>
      state.render(() =>
        useBackup(
          { ledger: data, busy: false, loading: false },
          async () => {},
          () => {},
        ),
      );
    render();
    await flush();
    assert.equal(render().backgroundSavedEvent, failing ? 0 : 1);
    assert.equal(JSON.stringify(data), before);
    if (failing) assert.equal(alerts[0][0], 'Backup não salvo');
    else assert.deepEqual(finance.decode(stored).recurrences, data.recurrences);
  }
});
