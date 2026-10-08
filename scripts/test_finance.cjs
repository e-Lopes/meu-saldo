const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the real TypeScript modules without loading React Native or adding a test framework.
function loadSource(name, dependencies = {}) {
  const filename = path.join(__dirname, '..', 'src', `${name}.ts`);
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const module = { exports: {} };
  vm.runInThisContext(`(function(module, exports, require) {${outputText}\n})`, { filename })(
    module,
    module.exports,
    (id) => {
      if (!Object.hasOwn(dependencies, id)) throw new Error(`Unexpected dependency: ${id}`);
      return dependencies[id];
    },
  );
  return module.exports;
}
const finance = loadSource('finance', { './categoryIcons': loadSource('categoryIcons') });
const expense = (overrides = {}) => ({
  id: 'expense',
  kind: 'DESPESA',
  cents: 12550,
  date: '2024-02-29',
  categoryId: 'food',
  description: 'Compras',
  ...overrides,
});
const ledger = () => ({ ...finance.initialLedger(), entries: [expense()] });

test('money input preserves exact cents and accepts comma or decimal point', () => {
  for (const [input, cents] of [
    ['1', 100],
    ['12', 1200],
    ['25,50', 2550],
    ['0,01', 1],
    ['1.1', 110],
    [' 125,50 ', 12550],
    ['1000000000', 100000000000],
  ])
    assert.equal(finance.parseCents(input), cents);
  for (const input of ['', '0', '-1', '1,234', '1.000,00', 'NaN', '1e3', '1000000000,01'])
    assert.throws(() => finance.parseCents(input), undefined, input);
});

test('civil dates and month navigation survive year boundaries and leap days', () => {
  assert.equal(finance.shiftMonth('2026-12', 1), '2027-01');
  assert.equal(finance.shiftMonth('2026-01', -1), '2025-12');
  const date = finance.civilDate('2024-02-29');
  assert.deepEqual([date.getFullYear(), date.getMonth() + 1, date.getDate()], [2024, 2, 29]);
  for (const invalid of ['2023-02-29', '2024-04-31', '2024-13-01'])
    assert.throws(() =>
      finance.decode(JSON.stringify({ ...ledger(), entries: [expense({ date: invalid })] })),
    );
});

test('backup round trip preserves archived categories, emoji and entries', () => {
  const original = ledger();
  original.categories[0].archived = true;
  original.categories[0].icon = 'emoji:👨‍👩‍👧‍👦';
  original.entries.push(expense({ id: 'income', kind: 'RECEITA', categoryId: null, cents: 50000 }));
  assert.deepEqual(finance.decode(finance.encode(original)), original);
});

test('invalid backups cannot introduce duplicates, dangling references or unsafe amounts', () => {
  const fixtures = [
    { ...ledger(), version: 3 },
    { ...ledger(), unexpected: true },
    { ...ledger(), entries: [expense(), expense()] },
    { ...ledger(), entries: [expense({ categoryId: 'missing' })] },
    { ...ledger(), entries: [expense({ categoryId: null })] },
    { ...ledger(), entries: [expense({ cents: 12.5 })] },
    { ...ledger(), entries: [expense({ cents: Number.MAX_SAFE_INTEGER })] },
    { ...ledger(), categories: [...ledger().categories, ledger().categories[0]] },
  ];
  for (const fixture of fixtures) assert.throws(() => finance.decode(JSON.stringify(fixture)));
  assert.throws(() => finance.decode('{broken'));
});

const recurring = (kind = 'DESPESA', frequency = 'monthly', date = '2024-01-31') =>
  finance.saveEntry(
    finance.initialLedger(),
    expense({ kind, date, categoryId: kind === 'DESPESA' ? 'food' : null }),
    { repeat: true, frequency, scope: 'future' },
    date,
  );

test('v1 backups migrate expense categories and uncategorized income without losing entries', () => {
  const data = ledger();
  const legacy = {
    version: 1,
    categories: data.categories.map(({ kind, colorKey, ...category }) => category),
    entries: [expense(), expense({ id: 'salary', kind: 'RECEITA', categoryId: null })],
  };
  const migrated = finance.decode(JSON.stringify(legacy));
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.entries, legacy.entries);
  assert.ok(migrated.categories.every((c) => c.kind === 'DESPESA'));
  assert.deepEqual(migrated.recurrences, []);
  assert.deepEqual(finance.decode(finance.encode(migrated)), migrated);
  legacy.entries[1].categoryId = 'food';
  const unusual = finance.decode(JSON.stringify(legacy));
  const income = unusual.entries[1];
  assert.equal(unusual.categories.find((c) => c.id === income.categoryId).kind, 'RECEITA');
  assert.deepEqual(finance.decode(finance.encode(unusual)), unusual);
});

test('monthly recurrence clamps February and restores the original day, including leap years', () => {
  let data = recurring();
  data = finance.generateOccurrences(data, '2024-04-30');
  assert.deepEqual(
    data.entries.map((e) => e.date),
    ['2024-01-31', '2024-02-29', '2024-03-31', '2024-04-30'],
  );
  assert.equal(data.recurrences[0].nextDate, '2024-05-31');
  assert.equal(finance.nextOccurrence('monthly', '2023-01-31', '2023-01-31'), '2023-02-28');
  assert.equal(finance.nextOccurrence('monthly', '2024-01-30', '2024-02-29'), '2024-03-30');
  assert.equal(finance.nextOccurrence('monthly', '2024-12-31', '2024-12-31'), '2025-01-31');
  assert.deepEqual(finance.decode(finance.encode(data)), data);
});

test('weekly income recurrence catches up across years and never includes future dates', () => {
  const data = finance.generateOccurrences(
    recurring('RECEITA', 'weekly', '2024-12-30'),
    '2025-01-15',
  );
  assert.deepEqual(
    data.entries.map((e) => e.date),
    ['2024-12-30', '2025-01-06', '2025-01-13'],
  );
  assert.equal(data.recurrences[0].nextDate, '2025-01-20');
  assert.ok(data.entries.every((e) => e.kind === 'RECEITA' && e.categoryId === null));
  assert.equal(finance.generateOccurrences(data, '2025-01-15'), data);
});

test('catch-up is idempotent after reopening, backup round trip and occurrence deletion', () => {
  let data = finance.generateOccurrences(recurring(), '2024-12-31');
  assert.equal(data.entries.length, 12);
  const deleted = data.entries[3];
  data = finance.removeEntry(data, deleted.id);
  data = finance.generateOccurrences(finance.decode(finance.encode(data)), '2024-12-31');
  assert.equal(data.entries.length, 11);
  assert.ok(!data.entries.some((e) => e.id === deleted.id));
  data = finance.generateOccurrences(data, '2025-01-31');
  assert.equal(data.entries.length, 12);
  assert.equal(new Set(data.entries.map((e) => `${e.recurrenceId}/${e.occurrenceDate}`)).size, 12);
});

test('activating an existing entry uses it as the seed and recovers only subsequent dates', () => {
  const data = finance.saveEntry(
    ledger(),
    expense(),
    { repeat: true, frequency: 'weekly', scope: 'future' },
    '2024-03-14',
  );
  assert.deepEqual(
    data.entries.map((e) => e.date),
    ['2024-02-29', '2024-03-07', '2024-03-14'],
  );
  assert.equal(data.entries[0].id, 'expense');
  assert.equal(data.recurrences.length, 1);
});

test('unchecking recurrence preserves the current entry and all history and stops future generation', () => {
  const original = finance.generateOccurrences(recurring(), '2024-03-31');
  const data = finance.saveEntry(
    original,
    original.entries[1],
    { repeat: false, frequency: 'monthly', scope: 'current' },
    '2024-03-31',
  );
  assert.deepEqual(data.entries, original.entries);
  assert.equal(data.recurrences[0].active, false);
  assert.equal(finance.generateOccurrences(data, '2027-01-01'), data);
});

test('editing only the current occurrence preserves its identity and leaves the rule untouched', () => {
  const original = finance.generateOccurrences(recurring(), '2024-02-29');
  const current = original.entries[1];
  const data = finance.saveEntry(
    original,
    { ...current, date: '2024-02-28', cents: 9900 },
    { repeat: true, frequency: 'weekly', scope: 'current' },
    '2024-02-29',
  );
  assert.deepEqual(data.recurrences, original.recurrences);
  assert.equal(data.entries[1].occurrenceDate, '2024-02-29');
  assert.equal(data.entries[1].cents, 9900);
  assert.equal(finance.generateOccurrences(data, '2024-03-31').entries[2].cents, current.cents);
});

test('editing current and future preserves other generated entries and the monthly anchor', () => {
  const original = finance.generateOccurrences(recurring(), '2024-03-31');
  const february = original.entries[1];
  const changed = finance.saveEntry(
    original,
    { ...february, cents: 5000, description: 'Novo valor' },
    { repeat: true, frequency: 'monthly', scope: 'future' },
    '2024-03-31',
  );
  assert.deepEqual(changed.entries[0], original.entries[0]);
  assert.deepEqual(changed.entries[2], original.entries[2]);
  const data = finance.generateOccurrences(changed, '2024-05-31');
  assert.deepEqual(
    data.entries.slice(3).map((e) => [e.date, e.cents]),
    [
      ['2024-04-30', 5000],
      ['2024-05-31', 5000],
    ],
  );
});

test('changing the future frequency or date does not regenerate elapsed periods', () => {
  const original = finance.generateOccurrences(recurring(), '2024-03-31');
  const data = finance.saveEntry(
    original,
    { ...original.entries[1], date: '2024-02-26' },
    { repeat: true, frequency: 'weekly', scope: 'future' },
    '2024-03-31',
  );
  assert.equal(data.entries.length, 3);
  assert.equal(data.recurrences[0].nextDate, '2024-04-01');
  assert.deepEqual(
    finance
      .generateOccurrences(data, '2024-04-08')
      .entries.slice(3)
      .map((e) => e.date),
    ['2024-04-01', '2024-04-08'],
  );
});

test('deleting and stopping recurrence preserves other history; inactive rules survive backup', () => {
  const original = finance.generateOccurrences(recurring(), '2024-03-31');
  const data = finance.removeEntry(original, original.entries[1].id, true);
  assert.deepEqual(data.entries, [original.entries[0], original.entries[2]]);
  assert.equal(data.recurrences[0].active, false);
  assert.equal(finance.generateOccurrences(data, '2026-10-07'), data);
  assert.deepEqual(finance.decode(finance.encode(data)), data);
});

test('reactivating a stopped series keeps its history and does not regenerate consumed dates', () => {
  const original = finance.generateOccurrences(recurring(), '2024-03-31');
  const stopped = finance.saveEntry(
    original,
    original.entries[1],
    { repeat: false, frequency: 'monthly', scope: 'current' },
    '2024-03-31',
  );
  const resumed = finance.saveEntry(
    stopped,
    stopped.entries[1],
    { repeat: true, frequency: 'monthly', scope: 'current' },
    '2024-05-31',
  );
  assert.equal(resumed.recurrences.length, 1);
  assert.equal(resumed.entries.length, 5);
  assert.deepEqual(resumed.entries.slice(0, 3), original.entries);
  assert.deepEqual(
    resumed.entries.slice(3).map((e) => e.date),
    ['2024-04-30', '2024-05-31'],
  );
});

test('income groups sum the selected month and include uncategorized income', () => {
  let data = finance.saveCategory(ledger(), {
    id: 'salary',
    kind: 'RECEITA',
    name: 'Salário',
    color: 0,
    icon: finance.icons[0],
    archived: false,
  });
  data.entries.push(
    expense({ id: 'a', kind: 'RECEITA', categoryId: 'salary', cents: 10000 }),
    expense({ id: 'b', kind: 'RECEITA', categoryId: 'salary', cents: 20000 }),
    expense({ id: 'c', kind: 'RECEITA', categoryId: null, cents: 5000 }),
    expense({
      id: 'next',
      kind: 'RECEITA',
      categoryId: 'salary',
      cents: 100000,
      date: '2024-03-01',
    }),
  );
  const rows = finance.groups(data, '2024-02', 'RECEITA');
  assert.deepEqual(
    rows.map((g) => [g.category.name, g.cents]),
    [
      ['Salário', 30000],
      ['Sem categoria', 5000],
    ],
  );
  assert.equal(finance.groups(data, '2024-02')[0].cents, 12550);
  assert.deepEqual(finance.decode(finance.encode(data)), data);
});

test('12 category colors stay balanced, deterministic and stable after edits or deletion', () => {
  let data = finance.initialLedger();
  assert.equal(finance.categoryPalette.length, 12);
  for (let index = 0; index < 115; index++) {
    const category = {
      id: `extra-${index}`,
      kind: index % 2 ? 'RECEITA' : 'DESPESA',
      name: `Categoria ${index}`,
      color: 0,
      icon: finance.icons[0],
      archived: false,
    };
    const key = finance.automaticCategoryColorKey(data.categories, category.id);
    assert.equal(
      finance.automaticCategoryColorKey([...data.categories].reverse(), category.id),
      key,
    );
    data = finance.saveCategory(data, category);
    assert.equal(data.categories.at(-1).colorKey, key);
    const counts = finance.categoryPalette.map(
      (color) => data.categories.filter((c) => c.colorKey === color.key).length,
    );
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
  }
  const original = data.categories[0];
  data = finance.saveCategory(data, { ...original, name: 'Outro nome', icon: 'emoji:🍕' });
  assert.equal(data.categories[0].colorKey, original.colorKey);
  data = { ...data, categories: data.categories.filter((c) => c.id !== 'transport') };
  assert.equal(
    finance.decode(finance.encode(data)).categories.find((c) => c.id === original.id).colorKey,
    original.colorKey,
  );
  data = finance.saveCategory(data, { ...data.categories[0], colorKey: 'amber' });
  assert.equal(data.categories[0].colorKey, 'amber');
  assert.equal(finance.categoryColor(data.categories[0]), '#B7791F');
  assert.equal(finance.categoryColor(data.categories[0], true), '#F0CA70');
});

test('legacy category colors migrate once and persist through backups and reordering', () => {
  const legacy = ledger();
  legacy.categories = legacy.categories.map(({ colorKey, ...category }) => category);
  const migrated = finance.decode(JSON.stringify(legacy));
  assert.deepEqual(migrated.entries, legacy.entries);
  assert.ok(migrated.categories.every((c) => c.colorKey));
  const byId = (data) => Object.fromEntries(data.categories.map((c) => [c.id, c.colorKey]));
  assert.deepEqual(
    byId(
      finance.decode(JSON.stringify({ ...legacy, categories: [...legacy.categories].reverse() })),
    ),
    byId(migrated),
  );
  assert.deepEqual(finance.decode(finance.encode(migrated)), migrated);
  assert.deepEqual(finance.decode(finance.encode(legacy)), migrated);
  assert.throws(() =>
    finance.decode(
      JSON.stringify({
        ...migrated,
        categories: [{ ...migrated.categories[0], colorKey: 'random' }],
      }),
    ),
  );
});

test('category types are locked by entries or rules, including archived and stopped series', () => {
  const original = ledger();
  assert.throws(() =>
    finance.saveCategory(original, { ...original.categories[0], kind: 'RECEITA' }),
  );
  assert.equal(
    finance.saveCategory(original, { ...original.categories[1], kind: 'RECEITA' }).categories[1]
      .kind,
    'RECEITA',
  );
  let data = recurring();
  data = finance.removeEntry(data, data.entries[0].id, true);
  assert.ok(finance.categoryUsed(data, 'food'));
  assert.throws(() => finance.saveCategory(data, { ...data.categories[0], kind: 'RECEITA' }));
  data = finance.saveCategory(data, { ...data.categories[0], archived: true });
  assert.deepEqual(finance.decode(finance.encode(data)), data);
});

test('recurrence backup rejects dangling references, invalid schedules and duplicate occurrences', () => {
  const data = recurring();
  const rule = data.recurrences[0];
  const fixtures = [
    { ...data, recurrences: [] },
    { ...data, recurrences: [rule, rule] },
    { ...data, recurrences: [{ ...rule, categoryId: null }] },
    { ...data, recurrences: [{ ...rule, nextDate: '2024-02-30' }] },
    { ...data, recurrences: [{ ...rule, nextDate: '2024-02-28' }] },
    { ...data, recurrences: [{ ...rule, nextDate: rule.anchorDate }] },
    { ...data, recurrences: [{ ...rule, frequency: 'daily' }] },
    { ...data, recurrences: [{ ...rule, cents: 0 }] },
    { ...data, recurrences: [{ ...rule, active: 'yes' }] },
    { ...data, entries: [data.entries[0], { ...data.entries[0], id: 'copy' }] },
    { ...data, entries: [{ ...data.entries[0], occurrenceDate: undefined }] },
    { ...data, entries: [{ ...data.entries[0], kind: 'RECEITA' }] },
  ];
  for (const fixture of fixtures) assert.throws(() => finance.decode(JSON.stringify(fixture)));
});

test('monthly totals exclude other months and balance income against expenses', () => {
  const data = ledger();
  data.entries.push(expense({ id: 'income', kind: 'RECEITA', categoryId: null, cents: 50000 }));
  data.entries.push(expense({ id: 'march', date: '2024-03-01', cents: 100 }));
  assert.deepEqual(finance.totals(finance.monthEntries(data, '2024-02')), {
    income: 50000,
    expense: 12550,
    balance: 37450,
  });
  assert.deepEqual(finance.totals(finance.monthEntries(data, '2025-02')), {
    income: 0,
    expense: 0,
    balance: 0,
  });
});

test('duplicates preserve financial fields but start as independent entries today', () => {
  for (const kind of ['RECEITA', 'DESPESA']) {
    const original = expense({
      kind,
      categoryId: kind === 'RECEITA' ? null : 'food',
      recurrenceId: 'series',
      occurrenceDate: '2024-02-29',
    });
    const copy = finance.duplicateEntry(original, '2026-10-08');
    assert.notEqual(copy.id, original.id);
    assert.equal(copy.date, '2026-10-08');
    assert.equal(copy.cents, original.cents);
    assert.equal(copy.categoryId, original.categoryId);
    assert.equal(copy.description, original.description);
    assert.equal(copy.kind, original.kind);
    assert.equal(copy.recurrenceId, undefined);
    assert.equal(copy.occurrenceDate, undefined);
    assert.equal(original.date, '2024-02-29');
  }
});

test('seven-day forecast is read-only, skips inactive series and uses real civil schedules', () => {
  const data = finance.initialLedger();
  data.recurrences = [
    {
      id: 'weekly',
      kind: 'DESPESA',
      cents: 100,
      categoryId: 'food',
      description: 'Semana',
      frequency: 'weekly',
      anchorDate: '2024-02-20',
      nextDate: '2024-02-27',
      active: true,
    },
    {
      id: 'monthly',
      kind: 'RECEITA',
      cents: 200,
      categoryId: null,
      description: 'Mês',
      frequency: 'monthly',
      anchorDate: '2024-01-31',
      nextDate: '2024-02-29',
      active: true,
    },
    {
      id: 'stopped',
      kind: 'RECEITA',
      cents: 300,
      categoryId: null,
      description: '',
      frequency: 'weekly',
      anchorDate: '2024-02-20',
      nextDate: '2024-02-27',
      active: false,
    },
  ];
  const before = JSON.stringify(data);
  assert.deepEqual(
    finance.upcomingOccurrences(data, '2024-02-25').map((e) => e.date),
    ['2024-02-27', '2024-02-29'],
  );
  assert.deepEqual(
    finance.upcomingOccurrences(data, '2024-02-27').map((e) => e.date),
    ['2024-02-29', '2024-03-05'],
  );
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(finance.totals(data.entries), { income: 0, expense: 0, balance: 0 });
});

test('monthly comparison handles the year boundary and empty months without scoring', () => {
  const data = finance.initialLedger();
  data.entries = [
    expense({ id: 'dec', date: '2025-12-20', cents: 200 }),
    expense({ id: 'jan', date: '2026-01-20', cents: 100 }),
    expense({ id: 'income', kind: 'RECEITA', categoryId: null, date: '2026-01-10', cents: 500 }),
  ];
  assert.deepEqual(finance.monthlyComparison(data, '2026-01'), { income: 500, expense: -100 });
  assert.deepEqual(finance.monthlyComparison(data, '2026-02'), { income: -500, expense: -100 });
});

test('backup interval is three calendar months including short months and leap years', () => {
  assert.equal(finance.backupDue(0), true);
  const last = new Date('2024-01-31T12:00:00').getTime();
  assert.equal(finance.backupDue(last, new Date('2024-04-30T11:59:59')), false);
  assert.equal(finance.backupDue(last, new Date('2024-04-30T12:00:00')), true);
  const november = new Date('2023-11-30T12:00:00').getTime();
  assert.equal(finance.backupDue(november, new Date('2024-02-29T12:00:00')), true);
});
