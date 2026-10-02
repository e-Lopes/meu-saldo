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
import { CategoryIcon, Chip, Field, IconButton, Button } from './ui';
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
      Keyboard.dismiss();
      scrollRef.current?.scrollTo({ y: categoryPosition.current, animated: true });
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
    <Modal visible animationType="slide" onRequestClose={close}>
      <SafeAreaView style={s.page} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          <View style={[s.row, { padding: 12 }]}>
            <IconButton icon="close" label="Fechar lançamento" onPress={close} />
            <Text style={[s.title, { flex: 1 }]}>
              {entry ? 'Editar lançamento' : 'Novo lançamento'}
            </Text>
          </View>
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={s.content}
          >
            <View style={s.wrap}>
              <Chip
                disabled={saving}
                selected={kind === 'DESPESA'}
                onPress={() => {
                  setKind('DESPESA');
                  setCategoryError('');
                }}
              >
                Despesa
              </Chip>
              <Chip
                disabled={saving}
                selected={kind === 'RECEITA'}
                onPress={() => {
                  setKind('RECEITA');
                  setCategoryError('');
                }}
              >
                Receita
              </Chip>
            </View>
            <Field
              label="Valor (R$)"
              inputRef={amountRef}
              error={amountError}
              helper="Use vírgula para os centavos, por exemplo: 25,90."
              placeholder="0,00"
              value={amount}
              onChangeText={(value) => {
                setAmount(value);
                setAmountError('');
              }}
              keyboardType="decimal-pad"
              maxLength={16}
              autoFocus={!entry}
              style={{ fontSize: 32, fontWeight: '600' }}
              editable={!saving}
            />
            <View style={s.wrap}>
              <Button
                secondary
                title="Limpar valor"
                disabled={saving || !amount}
                onPress={() => {
                  setAmount('');
                  setAmountError('');
                  amountRef.current?.focus();
                }}
              />
              <Button secondary title="Fechar teclado" onPress={Keyboard.dismiss} />
            </View>
            <View>
              <Text style={s.label}>Data</Text>
              <Button
                secondary
                title={`${dateLabel(date)} de ${date.slice(0, 4)}`}
                onPress={() => setCalendar(true)}
                disabled={saving}
              />
              <Text style={[s.muted, { marginTop: 8 }]}>
                Este lançamento será registrado em {monthName(date.slice(0, 7))}. Toque na data para
                mudar.
              </Text>
              {date.slice(0, 7) !== month && (
                <Text accessibilityLiveRegion="polite" style={[s.muted, { marginTop: 8 }]}>
                  A data está fora do mês visualizado ({monthName(month)}). Após salvar, consulte
                  {` ${monthName(date.slice(0, 7))}`} para encontrar este lançamento.
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
            {kind === 'DESPESA' && (
              <View
                style={{ gap: 10 }}
                onLayout={(e) => {
                  categoryPosition.current = e.nativeEvent.layout.y;
                }}
              >
                <Text style={s.label}>Categoria</Text>
                {!!categoryError && (
                  <Text accessibilityRole="alert" style={{ color: palette.expense }}>
                    {categoryError}
                  </Text>
                )}
                <View style={s.wrap}>
                  {categories.map((c: Category) => (
                    <View key={c.id} style={{ minWidth: '45%', flexGrow: 1 }}>
                      <Chip
                        disabled={saving}
                        selected={categoryId === c.id}
                        onPress={() => {
                          setCategoryId(c.id);
                          setCategoryError('');
                        }}
                      >
                        <CategoryIcon category={c} size={26} /> {c.name}
                        {c.archived ? ' (arquivada)' : ''}
                      </Chip>
                    </View>
                  ))}
                </View>
                {categories.length === 0 && (
                  <Text style={s.muted}>Crie uma categoria no Menu para registrar despesas.</Text>
                )}
              </View>
            )}
            <Field
              label="Descrição (opcional)"
              value={description}
              onChangeText={setDescription}
              placeholder="O que foi esse lançamento?"
              maxLength={300}
              multiline
              editable={!saving}
            />
            {!!error && (
              <Text accessibilityRole="alert" style={{ color: palette.expense }}>
                {error}
              </Text>
            )}
            {!!entry && (
              <Button danger title="Excluir lançamento" onPress={remove} disabled={saving} />
            )}
            <Text style={s.muted}>
              O valor entra no saldo do mês escolhido. Todos os registros ficam neste celular.
            </Text>
          </ScrollView>
          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.card,
            }}
          >
            <Button
              title={saving ? 'Salvando…' : 'Salvar lançamento'}
              onPress={() => void save()}
              disabled={saving}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
