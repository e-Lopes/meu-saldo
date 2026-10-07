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
    { ...ledger(), version: 2 },
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
