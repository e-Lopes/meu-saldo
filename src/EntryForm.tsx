import { useAppearance } from './Appearance';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryIcon, Chip, Field, IconButton, Button, Card, SegmentedControl } from './ui';
import { MenuRow } from './MenuRow';
import { spacing } from './theme/tokens';
import {
  Category,
  civilDate,
  dateLabel,
  Entry,
  id,
  Kind,
  Ledger,
  parseCents,
  initialEntryDate,
  monthName,
  searchText,
} from './finance';
import { errorMessage } from './useLedger';

export function EntryForm({
  entry,
  ledger,
  month,
  onSave,
  onDelete,
  onClose,
}: {
  entry: Entry | null;
  ledger: Ledger;
  month: string;
  onSave: (entry: Entry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const { palette, s } = useAppearance();
  const [kind, setKind] = useState<Kind>(entry?.kind ?? 'DESPESA');
  const [amount, setAmount] = useState(
    entry ? (entry.cents / 100).toFixed(2).replace('.', ',') : '',
  );
  const [description, setDescription] = useState(entry?.description ?? '');
  const [initialDate] = useState(entry?.date ?? initialEntryDate(month));
  const [date, setDate] = useState(initialDate);
  const amountRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [amountError, setAmountError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const categoryPosition = useRef(0);
  const [categoryId, setCategoryId] = useState<string | null>(entry?.categoryId ?? null);
  const [calendar, setCalendar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const categories = ledger.categories.filter((c) => !c.archived || c.id === entry?.categoryId);
  const [categoryPicker, setCategoryPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [descriptionOpen, setDescriptionOpen] = useState(!!entry?.description);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const visibleCategories = categories.filter((category) =>
    searchText(category.name).includes(searchText(categorySearch)),
  );
  const changed =
    kind !== (entry?.kind ?? 'DESPESA') ||
    amount !== (entry ? (entry.cents / 100).toFixed(2).replace('.', ',') : '') ||
    description !== (entry?.description ?? '') ||
    date !== initialDate ||
    categoryId !== (entry?.categoryId ?? null);
  function close() {
    if (saving) return;
    if (!changed) onClose();
    else
      Alert.alert('Descartar alterações?', 'As alterações desta tela ainda não foram salvas.', [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: onClose },
      ]);
  }
  async function save() {
    if (saving) return;
    setError('');
    setAmountError('');
    setCategoryError('');
    let cents: number;
    try {
      cents = parseCents(amount);
    } catch (e) {
      setAmountError(errorMessage(e));
      amountRef.current?.focus();
      return;
    }
    if (kind === 'DESPESA' && !categoryId) {
      setCategoryError('Escolha uma categoria para a despesa.');
      setCategoryPicker(true);
      setCategorySearch('');
      Keyboard.dismiss();
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ y: categoryPosition.current, animated: true }),
      );
      return;
    }
    try {
      setSaving(true);
      await onSave({
        id: entry?.id ?? id(),
        kind,
        cents,
        date,
        description: description.trim(),
        categoryId: kind === 'DESPESA' ? categoryId : null,
      });
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  function remove() {
    if (!entry || saving) return;
    Alert.alert('Excluir lançamento?', 'Esta ação remove o lançamento do seu histórico.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await onDelete(entry.id);
            onClose();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (saving) return;
        if (categoryPicker) {
          setCategoryPicker(false);
          setCategorySearch('');
        } else close();
      }}
    >
      <SafeAreaView style={s.page} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          <View style={[s.row, { padding: spacing.md }]}>
            <IconButton icon="close" label="Fechar lançamento" onPress={close} disabled={saving} />
            <Text accessibilityRole="header" style={[s.title, { flex: 1 }]}>
              {entry ? 'Editar lançamento' : 'Novo lançamento'}
            </Text>
          </View>
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={s.content}
          >
            <SegmentedControl
              label="Tipo de lançamento"
              value={kind}
              disabled={saving}
              onChange={(value) => {
                setKind(value);
                setCategoryError('');
              }}
              options={[
                { value: 'DESPESA', label: 'Despesa' },
                { value: 'RECEITA', label: 'Receita' },
              ]}
            />
            <View style={[s.row, { alignItems: 'flex-end' }]}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Valor (R$)"
                  inputRef={amountRef}
                  error={amountError}
                  placeholder="0,00"
                  value={amount}
                  onChangeText={(value) => {
                    setAmount(value);
                    setAmountError('');
                  }}
                  keyboardType="decimal-pad"
                  maxLength={16}
                  autoFocus={!entry}
                  selectTextOnFocus
                  style={{ fontSize: 32, fontWeight: '600' }}
                  editable={!saving}
                />
              </View>
              {!!amount && (
                <IconButton
                  icon="backspace-outline"
                  label="Limpar valor"
                  disabled={saving}
                  onPress={() => {
                    setAmount('');
                    setAmountError('');
                    amountRef.current?.focus();
                  }}
                />
              )}
            </View>
            {kind === 'DESPESA' && (
              <View
                style={{ gap: spacing.sm }}
                onLayout={(event) => {
                  categoryPosition.current = event.nativeEvent.layout.y;
                }}
              >
                <MenuRow
                  icon="grid-outline"
                  title="Categoria"
                  subtitle={
                    selectedCategory
                      ? `${selectedCategory.name}${selectedCategory.archived ? ' (arquivada)' : ''}`
                      : 'Escolher categoria'
                  }
                  disabled={saving}
                  expanded={categoryPicker}
                  onPress={() => {
                    Keyboard.dismiss();
                    setCategoryPicker((value) => !value);
                  }}
                />
                {!!categoryError && (
                  <Text accessibilityRole="alert" style={{ color: palette.expense }}>
                    {categoryError}
                  </Text>
                )}
                {categoryPicker && (
                  <Card>
                    {categories.length > 6 && (
                      <Field
                        label="Buscar categoria"
                        value={categorySearch}
                        onChangeText={setCategorySearch}
                        placeholder="Nome da categoria"
                        editable={!saving}
                      />
                    )}
                    <View style={s.wrap}>
                      {visibleCategories.map((category: Category) => (
                        <Chip
                          key={category.id}
                          disabled={saving}
                          selected={categoryId === category.id}
                          onPress={() => {
                            setCategoryId(category.id);
                            setCategoryError('');
                            setCategoryPicker(false);
                            setCategorySearch('');
                            Keyboard.dismiss();
                          }}
                        >
                          <CategoryIcon category={category} size={26} /> {category.name}
                          {category.archived ? ' (arquivada)' : ''}
                        </Chip>
                      ))}
                    </View>
                    {categories.length === 0 ? (
                      <Text style={s.muted}>
                        Crie uma categoria no Menu para registrar despesas.
                      </Text>
                    ) : (
                      visibleCategories.length === 0 && (
                        <Text style={s.muted}>Nenhuma categoria encontrada. Tente outro nome.</Text>
                      )
                    )}
                  </Card>
                )}
              </View>
            )}
            <View>
              <MenuRow
                icon="calendar-outline"
                title="Data"
                subtitle={`${dateLabel(date)} de ${date.slice(0, 4)}`}
                disabled={saving}
                onPress={() => {
                  Keyboard.dismiss();
                  setCalendar(true);
                }}
              />
              {date.slice(0, 7) !== month && (
                <Text accessibilityLiveRegion="polite" style={s.muted}>
                  Este lançamento ficará em {monthName(date.slice(0, 7))}, fora do mês visualizado.
                </Text>
              )}
            </View>
            {calendar && (
              <DateTimePicker
                value={civilDate(date)}
                mode="date"
                onChange={(_, value) => {
                  setCalendar(false);
                  if (value)
                    setDate(
                      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`,
                    );
                }}
              />
            )}
            <View>
              <MenuRow
                icon="create-outline"
                title="Descrição"
                subtitle={descriptionOpen ? undefined : description || 'Opcional'}
                disabled={saving}
                expanded={descriptionOpen}
                onPress={() => {
                  Keyboard.dismiss();
                  setDescriptionOpen((value) => !value);
                }}
              />
              {descriptionOpen && (
                <Field
                  label="Descrição (opcional)"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ex.: compras da semana"
                  maxLength={300}
                  multiline
                  editable={!saving}
                />
              )}
            </View>
            {!!error && (
              <Text accessibilityRole="alert" style={{ color: palette.expense }}>
                {error}
              </Text>
            )}
            {!!entry && (
              <Button danger title="Excluir lançamento" onPress={remove} disabled={saving} />
            )}
          </ScrollView>
          <View
            style={{
              padding: spacing.lg,
              borderTopWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.card,
            }}
          >
            <Button
              title={saving ? 'Salvando…' : 'Salvar'}
              onPress={() => void save()}
              disabled={saving}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
