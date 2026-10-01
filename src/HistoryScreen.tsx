import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { dateLabel, Entry, Kind, Ledger, monthEntries, totals } from './finance';
import { useAppearance } from './Appearance';
import { Button, CategoryIcon, Chip, Empty, Field } from './ui';

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
  const rows = useMemo(
    () =>
      monthly
        .filter(
          (e) =>
            (!kind || e.kind === kind) &&
            (!category || e.categoryId === category) &&
            e.description
              .toLocaleLowerCase('pt-BR')
              .includes(search.trim().toLocaleLowerCase('pt-BR')),
        )
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [monthly, kind, category, search],
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
          Saldo {filterCount ? 'filtrado' : 'do mês'}: {money(totals(rows).balance)}
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
            <Field
              label="Buscar lançamentos"
              value={search}
              onChangeText={onSearch}
              placeholder="Buscar pela descrição"
              returnKeyType="search"
            />
            <View style={{ gap: 8 }}>
              <Button
                secondary
                title={`${expanded ? 'Recolher filtros' : 'Filtrar lançamentos'}${filterCount ? ` (${filterCount})` : ''}`}
                onPress={() => setExpanded((v) => !v)}
              />
              {!!filterCount && (
                <Button secondary title="Limpar filtros e busca" onPress={onClear} />
              )}
            </View>
            {expanded && (
              <>
                <View style={s.wrap}>
                  <Chip selected={!kind} onPress={() => onKind(null)}>
                    Todos
                  </Chip>
                  <Chip selected={kind === 'RECEITA'} onPress={() => onKind('RECEITA')}>
                    Receitas
                  </Chip>
                  <Chip selected={kind === 'DESPESA'} onPress={() => onKind('DESPESA')}>
                    Despesas
                  </Chip>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                >
                  <Chip selected={!category} onPress={() => onCategory(null)}>
                    Todas as categorias
                  </Chip>
                  {categories.map((c) => (
                    <Chip key={c.id} selected={category === c.id} onPress={() => onCategory(c.id)}>
                      {c.name}
                      {c.archived ? ' (arquivada)' : ''}
                    </Chip>
                  ))}
                </ScrollView>
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
        renderItem={({ item: e }) => {
          const category = ledger.categories.find((c) => c.id === e.categoryId);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar ${e.description || category?.name || 'Receita'}, ${e.kind === 'RECEITA' ? 'receita' : 'despesa'}, ${money(e.cents)}`}
              onPress={() => onEdit(e)}
              style={({ pressed }) => [
                s.card,
                s.row,
                { marginBottom: 10, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {category ? (
                <CategoryIcon category={category} />
              ) : (
                <Ionicons name="trending-up" size={30} color={palette.income} />
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[s.text, { fontWeight: '600' }]}>
                  {e.description || category?.name || 'Receita'}
                </Text>
                <Text style={s.muted}>
                  {category?.name || 'Receita'}
                  {category?.archived ? ' · arquivada' : ''}
                </Text>
                <Text
                  style={[
                    s.text,
                    {
                      color: e.kind === 'RECEITA' ? palette.income : palette.expense,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {e.kind === 'RECEITA' ? '+' : '−'} {money(e.cents)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" color={palette.muted} size={20} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
