import { categoryIconOptions, isCategoryIcon } from './categoryIcons';

export type Kind = 'RECEITA' | 'DESPESA';
export type Category = {
  id: string;
  kind: Kind;
  name: string;
  color: number;
  colorKey?: CategoryColorKey;
  icon: string;
  archived: boolean;
};
export type Entry = {
  id: string;
  kind: Kind;
  cents: number;
  date: string;
  categoryId: string | null;
  description: string;
  recurrenceId?: string;
  occurrenceDate?: string;
};
export type Frequency = 'monthly' | 'weekly';
export type Recurrence = {
  id: string;
  kind: Kind;
  cents: number;
  categoryId: string | null;
  description: string;
  frequency: Frequency;
  anchorDate: string;
  nextDate: string;
  active: boolean;
};
export type Ledger = {
  version: 2;
  categories: Category[];
  entries: Entry[];
  recurrences: Recurrence[];
};
export const icons = categoryIconOptions.map((option) => option.value);
export const categoryPalette = [
  { key: 'blue', name: 'Azul', light: '#2563EB', dark: '#7FAAFF' },
  { key: 'purple', name: 'Roxo', light: '#7C3AED', dark: '#B99AFF' },
  { key: 'indigo', name: 'Índigo', light: '#4F46E5', dark: '#A3A5FF' },
  { key: 'violet', name: 'Violeta', light: '#9333EA', dark: '#C797FF' },
  { key: 'cyan', name: 'Ciano', light: '#0891B2', dark: '#69D4EA' },
  { key: 'pink', name: 'Rosa', light: '#DB2777', dark: '#F79FC8' },
  { key: 'teal', name: 'Turquesa', light: '#0D9488', dark: '#65D6C8' },
  { key: 'coral', name: 'Coral', light: '#E05252', dark: '#FFA3A3' },
  { key: 'green', name: 'Verde', light: '#16A34A', dark: '#7DDB9D' },
  { key: 'orange', name: 'Laranja', light: '#EA580C', dark: '#FFB07B' },
  { key: 'olive', name: 'Oliva', light: '#65851B', dark: '#BAD579' },
  { key: 'amber', name: 'Âmbar', light: '#B7791F', dark: '#F0CA70' },
] as const;
export type CategoryColorKey = (typeof categoryPalette)[number]['key'];
export const colors = categoryPalette.map((color) => Number(`0xff${color.light.slice(1)}`));
export const MAX_BYTES = 10 * 1024 * 1024;
export const initialLedger = (): Ledger => ({
  version: 2,
  entries: [],
  recurrences: [],
  categories: [
    {
      id: 'food',
      kind: 'DESPESA',
      name: 'Alimentação',
      color: colors[0],
      icon: '🍴',
      archived: false,
    },
    {
      id: 'transport',
      kind: 'DESPESA',
      name: 'Transporte',
      color: colors[1],
      icon: '🚗',
      archived: false,
    },
    { id: 'bills', kind: 'DESPESA', name: 'Contas', color: colors[2], icon: '🏠', archived: false },
    { id: 'fun', kind: 'DESPESA', name: 'Lazer', color: colors[3], icon: '🎬', archived: false },
    { id: 'other', kind: 'DESPESA', name: 'Outros', color: colors[4], icon: '●', archived: false },
  ].map((category, index) => ({
    ...category,
    kind: 'DESPESA' as Kind,
    colorKey: categoryPalette[index].key,
  })),
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
export const categoryColor = (
  category: number | Pick<Category, 'color' | 'colorKey'>,
  dark = false,
) => {
  if (typeof category !== 'number') {
    const family = categoryPalette.find((color) => color.key === category.colorKey);
    if (family) return dark ? family.dark : family.light;
  }
  const color = typeof category === 'number' ? category : category.color;
  return `#${(color >>> 0).toString(16).padStart(8, '0').slice(2)}`;
};
export function formatAmountInput(value: string) {
  const digits = (value.replace(/\D/g, '').replace(/^0+/, '') || '0').padStart(3, '0');
  return `R$ ${digits.slice(0, -2)},${digits.slice(-2)}`;
}
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
export const validDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = civilDate(value);
  return (
    d.getFullYear() === Number(value.slice(0, 4)) &&
    d.getMonth() + 1 === Number(value.slice(5, 7)) &&
    d.getDate() === Number(value.slice(8))
  );
};
const dateString = (date: Date) =>
  `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function nextOccurrence(frequency: Frequency, anchorDate: string, after: string) {
  if (frequency === 'weekly') {
    const date = civilDate(after);
    const delta = (civilDate(anchorDate).getDay() - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + delta);
    return dateString(date);
  }
  let month = after.slice(0, 7);
  const inMonth = (value: string) => {
    const last = civilDate(`${shiftMonth(value, 1)}-01`);
    last.setDate(0);
    return `${value}-${String(Math.min(Number(anchorDate.slice(8)), last.getDate())).padStart(2, '0')}`;
  };
  if (inMonth(month) <= after) month = shiftMonth(month, 1);
  return inMonth(month);
}
function isScheduledDate(frequency: Frequency, anchor: string, date: string) {
  const previous = civilDate(date);
  previous.setDate(previous.getDate() - 1);
  return nextOccurrence(frequency, anchor, dateString(previous)) === date;
}
export function automaticCategoryColorKey(
  categories: Category[],
  categoryId: string,
): CategoryColorKey {
  const counts = categoryPalette.map(
    (color, index) =>
      categories.filter((c) => (c.colorKey ? c.colorKey === color.key : c.color === colors[index]))
        .length,
  );
  const minimum = Math.min(...counts);
  const candidates = categoryPalette.filter((_, index) => counts[index] === minimum);
  let hash = 2166136261;
  for (const char of categoryId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return candidates[hash % candidates.length].key;
}
export function automaticCategoryColor(categories: Category[], categoryId = '') {
  return colors[
    categoryPalette.findIndex(
      (color) => color.key === automaticCategoryColorKey(categories, categoryId),
    )
  ];
}
export const categoryUsed = (ledger: Ledger, categoryId: string) =>
  ledger.entries.some((e) => e.categoryId === categoryId) ||
  ledger.recurrences.some((r) => r.categoryId === categoryId);
export function saveCategory(ledger: Ledger, category: Category): Ledger {
  const existing = ledger.categories.find((c) => c.id === category.id);
  if (existing && existing.kind !== category.kind && categoryUsed(ledger, category.id))
    throw new Error('Categorias com lançamentos ou recorrências não podem mudar de tipo.');
  const colorKey =
    category.colorKey ??
    existing?.colorKey ??
    automaticCategoryColorKey(ledger.categories, category.id);
  const saved = {
    ...category,
    colorKey,
    color: colors[categoryPalette.findIndex((color) => color.key === colorKey)],
  };
  return {
    ...ledger,
    categories: existing
      ? ledger.categories.map((c) => (c.id === saved.id ? saved : c))
      : [...ledger.categories, saved],
  };
}

// The cursor is persisted atomically with occurrences. It also remembers deleted dates.
export function generateOccurrences(ledger: Ledger, through = today()): Ledger {
  if (!validDate(through)) throw new Error('Data de geração inválida.');
  const known = new Set(
    ledger.entries
      .filter((e) => e.recurrenceId)
      .map((e) => `${e.recurrenceId}/${e.occurrenceDate}`),
  );
  const generated: Entry[] = [];
  let changed = false;
  const recurrences = ledger.recurrences.map((rule) => {
    if (!rule.active || rule.nextDate > through) return rule;
    let nextDate = rule.nextDate;
    while (nextDate <= through) {
      const key = `${rule.id}/${nextDate}`;
      if (!known.has(key)) {
        generated.push({
          id: `recurrence:${key}`,
          kind: rule.kind,
          cents: rule.cents,
          date: nextDate,
          categoryId: rule.categoryId,
          description: rule.description,
          recurrenceId: rule.id,
          occurrenceDate: nextDate,
        });
        known.add(key);
      }
      const next = nextOccurrence(rule.frequency, rule.anchorDate, nextDate);
      if (!validDate(next) || next <= nextDate)
        throw new Error('Recorrência fora do limite de datas.');
      nextDate = next;
    }
    changed = true;
    return { ...rule, nextDate };
  });
  return changed ? { ...ledger, entries: [...ledger.entries, ...generated], recurrences } : ledger;
}
export type RecurrenceChange = {
  repeat: boolean;
  frequency: Frequency;
  scope: 'current' | 'future';
};
export function saveEntry(
  ledger: Ledger,
  entry: Entry,
  change: RecurrenceChange,
  through = today(),
): Ledger {
  const existing = ledger.entries.find((e) => e.id === entry.id);
  const rule = ledger.recurrences.find((r) => r.id === existing?.recurrenceId);
  let saved = {
    ...entry,
    ...(existing?.recurrenceId
      ? { recurrenceId: existing.recurrenceId, occurrenceDate: existing.occurrenceDate }
      : {}),
  };
  let recurrences = ledger.recurrences;
  if (rule && !change.repeat) {
    recurrences = recurrences.map((r) => (r.id === rule.id ? { ...r, active: false } : r));
  } else if (change.repeat && !rule) {
    const recurrenceId = id();
    saved = { ...saved, recurrenceId, occurrenceDate: entry.date };
    recurrences = [
      ...recurrences,
      {
        id: recurrenceId,
        kind: entry.kind,
        cents: entry.cents,
        categoryId: entry.categoryId,
        description: entry.description,
        frequency: change.frequency,
        anchorDate: entry.date,
        nextDate: nextOccurrence(change.frequency, entry.date, entry.date),
        active: true,
      },
    ];
  } else if (rule && change.repeat && (!rule.active || change.scope === 'future')) {
    // Preserve the original monthly anchor when editing a February-clamped occurrence.
    const scheduleChanged = entry.date !== existing?.date || change.frequency !== rule.frequency;
    const anchorDate = scheduleChanged ? entry.date : rule.anchorDate;
    const cursor = civilDate(rule.nextDate);
    if (rule.frequency === 'weekly') cursor.setDate(cursor.getDate() - 7);
    else {
      const month = shiftMonth(rule.nextDate.slice(0, 7), -1);
      const last = civilDate(`${shiftMonth(month, 1)}-01`);
      last.setDate(0);
      cursor.setDate(1);
      cursor.setFullYear(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)) - 1,
        Math.min(Number(rule.anchorDate.slice(8)), last.getDate()),
      );
    }
    const after = [dateString(cursor), entry.date].sort().at(-1)!;
    recurrences = recurrences.map((r) =>
      r.id === rule.id
        ? {
            ...r,
            kind: entry.kind,
            cents: entry.cents,
            categoryId: entry.categoryId,
            description: entry.description,
            frequency: change.frequency,
            active: true,
            anchorDate,
            nextDate: nextOccurrence(change.frequency, anchorDate, after),
          }
        : r,
    );
  }
  const entries = existing
    ? ledger.entries.map((e) => (e.id === entry.id ? saved : e))
    : [...ledger.entries, saved];
  return generateOccurrences({ ...ledger, entries, recurrences }, through);
}
export function removeEntry(ledger: Ledger, entryId: string, stopRecurrence = false): Ledger {
  const entry = ledger.entries.find((e) => e.id === entryId);
  return {
    ...ledger,
    entries: ledger.entries.filter((e) => e.id !== entryId),
    recurrences: stopRecurrence
      ? ledger.recurrences.map((r) => (r.id === entry?.recurrenceId ? { ...r, active: false } : r))
      : ledger.recurrences,
  };
}
export function decode(text: string): Ledger {
  requireValue(new TextEncoder().encode(text).length <= MAX_BYTES, 'Arquivo maior que 10 MB.');
  const value: unknown = JSON.parse(text);
  requireValue(
    record(value) &&
      (value.version === 1 || value.version === 2) &&
      Array.isArray(value.categories) &&
      Array.isArray(value.entries) &&
      (value.version === 1 || Array.isArray(value.recurrences)),
    'Formato de backup não suportado.',
  );
  requireValue(
    Object.keys(value).every((k) =>
      (value.version === 1
        ? ['version', 'categories', 'entries']
        : ['version', 'categories', 'entries', 'recurrences']
      ).includes(k),
    ),
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
        (c.colorKey === undefined || categoryPalette.some((color) => color.key === c.colorKey)) &&
        typeof c.icon === 'string' &&
        isCategoryIcon(c.icon) &&
        (value.version === 1 || c.kind === 'RECEITA' || c.kind === 'DESPESA') &&
        (c.archived === undefined || typeof c.archived === 'boolean'),
      'Categoria inválida.',
    );
    requireValue(
      !categoryIds.has(c.id) &&
        Object.keys(c).every((k) =>
          (value.version === 1
            ? ['id', 'name', 'color', 'icon', 'archived']
            : ['id', 'kind', 'name', 'color', 'colorKey', 'icon', 'archived']
          ).includes(k),
        ),
      'Categoria duplicada ou inválida.',
    );
    categoryIds.add(c.id);
    return {
      id: c.id,
      kind: value.version === 1 ? 'DESPESA' : (c.kind as Kind),
      name: c.name,
      color: c.color,
      ...(c.colorKey === undefined ? {} : { colorKey: c.colorKey as CategoryColorKey }),
      icon: c.icon,
      archived: c.archived === true,
    };
  });
  const entryIds = new Set<string>();
  const originalCategoryIds = new Set(categoryIds);
  // v1 allowed a category on an income even though its form never offered it.
  // Keep those valid backup references by creating an income counterpart.
  const legacyIncomeCategories = new Map<string, string>();
  if (value.version === 1) {
    for (const entry of value.entries) {
      if (
        !record(entry) ||
        entry.kind !== 'RECEITA' ||
        typeof entry.categoryId !== 'string' ||
        legacyIncomeCategories.has(entry.categoryId)
      )
        continue;
      const original = categories.find((c) => c.id === entry.categoryId);
      if (!original) continue;
      let key = `${original.id}-income`;
      while (categoryIds.has(key)) key += '-income';
      categoryIds.add(key);
      legacyIncomeCategories.set(original.id, key);
      categories.push({ ...original, id: key, kind: 'RECEITA' });
    }
  }
  // Assign legacy categories once, in ID order, then persist the result on load.
  // Existing keys stay untouched, even when categories are reordered or removed.
  const assigned = categories.filter((category) => category.colorKey);
  for (const category of [...categories]
    .filter((c) => !c.colorKey)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    category.colorKey = automaticCategoryColorKey(assigned, category.id);
    assigned.push(category);
  }
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
        (typeof e.categoryId === 'string' &&
          (value.version === 1 ? originalCategoryIds : categoryIds).has(e.categoryId)),
      'Categoria inexistente.',
    );
    requireValue(
      e.kind !== 'DESPESA' || typeof e.categoryId === 'string',
      'Despesa sem categoria.',
    );
    requireValue(
      value.version === 1 ||
        e.categoryId == null ||
        categories.find((c) => c.id === e.categoryId)?.kind === e.kind,
      'Categoria incompatível com o lançamento.',
    );
    requireValue(
      value.version === 1 ||
        (e.recurrenceId === undefined && e.occurrenceDate === undefined) ||
        (nonempty(e.recurrenceId) && validDate(e.occurrenceDate)),
      'Vínculo de recorrência inválido.',
    );
    requireValue(
      !entryIds.has(e.id) &&
        Object.keys(e).every((k) =>
          (value.version === 1
            ? ['id', 'kind', 'cents', 'date', 'categoryId', 'description']
            : [
                'id',
                'kind',
                'cents',
                'date',
                'categoryId',
                'description',
                'recurrenceId',
                'occurrenceDate',
              ]
          ).includes(k),
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
      categoryId:
        typeof e.categoryId === 'string'
          ? value.version === 1 && e.kind === 'RECEITA'
            ? legacyIncomeCategories.get(e.categoryId)!
            : e.categoryId
          : null,
      description: typeof e.description === 'string' ? e.description : '',
      ...(typeof e.recurrenceId === 'string'
        ? { recurrenceId: e.recurrenceId, occurrenceDate: e.occurrenceDate as string }
        : {}),
    };
  });
  const recurrenceIds = new Set<string>();
  const recurrences: Recurrence[] =
    value.version === 1
      ? []
      : (value.recurrences as unknown[]).map((r) => {
          requireValue(
            record(r) &&
              nonempty(r.id) &&
              (r.kind === 'RECEITA' || r.kind === 'DESPESA') &&
              Number.isSafeInteger(r.cents) &&
              (r.cents as number) >= 1 &&
              (r.cents as number) <= 100_000_000_000 &&
              typeof r.description === 'string' &&
              r.description.length <= 300 &&
              (r.frequency === 'monthly' || r.frequency === 'weekly') &&
              validDate(r.anchorDate) &&
              validDate(r.nextDate) &&
              r.nextDate > r.anchorDate &&
              typeof r.active === 'boolean',
            'Recorrência inválida.',
          );
          requireValue(
            r.categoryId === null
              ? r.kind === 'RECEITA'
              : typeof r.categoryId === 'string' &&
                  categories.some((c) => c.id === r.categoryId && c.kind === r.kind),
            'Categoria da recorrência inválida.',
          );
          requireValue(
            !recurrenceIds.has(r.id) &&
              Object.keys(r).every((k) =>
                [
                  'id',
                  'kind',
                  'cents',
                  'categoryId',
                  'description',
                  'frequency',
                  'anchorDate',
                  'nextDate',
                  'active',
                ].includes(k),
              ),
            'Recorrência duplicada ou inválida.',
          );
          requireValue(
            isScheduledDate(r.frequency, r.anchorDate, r.nextDate),
            'Data de recorrência fora do calendário.',
          );
          recurrenceIds.add(r.id);
          return r as Recurrence;
        });
  const occurrences = new Set<string>();
  for (const entry of entries) {
    if (!entry.recurrenceId) continue;
    const rule = recurrences.find((r) => r.id === entry.recurrenceId);
    const key = `${entry.recurrenceId}/${entry.occurrenceDate}`;
    requireValue(rule && !occurrences.has(key), 'Ocorrência duplicada ou recorrência inexistente.');
    occurrences.add(key);
  }
  return { version: 2, categories, entries, recurrences };
}
export const encode = (ledger: Ledger) => {
  return JSON.stringify(decode(JSON.stringify(ledger)));
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
export function groups(ledger: Ledger, month: string, kind: Kind = 'DESPESA') {
  const values = new Map<string, number>();
  monthEntries(ledger, month)
    .filter((e) => e.kind === kind)
    .forEach((e) =>
      values.set(e.categoryId ?? '', (values.get(e.categoryId ?? '') ?? 0) + e.cents),
    );
  const total = [...values.values()].reduce((a, b) => a + b, 0);
  let accumulated = 0;
  return [...values]
    .map(([key, cents]) => ({
      category: ledger.categories.find((c) => c.id === key) ?? {
        id: '',
        kind,
        name: 'Sem categoria',
        color: colors[4],
        colorKey: 'cyan' as CategoryColorKey,
        icon: icons[0],
        archived: false,
      },
      cents,
    }))
    .sort((a, b) => b.cents - a.cents || a.category.name.localeCompare(b.category.name))
    .map((g) => {
      accumulated += g.cents;
      return { ...g, percentage: (g.cents * 100) / total, cumulative: (accumulated * 100) / total };
    });
}

export function duplicateEntry(entry: Entry, date = today()): Entry {
  return {
    id: id(),
    kind: entry.kind,
    cents: entry.cents,
    categoryId: entry.categoryId,
    description: entry.description,
    date,
  };
}
export function upcomingOccurrences(ledger: Ledger, from = today()) {
  const end = civilDate(from);
  end.setDate(end.getDate() + 7);
  const until = dateString(end);
  const result: Entry[] = [];
  for (const rule of ledger.recurrences.filter((r) => r.active)) {
    let date =
      rule.nextDate > from ? rule.nextDate : nextOccurrence(rule.frequency, rule.anchorDate, from);
    while (date <= until) {
      result.push({
        id: `${rule.id}:${date}`,
        kind: rule.kind,
        cents: rule.cents,
        categoryId: rule.categoryId,
        description: rule.description,
        date,
        recurrenceId: rule.id,
        occurrenceDate: date,
      });
      date = nextOccurrence(rule.frequency, rule.anchorDate, date);
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
export function monthlyComparison(ledger: Ledger, month: string) {
  const current = totals(monthEntries(ledger, month));
  const previous = totals(monthEntries(ledger, shiftMonth(month, -1)));
  return { income: current.income - previous.income, expense: current.expense - previous.expense };
}
export function backupDue(lastBackup: number, now = new Date()) {
  if (!lastBackup) return true;
  const last = new Date(lastBackup);
  const target = new Date(
    last.getFullYear(),
    last.getMonth() + 3,
    1,
    last.getHours(),
    last.getMinutes(),
    last.getSeconds(),
    last.getMilliseconds(),
  );
  const end = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(last.getDate(), end));
  return now.getTime() >= target.getTime();
}
