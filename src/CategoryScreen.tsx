import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, categoryColor, colors, icons, id, Ledger } from './finance';
import { Button, CategoryIcon, Chip, Field, IconButton, palette, s } from './ui';
import { errorMessage } from './useLedger';

export function CategoryScreen({
  ledger,
  mutate,
  onClose,
}: {
  ledger: Ledger;
  mutate: (change: (l: Ledger) => Ledger) => Promise<void>;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<Category | null | undefined>();
  const [name, setName] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [icon, setIcon] = useState(icons[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function edit(c: Category | null) {
    setEditing(c);
    setName(c?.name ?? '');
    setColor(c?.color ?? colors[0]);
    setIcon(c?.icon ?? icons[0]);
    setError('');
  }
  async function save() {
    if (busy) return;
    try {
      if (!name.trim()) throw new Error('Informe o nome da categoria.');
      setBusy(true);
      const category = {
        id: editing?.id ?? id(),
        name: name.trim(),
        color,
        icon,
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
    } catch (e) {
      Alert.alert('Alteração não salva', errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function remove(c: Category) {
    const used = ledger.entries.some((e) => e.categoryId === c.id);
    Alert.alert(
      used ? 'Arquivar categoria?' : 'Excluir categoria?',
      used
        ? 'Ela ficará disponível no histórico. Novos lançamentos usarão as categorias ativas.'
        : 'Esta categoria não possui lançamentos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: used ? 'Arquivar' : 'Excluir',
          style: used ? 'default' : 'destructive',
          onPress: () =>
            void run((l) => ({
              ...l,
              categories: used
                ? l.categories.map((v) => (v.id === c.id ? { ...v, archived: true } : v))
                : l.categories.filter((v) => v.id !== c.id),
            })),
        },
      ],
    );
  }
  const close = () => {
    if (busy) return;
    if (editing !== undefined) setEditing(undefined);
    else onClose();
  };
  return (
    <Modal visible animationType="slide" onRequestClose={close}>
      <SafeAreaView style={s.page}>
        <View style={[s.row, { padding: 12 }]}>
          <IconButton
            icon={editing === undefined ? 'close' : 'arrow-back'}
            label="Voltar"
            onPress={close}
          />
          <Text style={s.title}>
            {editing === undefined ? 'Categorias' : editing ? 'Editar categoria' : 'Nova categoria'}
          </Text>
        </View>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {editing === undefined ? (
            <>
              <Button title="Criar categoria" onPress={() => edit(null)} disabled={busy} />
              {ledger.categories.map((c) => (
                <View key={c.id} style={s.card}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${c.name}`}
                    onPress={() => edit(c)}
                    style={s.row}
                  >
                    <CategoryIcon category={c} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.heading}>{c.name}</Text>
                      <Text style={s.muted}>{c.archived ? 'Arquivada' : 'Ativa'}</Text>
                    </View>
                    <Text style={{ color: palette.teal }}>Editar</Text>
                  </Pressable>
                  {c.archived ? (
                    <Button
                      secondary
                      title="Reativar"
                      disabled={busy}
                      onPress={() =>
                        void run((l) => ({
                          ...l,
                          categories: l.categories.map((v) =>
                            v.id === c.id ? { ...v, archived: false } : v,
                          ),
                        }))
                      }
                    />
                  ) : (
                    <Button
                      secondary
                      title={
                        ledger.entries.some((e) => e.categoryId === c.id) ? 'Arquivar' : 'Excluir'
                      }
                      disabled={busy}
                      onPress={() => remove(c)}
                    />
                  )}
                </View>
              ))}
              <Text style={s.muted}>
                Categorias com lançamentos são arquivadas para preservar o histórico.
              </Text>
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
              />
              <Text style={s.label}>Cor</Text>
              <View style={s.wrap}>
                {[...new Set([...colors, color])].map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setColor(v)}
                    accessibilityRole="button"
                    accessibilityLabel={`Cor ${categoryColor(v)}`}
                    accessibilityState={{ selected: color === v }}
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
                {icons.map((v) => (
                  <Chip key={v} selected={icon === v} onPress={() => setIcon(v)}>
                    <CategoryIcon category={{ icon: v, color }} size={30} />
                  </Chip>
                ))}
              </View>
              {!!error && (
                <Text accessibilityRole="alert" style={{ color: palette.expense }}>
                  {error}
                </Text>
              )}
              <Button
                title={busy ? 'Salvando…' : 'Salvar categoria'}
                onPress={() => void save()}
                disabled={busy}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
