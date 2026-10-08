import { useAppearance } from './Appearance';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  automaticCategoryColorKey,
  categoryPalette,
  categoryColor,
  CategoryColorKey,
  Category,
  categoryUsed,
  icons,
  id,
  Kind,
  Ledger,
  saveCategory,
  searchText,
} from './finance';
import { Button, CategoryIcon, Chip, Field, IconButton, SegmentedControl } from './ui';
import { errorMessage } from './useLedger';
import { categoryIconOptions, isCategoryEmoji } from './categoryIcons';

export function CategoryScreen({
  ledger,
  mutate,
  onClose,
  initialKind = 'DESPESA',
  initialCategory,
  createOnly = false,
  onCreated,
}: {
  ledger: Ledger;
  mutate: (change: (l: Ledger) => Ledger) => Promise<void>;
  onClose: () => void;
  initialKind?: Kind;
  initialCategory?: Category;
  createOnly?: boolean;
  onCreated?: (category: Category) => void;
}) {
  const { palette, s, dark } = useAppearance();
  const [editing, setEditing] = useState<Category | null | undefined>(
    initialCategory ?? (createOnly ? null : undefined),
  );
  const [name, setName] = useState(initialCategory?.name ?? '');
  const [kind, setKind] = useState<Kind>(initialCategory?.kind ?? initialKind);
  const [listKind, setListKind] = useState<Kind>(initialKind);
  const draftId = useRef(initialCategory?.id ?? id());
  const [customColorKey, setCustomColorKey] = useState<CategoryColorKey>();
  const [showColors, setShowColors] = useState(false);
  const colorKey =
    customColorKey ??
    editing?.colorKey ??
    automaticCategoryColorKey(ledger.categories, draftId.current);
  const color = Number(`0xff${categoryColor({ color: 0, colorKey }).slice(1)}`);
  const used = !!editing && categoryUsed(ledger, editing.id);
  const [icon, setIcon] = useState(initialCategory?.icon ?? icons[0]);
  const [emoji, setEmoji] = useState(
    initialCategory?.icon.startsWith('emoji:') ? initialCategory.icon.slice(6) : '',
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const changed =
    name !== (editing?.name ?? '') ||
    (!!editing && kind !== editing.kind) ||
    (!!customColorKey && customColorKey !== editing?.colorKey) ||
    icon !== (editing?.icon ?? icons[0]) ||
    emoji !== (editing?.icon.startsWith('emoji:') ? editing.icon.slice(6) : '');
  const counts = new Map<string, number>();
  for (const entry of ledger.entries)
    if (entry.categoryId) counts.set(entry.categoryId, (counts.get(entry.categoryId) ?? 0) + 1);
  const matching = ledger.categories
    .filter((c) => c.kind === listKind && searchText(c.name).includes(searchText(search)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const visibleCategories = matching
    .filter((c) => !c.archived || showArchived || !!search.trim())
    .sort((a, b) => Number(a.archived) - Number(b.archived));
  function edit(c: Category | null) {
    draftId.current = c?.id ?? id();
    setCustomColorKey(undefined);
    setShowColors(false);
    setNameError('');
    setEditing(c);
    setName(c?.name ?? '');
    setKind(c?.kind ?? listKind);
    setIcon(c?.icon ?? icons[0]);
    setEmoji(c?.icon.startsWith('emoji:') ? c.icon.slice(6) : '');
    setError('');
  }
  async function save() {
    if (busyRef.current) return;
    if (!name.trim()) {
      setNameError('Informe o nome da categoria.');
      return;
    }
    try {
      if (!name.trim()) throw new Error('Informe o nome da categoria.');
      if (icon.startsWith('emoji:') && !isCategoryEmoji(emoji.trim()))
        throw new Error('Escolha um único emoji para a categoria.');
      setBusy(true);
      busyRef.current = true;
      const category = {
        id: editing?.id ?? draftId.current,
        kind,
        name: name.trim(),
        color,
        colorKey,
        icon: icon.startsWith('emoji:') ? `emoji:${emoji.trim()}` : icon,
        archived: editing?.archived ?? false,
      };
      await mutate((l) => saveCategory(l, category));
      onCreated?.(category);
      if (createOnly) onClose();
      else setEditing(undefined);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function run(change: (l: Ledger) => Ledger) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await mutate(change);
      return true;
    } catch (e) {
      Alert.alert('Alteração não salva', errorMessage(e));
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function remove(c: Category) {
    const used = categoryUsed(ledger, c.id);
    Alert.alert(
      used ? 'Arquivar categoria?' : 'Excluir categoria?',
      (used
        ? 'O histórico e as recorrências existentes serão preservados.'
        : 'Esta categoria não possui lançamentos.') +
        (changed ? ' As alterações ainda não salvas serão descartadas.' : ''),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: used ? 'Arquivar' : 'Excluir',
          style: used ? 'default' : 'destructive',
          onPress: async () => {
            const saved = await run((l) => ({
              ...l,
              categories: categoryUsed(l, c.id)
                ? l.categories.map((v) => (v.id === c.id ? { ...v, archived: true } : v))
                : l.categories.filter((v) => v.id !== c.id),
            }));
            if (saved) setEditing(undefined);
          },
        },
      ],
    );
  }
  function reactivate(category: Category) {
    const activate = async () => {
      const saved = await run((previous) => ({
        ...previous,
        categories: previous.categories.map((value) =>
          value.id === category.id ? { ...value, archived: false } : value,
        ),
      }));
      if (saved) setEditing(undefined);
    };
    if (changed)
      Alert.alert('Reativar categoria?', 'As alterações ainda não salvas serão descartadas.', [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Reativar', onPress: () => void activate() },
      ]);
    else void activate();
  }
  const finishEditing = () => {
    if (createOnly) onClose();
    else setEditing(undefined);
  };
  const close = () => {
    if (busy) return;
    if (editing !== undefined) {
      if (changed)
        Alert.alert('Descartar alterações?', 'As alterações da categoria ainda não foram salvas.', [
          { text: 'Continuar editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: finishEditing },
        ]);
      else finishEditing();
    } else onClose();
  };
  return (
    <Modal visible animationType="slide" onRequestClose={close}>
      <SafeAreaView style={s.page}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          <View style={[s.row, { padding: 12 }]}>
            <IconButton
              icon={editing === undefined ? 'close' : 'arrow-back'}
              label="Voltar"
              disabled={busy}
              onPress={close}
            />
            <Text accessibilityRole="header" style={[s.title, { flex: 1 }]}>
              {editing === undefined
                ? 'Categorias'
                : editing
                  ? 'Editar categoria'
                  : 'Nova categoria'}
            </Text>
          </View>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            {editing === undefined ? (
              <>
                <SegmentedControl
                  label="Tipo de categoria"
                  value={listKind}
                  onChange={setListKind}
                  options={[
                    { value: 'DESPESA', label: 'Despesas' },
                    { value: 'RECEITA', label: 'Receitas' },
                  ]}
                />
                <Button title="Criar categoria" onPress={() => edit(null)} disabled={busy} />
                <Field
                  label="Buscar categoria"
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Nome da categoria"
                />
                <Text accessibilityRole="header" style={s.heading}>
                  Ativas ({matching.filter((c) => !c.archived).length})
                </Text>
                {!matching.some((c) => !c.archived) && (
                  <Text style={s.muted}>
                    {search
                      ? 'Nenhuma categoria ativa encontrada.'
                      : 'Crie uma categoria para organizar seus lançamentos.'}
                  </Text>
                )}
                {matching.some((c) => c.archived) && (
                  <Chip selected={showArchived} onPress={() => setShowArchived((v) => !v)}>
                    {showArchived ? 'Recolher arquivadas' : 'Ver arquivadas'} (
                    {matching.filter((c) => c.archived).length})
                  </Chip>
                )}
                {visibleCategories.map((c, index) => (
                  <React.Fragment key={c.id}>
                    {c.archived && !visibleCategories[index - 1]?.archived && (
                      <Text accessibilityRole="header" style={s.heading}>
                        Arquivadas
                      </Text>
                    )}
                    <View style={s.card}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Editar ${c.name}`}
                        onPress={() => edit(c)}
                        disabled={busy}
                        style={({ pressed }) => [
                          s.row,
                          {
                            minHeight: 48,
                            borderRadius: 8,
                            backgroundColor: pressed ? palette.selected : 'transparent',
                          },
                        ]}
                      >
                        <CategoryIcon category={c} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.heading}>{c.name}</Text>
                          <Text style={s.muted}>
                            {counts.get(c.id) ?? 0}{' '}
                            {(counts.get(c.id) ?? 0) === 1 ? 'lançamento' : 'lançamentos'}
                          </Text>
                        </View>
                        <Text style={{ color: palette.accent }}>Editar</Text>
                      </Pressable>
                    </View>
                  </React.Fragment>
                ))}
              </>
            ) : (
              <>
                <Text style={s.label}>Tipo da categoria</Text>
                <SegmentedControl
                  label="Tipo da categoria"
                  value={kind}
                  onChange={setKind}
                  disabled={busy || used}
                  options={[
                    { value: 'DESPESA', label: 'Despesa' },
                    { value: 'RECEITA', label: 'Receita' },
                  ]}
                />
                {used && (
                  <Text style={s.muted}>
                    O tipo não pode mudar porque esta categoria tem lançamentos ou recorrências
                    vinculadas.
                  </Text>
                )}
                <Field
                  label="Nome"
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    setNameError('');
                  }}
                  error={nameError}
                  maxLength={60}
                  placeholder="Nome da categoria"
                  editable={!busy}
                />
                <Field
                  label="Usar emoji"
                  emoji
                  helper="Cole um emoji ou escolha no teclado, como 🐶, 🍕 ou ✈️."
                  placeholder="Seu emoji"
                  value={emoji}
                  editable={!busy}
                  maxLength={32}
                  autoCorrect={false}
                  onChangeText={(value) => {
                    setEmoji(value);
                    setIcon(value ? `emoji:${value.trim()}` : icons[0]);
                    setError('');
                  }}
                  error={
                    emoji && !isCategoryEmoji(emoji.trim()) ? 'Informe um único emoji.' : undefined
                  }
                />
                <Button
                  secondary
                  title={showColors ? 'Fechar cores' : 'Personalizar cor (opcional)'}
                  expanded={showColors}
                  onPress={() => setShowColors((value) => !value)}
                  disabled={busy}
                />
                {showColors && (
                  <View style={s.wrap}>
                    {categoryPalette.map((family) => (
                      <Chip
                        key={family.key}
                        label={`Cor ${family.name}`}
                        selected={colorKey === family.key}
                        disabled={busy}
                        onPress={() => setCustomColorKey(family.key)}
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: dark ? family.dark : family.light,
                          }}
                        />
                        {family.name}
                      </Chip>
                    ))}
                  </View>
                )}
                <Text style={s.label}>Ícones prontos</Text>
                <View style={s.wrap}>
                  {categoryIconOptions.map(({ value: v, label }) => (
                    <Chip
                      key={v}
                      label={`Ícone ${label}`}
                      disabled={busy}
                      selected={icon === v}
                      onPress={() => {
                        setIcon(v);
                        setEmoji('');
                        setError('');
                      }}
                    >
                      <CategoryIcon category={{ icon: v, color, colorKey }} />
                    </Chip>
                  ))}
                </View>
                {!!error && (
                  <Text accessibilityRole="alert" style={{ color: palette.expense }}>
                    {error}
                  </Text>
                )}

                {editing && (
                  <>
                    {editing.archived ? (
                      <Button
                        secondary
                        title="Reativar categoria"
                        disabled={busy}
                        onPress={() => reactivate(editing)}
                      />
                    ) : (
                      <Button
                        danger
                        title={
                          categoryUsed(ledger, editing.id)
                            ? 'Arquivar categoria'
                            : 'Excluir categoria'
                        }
                        disabled={busy}
                        onPress={() => remove(editing)}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>
          {editing !== undefined && (
            <View
              style={{
                padding: 16,
                borderTopWidth: 1,
                borderColor: palette.border,
                backgroundColor: palette.card,
              }}
            >
              <Button
                title={busy ? 'Salvando…' : 'Salvar categoria'}
                onPress={() => void save()}
                disabled={busy}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
