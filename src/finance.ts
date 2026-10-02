export type Kind = 'RECEITA' | 'DESPESA';
export type Category = { id: string; name: string; color: number; icon: string; archived: boolean };
export type Entry = {
  id: string;
  kind: Kind;
  cents: number;
  date: string;
  categoryId: string | null;
  description: string;
};
export type Ledger = { version: 1; categories: Category[]; entries: Entry[] };
export const icons = ['🍴', '🚗', '🏠', '🎬', '●', '💼', '🛒', '❤'];
export const colors = [
  0xffed8857, 0xfff1c761, 0xff53aaa5, 0xff9365b5, 0xff6288b0, 0xffd96175, 0xff537568,
];
export const MAX_BYTES = 10 * 1024 * 1024;
export const initialLedger = (): Ledger => ({
  version: 1,
  entries: [],
  categories: [
    { id: 'food', name: 'Alimentação', color: colors[0], icon: '🍴', archived: false },
    { id: 'transport', name: 'Transporte', color: colors[1], icon: '🚗', archived: false },
    { id: 'bills', name: 'Contas', color: colors[2], icon: '🏠', archived: false },
    { id: 'fun', name: 'Lazer', color: colors[3], icon: '🎬', archived: false },
    { id: 'other', name: 'Outros', color: colors[4], icon: '●', archived: false },
  ],
});
export const id = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const initialEntryDate = (month: string) => {
  const current = today();
  if (current.slice(0, 7) === month) return current;
  const [year, number] = month.split('-').map(Number);
  const last = new Date(0);
  last.setFullYear(year, number, 0);
  return `${month}-${String(Math.min(Number(current.slice(8)), last.getDate())).padStart(2, '0')}`;
};
export const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(0);
  d.setFullYear(y, m - 1 + delta, 1);
  return `${String(d.getFullYear()).padStart(4, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
export const monthName = (month: string) =>
  civilDate(`${month}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
export const civilDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  const result = new Date(0);
  result.setFullYear(y, m - 1, d);
  result.setHours(12, 0, 0, 0);
  return result;
};
export const dateLabel = (value: string) =>
  civilDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
export const money = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const searchText = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
export const categoryColor = (color: number) =>
  `#${(color >>> 0).toString(16).padStart(8, '0').slice(2)}`;
export function parseCents(value: string) {
  const cleaned = value.trim();
  if (!/^\d+([,.]\d{1,2})?$/.test(cleaned)) throw new Error('Use um valor como 125,50.');
  const [whole, fraction = ''] = cleaned.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > 100_000_000_000)
    throw new Error('Valor fora do limite.');
  return cents;
}
function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
export function decode(text: string): Ledger {
  requireValue(new TextEncoder().encode(text).length <= MAX_BYTES, 'Arquivo maior que 10 MB.');
  const value: unknown = JSON.parse(text);
  requireValue(
    record(value) &&
      value.version === 1 &&
      Array.isArray(value.categories) &&
      Array.isArray(value.entries),
    'Formato de backup não suportado.',
  );
  requireValue(
    Object.keys(value).every((k) => ['version', 'categories', 'entries'].includes(k)),
    'Campos de backup desconhecidos.',
  );
  const categoryIds = new Set<string>();
  const categories: Category[] = value.categories.map((c: unknown) => {
    requireValue(
      record(c) &&
        nonempty(c.id) &&
        nonempty(c.name) &&
        c.name.length <= 60 &&
        typeof c.color === 'number' &&
        Number.isInteger(c.color) &&
        c.color >= 0 &&
        c.color <= 0xffffffff &&
        typeof c.icon === 'string' &&
        icons.includes(c.icon) &&
        (c.archived === undefined || typeof c.archived === 'boolean'),
      'Categoria inválida.',
    );
    requireValue(
      !categoryIds.has(c.id) &&
        Object.keys(c).every((k) => ['id', 'name', 'color', 'icon', 'archived'].includes(k)),
      'Categoria duplicada ou inválida.',
    );
    categoryIds.add(c.id);
    return { id: c.id, name: c.name, color: c.color, icon: c.icon, archived: c.archived === true };
  });
  const entryIds = new Set<string>();
  let sum = 0;
  const entries: Entry[] = value.entries.map((e: unknown) => {
    requireValue(
      record(e) &&
        nonempty(e.id) &&
        (e.kind === 'RECEITA' || e.kind === 'DESPESA') &&
        typeof e.cents === 'number' &&
        Number.isSafeInteger(e.cents) &&
        e.cents >= 1 &&
        e.cents <= 100_000_000_000 &&
        typeof e.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
        (e.description === undefined ||
          (typeof e.description === 'string' && e.description.length <= 300)),
      'Lançamento inválido.',
    );
    const d = civilDate(e.date);
    const [y, m, day] = e.date.split('-').map(Number);
    requireValue(
      d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day,
      'Data inválida.',
    );
    requireValue(
      e.categoryId === undefined ||
        e.categoryId === null ||
        (typeof e.categoryId === 'string' && categoryIds.has(e.categoryId)),
      'Categoria inexistente.',
    );
    requireValue(
      e.kind !== 'DESPESA' || typeof e.categoryId === 'string',
      'Despesa sem categoria.',
    );
    requireValue(
      !entryIds.has(e.id) &&
        Object.keys(e).every((k) =>
          ['id', 'kind', 'cents', 'date', 'categoryId', 'description'].includes(k),
        ),
      'Lançamento duplicado ou inválido.',
    );
    entryIds.add(e.id);
    sum += e.cents;
    requireValue(Number.isSafeInteger(sum), 'Total acima do limite seguro.');
    return {
      id: e.id,
      kind: e.kind,
      cents: e.cents,
      date: e.date,
      categoryId: typeof e.categoryId === 'string' ? e.categoryId : null,
      description: typeof e.description === 'string' ? e.description : '',
    };
  });
  return { version: 1, categories, entries };
}
export const encode = (ledger: Ledger) => {
  const text = JSON.stringify(ledger);
  decode(text);
  return text;
};
export const monthEntries = (ledger: Ledger, month: string) =>
  ledger.entries.filter((e) => e.date.slice(0, 7) === month);
export function totals(entries: Entry[]) {
  let income = 0,
    expense = 0;
  entries.forEach((e) => {
    if (e.kind === 'RECEITA') income += e.cents;
    else expense += e.cents;
  });
  return { income, expense, balance: income - expense };
}
export function groups(ledger: Ledger, month: string) {
  const values = new Map<string, number>();
  monthEntries(ledger, month)
    .filter((e) => e.kind === 'DESPESA')
    .forEach((e) => values.set(e.categoryId!, (values.get(e.categoryId!) ?? 0) + e.cents));
  const total = [...values.values()].reduce((a, b) => a + b, 0);
  let accumulated = 0;
  return [...values]
    .map(([key, cents]) => ({ category: ledger.categories.find((c) => c.id === key)!, cents }))
    .sort((a, b) => b.cents - a.cents || a.category.name.localeCompare(b.category.name))
    .map((g) => {
      accumulated += g.cents;
      return { ...g, percentage: (g.cents * 100) / total, cumulative: (accumulated * 100) / total };
    });
}
