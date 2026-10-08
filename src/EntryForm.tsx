import { useAppearance } from './Appearance';
import { useRef, useState } from 'react';
import { useSheetDialog } from './SheetDialog';
import { SaveNotice } from './SaveNotice';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  Switch,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryIcon, Chip, Field, IconButton, Button, Card, SegmentedControl } from './ui';
import { MenuRow } from './MenuRow';
import { CategoryScreen } from './CategoryScreen';
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
  Frequency,
  RecurrenceChange,
} from './finance';
import { errorMessage } from './useLedger';

export function EntryForm({
  entry,
  ledger,
  month,
  onSave,
  onDelete,
  onClose,
  draft,
  onDuplicate,
  initialKind = 'DESPESA',
  mutate,
}: {
  entry: Entry | null;
  draft?: Entry;
  onDuplicate?: (entry: Entry) => void;
  ledger: Ledger;
  month: string;
  onSave: (entry: Entry, recurrence: RecurrenceChange) => Promise<void>;
  onDelete: (id: string, stopRecurrence?: boolean) => Promise<void>;
  onClose: () => void;
  initialKind?: Kind;
  mutate: (change: (ledger: Ledger) => Ledger) => Promise<void>;
}) {
  const initial = entry ?? draft;
  const { palette, s } = useAppearance();
  const { alert, dialog } = useSheetDialog();
  const [categoryPicker, setCategoryPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [kind, setKind] = useState<Kind>(initial?.kind ?? initialKind);
  const rule = ledger.recurrences.find((r) => r.id === entry?.recurrenceId);
  const [repeat, setRepeat] = useState(rule?.active ?? false);
  const [frequency, setFrequency] = useState<Frequency>(rule?.frequency ?? 'monthly');
  const [createCategory, setCreateCategory] = useState(false);
  const [amount, setAmount] = useState(
    initial ? (initial.cents / 100).toFixed(2).replace('.', ',') : '',
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [initialDate] = useState(initial?.date ?? initialEntryDate(month));
  const [date, setDate] = useState(initialDate);
  const amountRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [amountError, setAmountError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const categoryPosition = useRef(0);
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [calendar, setCalendar] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [savedEvent, setSavedEvent] = useState(0);
  const [error, setError] = useState('');
  const categories = ledger.categories.filter(
    (c) => c.kind === kind && (!c.archived || c.id === initial?.categoryId),
  );
  const [categorySearch, setCategorySearch] = useState('');
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const visibleCategories = categories.filter((category) =>
    searchText(category.name).includes(searchText(categorySearch)),
  );
  const baseline = useRef({
    kind: initial?.kind ?? initialKind,
    amount: initial ? (initial.cents / 100).toFixed(2).replace('.', ',') : '',
    description: initial?.description ?? '',
    date: initialDate,
    categoryId: initial?.categoryId ?? null,
  });
  const changed =
    kind !== baseline.current.kind ||
    amount !== baseline.current.amount ||
    description !== baseline.current.description ||
    date !== baseline.current.date ||
    categoryId !== baseline.current.categoryId;
  const recurrenceChanged =
    repeat !== (rule?.active ?? false) || frequency !== (rule?.frequency ?? 'monthly');
  function close() {
    if (savingRef.current || saving) return;
    if (!changed && !recurrenceChanged) onClose();
    else
      alert('Descartar alterações?', 'As alterações desta tela ainda não foram salvas.', [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: onClose },
      ]);
  }
  async function save(addAnother = false) {
    if (savingRef.current) return;
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
      setCategorySearch('');
      Keyboard.dismiss();
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ y: categoryPosition.current, animated: true }),
      );
      return;
    }
    let readyForNext = false;
    try {
      savingRef.current = true;
      setSaving(true);
      let scope: RecurrenceChange['scope'] = 'current';
      if (repeat && rule?.active && (changed || recurrenceChanged)) {
        const answer = await new Promise<'current' | 'future' | null>((resolve) =>
          alert(
            'Editar recorrência',
            'Como deseja aplicar as alterações?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
              {
                text: 'Somente este lançamento',
                detail: 'Mantém as próximas ocorrências.',
                onPress: () => resolve('current'),
              },
              {
                text: 'Este e os próximos',
                detail: 'Atualiza os próximos. Preserva o histórico já gerado.',
                onPress: () => resolve('future'),
              },
            ],
            { cancelable: false },
          ),
        );
        if (!answer) return;
        scope = answer;
      }
      if (repeat && (!rule?.active || scope === 'future')) {
        const weekday = civilDate(date).toLocaleDateString('pt-BR', { weekday: 'long' });
        const schedule =
          frequency === 'monthly'
            ? `todo mês no dia ${Number((date === entry?.date && frequency === rule?.frequency ? rule.anchorDate : date).slice(8))}. Se o mês não tiver esse dia, será usado o último dia do mês`
            : `toda semana, ${weekday}`;
        const confirmed = await new Promise<boolean>((resolve) =>
          alert(
            'Confirmar recorrência',
            `Esta ${kind === 'DESPESA' ? 'despesa' : 'receita'} será registrada ${schedule}.`,
            [
              { text: 'Continuar editando', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Confirmar e salvar', onPress: () => resolve(true) },
            ],
            { cancelable: false },
          ),
        );
        if (!confirmed) return;
      }
      await onSave(
        {
          id: entry?.id ?? id(),
          kind,
          cents,
          date,
          description: description.trim(),
          categoryId,
        },
        { repeat, frequency, scope },
      );
      if (addAnother && !entry) {
        baseline.current = { kind, amount: '', description: '', date, categoryId };
        setAmount('');
        setDescription('');
        setRepeat(false);
        setFrequency('monthly');
        setCategorySearch('');
        setSavedEvent((event) => event + 1);
        readyForNext = true;
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      savingRef.current = false;
      setSaving(false);
      if (readyForNext) requestAnimationFrame(() => amountRef.current?.focus());
    }
  }
  function remove() {
    if (!entry || saving) return;
    const removeConfirmed = async (stopRecurrence = false) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      try {
        await onDelete(entry.id, stopRecurrence);
        onClose();
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    };
    alert(
      'Excluir lançamento?',
      rule?.active
        ? 'Você pode excluir apenas este lançamento ou também parar os próximos registros automáticos.'
        : 'Esta ação remove o lançamento do seu histórico.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => void removeConfirmed(),
        },
        ...(rule?.active
          ? [{ text: 'Excluir e parar próximos', onPress: () => void removeConfirmed(true) }]
          : []),
      ],
    );
  }
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (saving) return;
        close();
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
                if (ledger.categories.find((c) => c.id === categoryId)?.kind !== value)
                  setCategoryId(null);
                setCategoryError('');
              }}
              options={[
                { value: 'DESPESA', label: 'Despesa' },
                { value: 'RECEITA', label: 'Receita' },
              ]}
            />
            <View>
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
                    selectTextOnFocus={false}
                    autoCorrect={false}
                    style={{ fontSize: 32, fontWeight: '600' }}
                    editable={!saving}
                  />
                </View>
                <IconButton
                  icon="backspace-outline"
                  label="Limpar valor"
                  disabled={saving || !amount}
                  onPress={() => {
                    setAmount('');
                    setAmountError('');
                    amountRef.current?.focus();
                  }}
                />
              </View>
            </View>
            <Field
              label="Descrição (opcional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Ex.: compras da semana"
              maxLength={300}
              multiline
              editable={!saving}
            />
            <View
              style={{ gap: spacing.sm }}
              onLayout={(event) => {
                categoryPosition.current = event.nativeEvent.layout.y;
              }}
            >
              <Text style={s.label}>Categoria</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar categoria"
                disabled={saving}
                onPress={() => {
                  Keyboard.dismiss();
                  setCategoryPicker(true);
                }}
                style={[
                  s.row,
                  {
                    padding: 12,
                    borderWidth: 1,
                    borderColor: palette.border,
                    borderRadius: 14,
                    minHeight: 50,
                  },
                ]}
              >
                {selectedCategory && <CategoryIcon category={selectedCategory} />}
                <Text style={[s.text, { flex: 1 }]}>
                  {selectedCategory?.name ??
                    (kind === 'RECEITA' ? 'Sem categoria' : 'Escolher categoria')}
                </Text>
                <Text style={s.muted}>›</Text>
              </Pressable>
              {!!categoryError && (
                <Text accessibilityRole="alert" style={{ color: palette.expense }}>
                  {categoryError}
                </Text>
              )}
            </View>
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
            <View style={[s.row, { justifyContent: 'space-between', minHeight: 48 }]}>
              <Text style={s.text}>Repetir lançamento</Text>
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Repetir lançamento"
                accessibilityState={{ checked: repeat, disabled: saving }}
                disabled={saving}
                onPress={() => setRepeat((value) => !value)}
                style={{
                  minWidth: 48,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Switch
                  accessible={false}
                  pointerEvents="none"
                  value={repeat}
                  disabled={saving}
                  trackColor={{ false: palette.border, true: palette.accent }}
                />
              </Pressable>
            </View>
            {repeat && (
              <SegmentedControl
                label="Frequência da recorrência"
                value={frequency}
                disabled={saving}
                onChange={setFrequency}
                options={[
                  { value: 'monthly', label: 'Mensal' },
                  { value: 'weekly', label: 'Semanal' },
                ]}
              />
            )}
            {rule && !repeat && (
              <Text style={[s.muted, { color: palette.warning }]}>
                {rule.active
                  ? 'Ao salvar, as próximas ocorrências serão interrompidas. Este lançamento e o histórico serão preservados.'
                  : 'Recorrência encerrada. As próximas ocorrências estão interrompidas; este lançamento e o histórico foram preservados.'}
              </Text>
            )}
            {!!error && (
              <Text accessibilityRole="alert" style={{ color: palette.expense }}>
                {error}
              </Text>
            )}
            {!!entry && (
              <View style={{ marginTop: 24, gap: 16 }}>
                <Button
                  secondary
                  title="Mais ações"
                  onPress={() => setShowActions((value) => !value)}
                  disabled={saving}
                />
                {showActions && (
                  <View style={{ gap: 8 }}>
                    {!!onDuplicate && (
                      <Button
                        secondary
                        title="Duplicar lançamento"
                        disabled={saving}
                        onPress={() => {
                          if (!entry) return;
                          if (changed || recurrenceChanged)
                            alert(
                              'Duplicar lançamento salvo?',
                              'A cópia usa os dados já salvos. As alterações desta edição serão descartadas.',
                              [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Duplicar', onPress: () => onDuplicate(entry) },
                              ],
                            );
                          else onDuplicate(entry);
                        }}
                      />
                    )}
                    <Button danger title="Excluir lançamento" onPress={remove} disabled={saving} />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
          <View
            style={{
              padding: spacing.lg,
              borderTopWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.card,
              gap: spacing.sm,
            }}
          >
            <SaveNotice
              event={savedEvent}
              message={kind === 'DESPESA' ? 'Despesa salva' : 'Receita salva'}
            />
            <Button
              title={saving ? 'Salvando…' : 'Salvar'}
              onPress={() => void save()}
              disabled={saving}
            />
            {!entry && (
              <Button
                secondary
                title="Salvar e adicionar outro"
                onPress={() => void save(true)}
                disabled={saving}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal
        visible={categoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryPicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }}>
          <SafeAreaView
            style={{
              backgroundColor: palette.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '80%',
              padding: 16,
            }}
          >
            <View style={s.row}>
              <Text style={[s.heading, { flex: 1 }]}>Escolher categoria</Text>
              <IconButton
                icon="close"
                label="Fechar categorias"
                onPress={() => setCategoryPicker(false)}
              />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
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
                  {kind === 'RECEITA' && (
                    <Chip
                      selected={!categoryId}
                      disabled={saving}
                      onPress={() => {
                        setCategoryId(null);
                        setCategoryPicker(false);
                      }}
                    >
                      Sem categoria
                    </Chip>
                  )}
                  {visibleCategories.map((category: Category) => (
                    <Chip
                      key={category.id}
                      disabled={saving}
                      selected={categoryId === category.id}
                      onPress={() => {
                        setCategoryId(category.id);
                        setCategoryPicker(false);
                        setCategoryError('');
                        setCategorySearch('');
                        Keyboard.dismiss();
                      }}
                    >
                      <CategoryIcon category={category} /> {category.name}
                      {category.archived ? ' (arquivada)' : ''}
                    </Chip>
                  ))}
                </View>
                {categories.length === 0 ? (
                  <Text style={s.muted}>Crie uma categoria para organizar seus lançamentos.</Text>
                ) : (
                  visibleCategories.length === 0 && (
                    <Text style={s.muted}>Nenhuma categoria encontrada. Tente outro nome.</Text>
                  )
                )}
                <Button
                  secondary
                  title="Criar categoria"
                  disabled={saving}
                  onPress={() => {
                    Keyboard.dismiss();
                    setCategoryPicker(false);
                    setCreateCategory(true);
                  }}
                />
              </Card>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
      {dialog}
      {createCategory && (
        <CategoryScreen
          ledger={ledger}
          mutate={mutate}
          initialKind={kind}
          createOnly
          onClose={() => setCreateCategory(false)}
          onCreated={(category) => {
            if (category.kind === kind) {
              setCategoryId(category.id);
              setCategoryError('');
            }
          }}
        />
      )}
    </Modal>
  );
}
