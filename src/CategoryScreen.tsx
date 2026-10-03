import { useAppearance } from './Appearance';
import React, { useState } from 'react';
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
import { Category, categoryColor, colors, icons, id, Ledger, searchText } from './finance';
import { Button, CategoryIcon, Chip, Field, IconButton } from './ui';
import { MenuRow } from './MenuRow';
import { errorMessage } from './useLedger';
import { categoryIconOptions, isCategoryEmoji } from './categoryIcons';

export function CategoryScreen({
  ledger,
  mutate,
  onClose,
}: {
  ledger: Ledger;
  mutate: (change: (l: Ledger) => Ledger) => Promise<void>;
  onClose: () => void;
}) {
  const { palette, s } = useAppearance();
  const [editing, setEditing] = useState<Category | null | undefined>();
  const [name, setName] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [icon, setIcon] = useState(icons[0]);
  const [emoji, setEmoji] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [options, setOptions] = useState(false);
  const changed =
    name !== (editing?.name ?? '') ||
    color !== (editing?.color ?? colors[0]) ||
    icon !== (editing?.icon ?? icons[0]) ||
    emoji !== (editing?.icon.startsWith('emoji:') ? editing.icon.slice(6) : '');
  const counts = new Map<string, number>();
  for (const entry of ledger.entries)
    if (entry.categoryId) counts.set(entry.categoryId, (counts.get(entry.categoryId) ?? 0) + 1);
  const matching = ledger.categories
    .filter((c) => searchText(c.name).includes(searchText(search)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const visibleCategories = matching
    .filter((c) => !c.archived || showArchived || !!search.trim())
    .sort((a, b) => Number(a.archived) - Number(b.archived));
  function edit(c: Category | null) {
    setEditing(c);
    setName(c?.name ?? '');
    setColor(c?.color ?? colors[0]);
    setIcon(c?.icon ?? icons[0]);
    setEmoji(c?.icon.startsWith('emoji:') ? c.icon.slice(6) : '');
    setError('');
    setCustomize(false);
    setOptions(false);
  }
  async function save() {
    if (busy) return;
    try {
      if (!name.trim()) throw new Error('Informe o nome da categoria.');
      if (icon.startsWith('emoji:') && !isCategoryEmoji(emoji.trim()))
        throw new Error('Escolha um único emoji para a categoria.');
      setBusy(true);
      const category = {
        id: editing?.id ?? id(),
        name: name.trim(),
        color,
        icon: icon.startsWith('emoji:') ? `emoji:${emoji.trim()}` : icon,
        archived: editing?.archived ?? false,
      };
      await mutate((l) => ({
        ...l,
        categories: editing
          ? l.categories.map((c) => (c.id === category.id ? category : c))
          : [...l.categories, category],
      }));
      setEditing(undefined);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function run(change: (l: Ledger) => Ledger) {
    if (busy) return;
    setBusy(true);
    try {
      await mutate(change);
      return true;
    } catch (e) {
      Alert.alert('Alteração não salva', errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  function remove(c: Category) {
    const used = ledger.entries.some((e) => e.categoryId === c.id);
    Alert.alert(
      used ? 'Arquivar categoria?' : 'Excluir categoria?',
      (used
        ? 'Ela ficará disponível no histórico. Novos lançamentos usarão as categorias ativas.'
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
              categories: used
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
  const close = () => {
    if (busy) return;
    if (editing !== undefined) {
      if (changed)
        Alert.alert('Descartar alterações?', 'As alterações da categoria ainda não foram salvas.', [
          { text: 'Continuar editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => setEditing(undefined) },
        ]);
      else setEditing(undefined);
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
                      : 'Crie uma categoria para organizar suas despesas.'}
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
                          { minHeight: 48, opacity: pressed ? 0.65 : 1 },
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
                        <Text style={{ color: palette.teal }}>Editar</Text>
                      </Pressable>
                    </View>
                  </React.Fragment>
                ))}
              </>
            ) : (
              <>
                <Field
                  label="Nome"
                  value={name}
                  onChangeText={setName}
                  maxLength={60}
                  placeholder="Nome da categoria"
                  editable={!busy}
                  autoFocus
                />
                <MenuRow
                  icon="color-palette-outline"
                  title="Cor e ícone"
                  disabled={busy}
                  expanded={customize}
                  onPress={() => setCustomize((value) => !value)}
                />
                {customize && (
                  <>
                    <Text style={s.label}>Cor</Text>
                    <View style={s.wrap}>
                      {[...new Set([...colors, color])].map((v) => (
                        <Pressable
                          key={v}
                          onPress={() => setColor(v)}
                          accessibilityRole="button"
                          accessibilityLabel={`Cor ${['Laranja', 'Amarelo', 'Verde água', 'Roxo', 'Azul', 'Rosa', 'Verde'][colors.indexOf(v)] ?? categoryColor(v)}`}
                          accessibilityState={{ selected: color === v }}
                          disabled={busy}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: categoryColor(v),
                            borderWidth: color === v ? 4 : 0,
                            borderColor: palette.navy,
                          }}
                        />
                      ))}
                    </View>
                    <Text style={s.label}>Ícone</Text>
                    <View style={s.wrap}>
                      {categoryIconOptions.map(({ value: v, label }) => (
                        <Chip
                          key={v}
                          label={`Ícone ${label}`}
                          disabled={busy}
                          selected={icon === v}
                          onPress={() => setIcon(v)}
                        >
                          <CategoryIcon category={{ icon: v, color }} size={30} />
                        </Chip>
                      ))}
                    </View>
                    <Field
                      label="Usar emoji"
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
                        emoji && !isCategoryEmoji(emoji.trim())
                          ? 'Informe um único emoji.'
                          : undefined
                      }
                    />
                    {isCategoryEmoji(emoji.trim()) && (
                      <Chip
                        label={`Usar emoji ${emoji.trim()}`}
                        selected={icon.startsWith('emoji:')}
                        disabled={busy}
                        onPress={() => setIcon(`emoji:${emoji.trim()}`)}
                      >
                        <CategoryIcon category={{ icon: `emoji:${emoji.trim()}`, color }} />
                        Usar este emoji
                      </Chip>
                    )}
                  </>
                )}
                {!!error && (
                  <Text accessibilityRole="alert" style={{ color: palette.expense }}>
                    {error}
                  </Text>
                )}

                {editing && (
                  <>
                    <MenuRow
                      icon="ellipsis-horizontal"
                      title="Opções da categoria"
                      disabled={busy}
                      expanded={options}
                      onPress={() => setOptions((value) => !value)}
                    />
                    {options &&
                      (editing.archived ? (
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
                            ledger.entries.some((entry) => entry.categoryId === editing.id)
                              ? 'Arquivar categoria'
                              : 'Excluir categoria'
                          }
                          disabled={busy}
                          onPress={() => remove(editing)}
                        />
                      ))}
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
