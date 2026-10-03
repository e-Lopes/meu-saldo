import { useMemo, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { LedgerRow } from './LedgerRow';
import { dateLabel, Entry, Kind, Ledger, monthEntries, searchText, totals } from './finance';
import { useAppearance } from './Appearance';
import { Button, Chip, Empty, Field, SegmentedControl } from './ui';

export function HistoryScreen({
  ledger,
  month,
  category,
  search,
  kind,
  onCategory,
  onSearch,
  onKind,
  onClear,
  onEdit,
}: {
  ledger: Ledger;
  month: string;
  category: string | null;
  search: string;
  kind: Kind | null;
  onCategory: (id: string | null) => void;
  onSearch: (search: string) => void;
  onKind: (kind: Kind | null) => void;
  onClear: () => void;
  onEdit: (entry: Entry) => void;
}) {
  const { palette, s, money } = useAppearance();
  const [expanded, setExpanded] = useState(false);
  const monthly = useMemo(() => monthEntries(ledger, month), [ledger, month]);
  const categoryById = useMemo(
    () => new Map(ledger.categories.map((c) => [c.id, c])),
    [ledger.categories],
  );
  const rows = useMemo(
    () =>
      monthly
        .filter(
          (e) =>
            (!kind || e.kind === kind) &&
            (!category || e.categoryId === category) &&
            searchText(
              `${e.description} ${categoryById.get(e.categoryId ?? '')?.name ?? (e.kind === 'RECEITA' ? 'Receita' : '')}`,
            ).includes(searchText(search)),
        )
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [monthly, kind, category, search, categoryById],
  );
  const sections = useMemo(() => {
    const byDate = new Map<string, Entry[]>();
    rows.forEach((e) => {
      const list = byDate.get(e.date) ?? [];
      list.push(e);
      byDate.set(e.date, list);
    });
    return [...byDate].map(([date, data]) => ({ date, data }));
  }, [rows]);
  const categories = ledger.categories.filter(
    (c) => !c.archived || monthly.some((e) => e.categoryId === c.id),
  );
  const filterCount = Number(!!kind) + Number(!!category) + Number(!!search.trim());
  const summary = useMemo(() => totals(rows), [rows]);
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: palette.card,
          gap: 4,
        }}
        accessibilityLiveRegion="polite"
      >
        <Text style={s.muted}>
          {rows.length} lançamento{rows.length === 1 ? '' : 's'}
          {filterCount ? ' encontrados' : ' no mês'}
        </Text>
        <Text style={[s.text, { fontWeight: '600' }]}>
          Saldo {filterCount ? 'filtrado' : 'do mês'}: {money(summary.balance)}
        </Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        ListHeaderComponent={
          <View style={{ gap: 12, paddingVertical: 16 }}>
            <View style={s.wrap}>
              <Text style={s.muted}>Receitas: {money(summary.income)}</Text>
              <Text style={s.muted}>Despesas: {money(summary.expense)}</Text>
            </View>
            <Field
              label="Buscar lançamentos"
              value={search}
              onChangeText={onSearch}
              placeholder="Descrição ou categoria"
              returnKeyType="search"
            />
            <View style={{ gap: 8 }}>
              <Button
                secondary
                expanded={expanded}
                title={`${expanded ? 'Fechar filtros' : 'Filtros'}${filterCount ? ` (${filterCount})` : ''}`}
                onPress={() => setExpanded((v) => !v)}
              />
              {!!filterCount && <Button secondary title="Limpar filtros" onPress={onClear} />}
            </View>
            {expanded && (
              <>
                <SegmentedControl
                  label="Tipo de lançamento"
                  value={kind ?? 'all'}
                  onChange={(value) => onKind(value === 'all' ? null : value)}
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'RECEITA', label: 'Receitas' },
                    { value: 'DESPESA', label: 'Despesas' },
                  ]}
                />
                <View style={[s.wrap, { gap: 8 }]}>
                  <Chip selected={!category} onPress={() => onCategory(null)}>
                    Todas as categorias
                  </Chip>
                  {categories.map((c) => (
                    <Chip key={c.id} selected={category === c.id} onPress={() => onCategory(c.id)}>
                      {c.name}
                      {c.archived ? ' (arquivada)' : ''}
                    </Chip>
                  ))}
                </View>
              </>
            )}
            {!expanded && (kind || category) && (
              <Text style={s.muted}>
                {kind === 'RECEITA'
                  ? 'Receitas'
                  : kind === 'DESPESA'
                    ? 'Despesas'
                    : 'Todos os tipos'}
                {category
                  ? ` · ${ledger.categories.find((c) => c.id === category)?.name ?? 'Categoria'}`
                  : ''}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <Empty
            title="Nenhum lançamento encontrado"
            text={
              filterCount
                ? 'Limpe os filtros ou tente outra descrição.'
                : 'Adicione um lançamento no botão +.'
            }
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: palette.background, paddingVertical: 12 }}>
            <Text accessibilityRole="header" style={s.heading}>
              {dateLabel(section.date)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <LedgerRow
            entry={item}
            category={categoryById.get(item.categoryId ?? '')}
            onEdit={onEdit}
          />
        )}
      />
    </View>
  );
}
