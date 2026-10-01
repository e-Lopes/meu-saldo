import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, ScrollView, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryIcon, Chip, Field, IconButton, Button, s } from './ui';
import {
  Category,
  civilDate,
  dateLabel,
  Entry,
  id,
  Kind,
  Ledger,
  parseCents,
  today,
} from './finance';
import { errorMessage } from './useLedger';

export function EntryForm({
  entry,
  ledger,
  onSave,
  onDelete,
  onClose,
}: {
  entry: Entry | null;
  ledger: Ledger;
  onSave: (entry: Entry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<Kind>(entry?.kind ?? 'DESPESA');
  const [amount, setAmount] = useState(
    entry ? (entry.cents / 100).toFixed(2).replace('.', ',') : '',
  );
  const [description, setDescription] = useState(entry?.description ?? '');
  const [date, setDate] = useState(entry?.date ?? today());
  const [categoryId, setCategoryId] = useState<string | null>(entry?.categoryId ?? null);
  const [calendar, setCalendar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const categories = ledger.categories.filter((c) => !c.archived || c.id === entry?.categoryId);
  const changed =
    kind !== (entry?.kind ?? 'DESPESA') ||
    amount !== (entry ? (entry.cents / 100).toFixed(2).replace('.', ',') : '') ||
    description !== (entry?.description ?? '') ||
    date !== (entry?.date ?? today()) ||
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
    try {
      const cents = parseCents(amount);
      if (kind === 'DESPESA' && !categoryId)
        throw new Error('Escolha uma categoria para a despesa.');
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
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
            <View style={s.wrap}>
              <Chip selected={kind === 'DESPESA'} onPress={() => setKind('DESPESA')}>
                Despesa
              </Chip>
              <Chip selected={kind === 'RECEITA'} onPress={() => setKind('RECEITA')}>
                Receita
              </Chip>
            </View>
            <Field
              label="Valor (R$)"
              placeholder="0,00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              maxLength={16}
              autoFocus={!entry}
              style={{ fontSize: 32, fontWeight: '600' }}
              editable={!saving}
            />
            <View>
              <Text style={s.label}>Data</Text>
              <Button
                secondary
                title={`${dateLabel(date)} de ${date.slice(0, 4)}`}
                onPress={() => setCalendar(true)}
                disabled={saving}
              />
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
              <View style={{ gap: 10 }}>
                <Text style={s.label}>Categoria</Text>
                <View style={s.wrap}>
                  {categories.map((c: Category) => (
                    <View key={c.id} style={{ minWidth: '45%', flexGrow: 1 }}>
                      <Chip selected={categoryId === c.id} onPress={() => setCategoryId(c.id)}>
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
              <Text accessibilityRole="alert" style={{ color: '#B23D37' }}>
                {error}
              </Text>
            )}
            <Button
              title={saving ? 'Salvando…' : 'Salvar lançamento'}
              onPress={() => void save()}
              disabled={saving}
            />
            {!!entry && (
              <Button danger title="Excluir lançamento" onPress={remove} disabled={saving} />
            )}
            <Text style={s.muted}>
              O valor entra no saldo do mês escolhido. Todos os registros ficam neste celular.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
