import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { historyDateLabel, LedgerRow } from './LedgerRow';
import { Entry, Kind, Ledger, monthEntries, searchText } from './finance';
import { useAppearance } from './Appearance';
import { Chip, Empty, Field, IconButton } from './ui';

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
  onAdd,
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
  onAdd?: () => void;
}) {
  const { palette, s } = useAppearance();
  const [picker, setPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const monthly = useMemo(() => monthEntries(ledger, month), [ledger, month]);
  const categoryById = useMemo(
    () => new Map(ledger.categories.map((c) => [c.id, c])),
    [ledger.categories],
  );
  const rows = useMemo(
    () =>
      monthly
        .filter(
          (entry) =>
            (!kind || entry.kind === kind) &&
            (category === null ||
              (category === '' ? entry.categoryId === null : entry.categoryId === category)) &&
            searchText(
              `${entry.description} ${categoryById.get(entry.categoryId ?? '')?.name ?? 'Sem categoria'} ${entry.kind === 'RECEITA' ? 'Receita' : 'Despesa'} ${entry.date}`,
            ).includes(searchText(search)),
        )
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [monthly, kind, category, search, categoryById],
  );
  const sections = useMemo(() => {
    const byDate = new Map<string, Entry[]>();
    for (const entry of rows) {
      const list = byDate.get(entry.date) ?? [];
      list.push(entry);
      byDate.set(entry.date, list);
    }
    return [...byDate].map(([date, data]) => ({ key: date, date, data }));
  }, [rows]);
  const categories = ledger.categories.filter(
    (c) =>
      (!kind || c.kind === kind) &&
      (!c.archived || monthly.some((entry) => entry.categoryId === c.id)) &&
      searchText(c.name).includes(searchText(categorySearch)),
  );
  const filtered = !!kind || category !== null || !!search.trim();
  const categoryName = category === '' ? 'Sem categoria' : categoryById.get(category ?? '')?.name;
  const selectCategory = (value: string | null) => {
    onCategory(value);
    setPicker(false);
    setCategorySearch('');
  };
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 8 }}>
        <View>
          <Field
            hideLabel
            label="Buscar lançamentos"
            value={search}
            onChangeText={onSearch}
            placeholder="Buscar lançamento"
            returnKeyType="search"
            autoCorrect={false}
            style={{ paddingLeft: 48 }}
          />
          <View pointerEvents="none" style={{ position: 'absolute', left: 16, top: 16 }}>
            <Ionicons name="search-outline" size={18} color={palette.muted} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(
            [
              { value: null, label: 'Todos' },
              { value: 'RECEITA', label: 'Receitas' },
              { value: 'DESPESA', label: 'Despesas' },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: kind === option.value }}
              onPress={() => onKind(option.value)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 48,
                minWidth: 0,
                paddingHorizontal: 4,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor:
                  kind === option.value
                    ? palette.accent
                    : pressed
                      ? palette.selected
                      : palette.soft,
                opacity: 1,
              })}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{
                  color: kind === option.value ? palette.onAccent : palette.navy,
                  fontSize: 14,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar por categoria"
            accessibilityState={{ expanded: picker, selected: category !== null }}
            onPress={() => setPicker(true)}
            style={({ pressed }) => ({
              flex: 1.4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingHorizontal: 4,
              minHeight: 48,
              minWidth: 0,
              borderRadius: 8,
              backgroundColor:
                category !== null ? palette.accent : pressed ? palette.selected : palette.soft,
              opacity: 1,
            })}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: category !== null ? palette.onAccent : palette.navy,
                fontSize: 14,
                flexShrink: 1,
              }}
            >
              {categoryName ?? 'Categoria'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={category !== null ? palette.onAccent : palette.muted}
            />
          </Pressable>
        </View>
        {filtered && (
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Text accessibilityLiveRegion="polite" style={[s.muted, { flex: 1 }]}>
              {rows.length} resultado{rows.length === 1 ? '' : 's'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar filtros"
              onPress={onClear}
              style={{ minWidth: 48, minHeight: 48, justifyContent: 'center' }}
            >
              <Text style={{ color: palette.accent, fontSize: 14 }}>Limpar filtros</Text>
            </Pressable>
          </View>
        )}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 96,
          backgroundColor: palette.background,
          flexGrow: 1,
        }}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        ItemSeparatorComponent={() => (
          <View style={[s.divider, { marginLeft: 44, opacity: 0.35 }]} />
        )}
        ListEmptyComponent={
          <Empty
            title={filtered ? 'Nenhuma movimentação encontrada' : 'Nenhum lançamento neste mês'}
            text={
              filtered
                ? 'Tente outra busca ou limpe os filtros.'
                : 'Registre uma receita ou despesa para começar.'
            }
            actionLabel={filtered ? 'Limpar filtros' : 'Adicionar lançamento'}
            onAction={filtered ? onClear : onAdd}
          />
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              backgroundColor: palette.background,
              paddingTop: section.key === sections[0]?.key ? 16 : 24,
              paddingBottom: 8,
            }}
          >
            <Text accessibilityRole="header" style={[s.text, { fontWeight: '700' }]}>
              {historyDateLabel(section.date)}
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
      <Modal
        visible={picker}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}>
          <SafeAreaView
            style={{
              backgroundColor: palette.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 16,
              maxHeight: '80%',
            }}
          >
            <View style={s.row}>
              <Text style={[s.heading, { flex: 1 }]}>Filtrar por categoria</Text>
              <IconButton
                icon="close"
                label="Fechar filtro de categoria"
                onPress={() => setPicker(false)}
              />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16 }}>
              <Field
                label="Buscar categoria"
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder="Nome da categoria"
              />
              <View style={s.wrap}>
                <Chip selected={category === null} onPress={() => selectCategory(null)}>
                  Todas as categorias
                </Chip>
                {kind !== 'DESPESA' && (
                  <Chip selected={category === ''} onPress={() => selectCategory('')}>
                    Sem categoria
                  </Chip>
                )}
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    selected={category === c.id}
                    onPress={() => selectCategory(c.id)}
                  >
                    {c.name}
                    {c.archived ? ' (arquivada)' : ''}
                  </Chip>
                ))}
              </View>
              {!categories.length && <Text style={s.muted}>Nenhuma categoria encontrada.</Text>}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
