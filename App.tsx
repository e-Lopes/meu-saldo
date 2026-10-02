import { AppearanceProvider, useAppearance } from './src/Appearance';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CategoryScreen } from './src/CategoryScreen';
import { Charts } from './src/Charts';
import { HistoryScreen } from './src/HistoryScreen';
import { MenuScreen } from './src/MenuScreen';
import { EntryForm } from './src/EntryForm';
import {
  dateLabel,
  decode,
  encode,
  Entry,
  groups,
  Kind,
  Ledger,
  monthEntries,
  shiftMonth,
  today,
  totals,
} from './src/finance';
import Native from './src/native';
import { Button, CategoryIcon, Chip, Empty, Field, IconButton, MonthSelector } from './src/ui';
import { errorMessage, useLedger } from './src/useLedger';
import { useUpdates } from './src/useUpdates';

type Tab = 'home' | 'history' | 'charts' | 'menu';
type Updates = ReturnType<typeof useUpdates>;

function UpdateCard({ updates, settings = false }: { updates: Updates; settings?: boolean }) {
  const { palette, s, money, hidden } = useAppearance();
  if (!settings && (!updates.release || updates.dismissed)) return null;
  return (
    <View style={[s.card, { backgroundColor: palette.selected }]}>
      <Text style={s.heading}>
        {updates.release ? `Nova versão ${updates.release.versionName}` : 'Atualizações'}
      </Text>
      <Text style={s.muted}>Versão instalada: {updates.version}</Text>
      {updates.release && (
        <>
          <Text style={s.text}>A atualização mantém seus registros neste celular.</Text>
          {!!updates.release.notes && <Text style={s.muted}>{updates.release.notes}</Text>}
        </>
      )}
      {updates.checking && <ActivityIndicator color={palette.teal} />}
      {updates.downloading ? (
        <>
          <View
            style={{ height: 8, backgroundColor: '#CBDDDF', borderRadius: 4, overflow: 'hidden' }}
          >
            <View
              style={{
                height: 8,
                width: `${Math.round(updates.progress * 100)}%`,
                backgroundColor: palette.teal,
              }}
            />
          </View>
          <Text style={s.muted}>Baixando {Math.round(updates.progress * 100)}%</Text>
          <Button secondary title="Cancelar download" onPress={updates.cancel} />
        </>
      ) : (
        <>
          {updates.release && (
            <Button
              title={updates.ready ? 'Instalar atualização' : 'Baixar e atualizar'}
              onPress={() => void updates.update()}
              disabled={updates.checking}
            />
          )}
          {settings ? (
            <Button
              secondary
              title={updates.checking ? 'Verificando…' : 'Verificar atualizações'}
              onPress={() => void updates.check(true)}
              disabled={updates.checking}
            />
          ) : (
            <Button secondary title="Agora não" onPress={updates.dismiss} />
          )}
        </>
      )}
      {!!updates.message && <Text style={s.muted}>{updates.message}</Text>}
      {settings && (
        <Text style={s.muted}>
          Verificação ao abrir, no máximo a cada 6 horas. O uso financeiro funciona sem conexão.
        </Text>
      )}
    </View>
  );
}
function Home({
  ledger,
  month,
  openHistory,
}: {
  ledger: Ledger;
  month: string;
  openHistory: (category: string) => void;
}) {
  const { palette, s, money, hidden } = useAppearance();
  const entries = monthEntries(ledger, month);
  const summary = totals(entries);
  const grouped = groups(ledger, month);
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  return (
    <>
      <View style={[s.card, { backgroundColor: palette.hero, padding: 24 }]}>
        <Text style={{ color: palette.heroMuted, fontSize: 15 }}>Saldo do mês</Text>
        <Text style={{ color: palette.heroText, fontSize: stacked ? 28 : 35, fontWeight: '700' }}>
          {money(summary.balance)}
        </Text>
        <Text style={{ color: palette.heroMuted, fontSize: 13 }}>
          Receitas menos despesas, sem saldo anterior
        </Text>
        <View style={[s.wrap, { marginTop: 12 }]}>
          <View style={{ flexGrow: 1, minWidth: stacked ? '100%' : '40%', gap: 5 }}>
            <Text style={{ color: '#8AD3C2', fontSize: 14 }}>↗ Receitas</Text>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
              {money(summary.income)}
            </Text>
          </View>
          <View style={{ flexGrow: 1, minWidth: stacked ? '100%' : '40%', gap: 5 }}>
            <Text style={{ color: '#F0AC9A', fontSize: 14 }}>↘ Despesas</Text>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
              {money(summary.expense)}
            </Text>
          </View>
        </View>
      </View>
      <Text accessibilityRole="header" style={s.heading}>
        Despesas por categoria
      </Text>
      {entries.length === 0 ? (
        <Empty />
      ) : grouped.length === 0 ? (
        <Empty
          title="Nenhuma despesa neste mês"
          text="Suas receitas já estão incluídas no saldo."
        />
      ) : (
        <View style={s.wrap}>
          {grouped.map((g) => (
            <Pressable
              key={g.category.id}
              accessibilityRole="button"
              accessibilityLabel={`${g.category.name}: ${money(g.cents)}. Ver lançamentos.`}
              onPress={() => openHistory(g.category.id)}
              style={({ pressed }) => [
                s.card,
                {
                  width: stacked ? '100%' : '47%',
                  flexGrow: 1,
                  minWidth: 135,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <CategoryIcon category={g.category} />
              <Text style={s.text}>{g.category.name}</Text>
              <Text style={[s.heading, { fontSize: 19 }]}>{money(g.cents)}</Text>
              <Text style={s.muted}>
                {hidden
                  ? 'Valores ocultos'
                  : `${g.percentage.toFixed(1).replace('.', ',')}% dos gastos`}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}
function Main() {
  const {
    palette,
    s,
    money,
    dark,
    hidden,
    toggleHidden,
    saving: preferenceBusy,
    refreshPreferences,
  } = useAppearance();
  const store = useLedger();
  const updates = useUpdates();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [entry, setEntry] = useState<Entry | null | undefined>();
  const [categories, setCategories] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [historyKind, setHistoryKind] = useState<Kind | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [preview, setPreview] = useState<Ledger | null>(null);
  const navigation = useRef<Tab[]>([]);
  const [undo, setUndo] = useState<{
    entry: Entry;
    index: number;
    category: Ledger['categories'][number] | undefined;
    deadline: number;
  } | null>(null);
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), Math.max(0, undo.deadline - Date.now()));
    return () => clearTimeout(timer);
  }, [undo]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (entry !== undefined || categories || preview) return false;
      const previous = navigation.current.pop();
      if (previous) {
        setTab(previous);
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tab, entry, categories, preview]);
  const clearFilters = () => {
    setSearch('');
    setHistoryKind(null);
    setCategoryFilter(null);
  };
  const openCategoryHistory = (key: string) => {
    setCategoryFilter(key);
    setHistoryKind('DESPESA');
    setSearch('');
    chooseTab('history');
  };
  async function deleteEntry(key: string) {
    let removed: Entry | undefined;
    let position = 0;
    let originalCategory: Ledger['categories'][number] | undefined;
    await store.mutate((l) => {
      position = l.entries.findIndex((e) => e.id === key);
      removed = l.entries[position];
      originalCategory = l.categories.find((c) => c.id === removed?.categoryId);
      return { ...l, entries: l.entries.filter((e) => e.id !== key) };
    });
    if (removed) {
      const timeout = await AccessibilityInfo.getRecommendedTimeoutMillis(15000).catch(() => 15000);
      setUndo({
        entry: removed,
        index: position,
        category: originalCategory,
        deadline: Date.now() + timeout,
      });
    }
  }
  async function undoDelete() {
    const snapshot = undo;
    if (!snapshot || store.busy) return;
    if (snapshot.deadline <= Date.now()) {
      setUndo(null);
      return;
    }
    try {
      await store.mutate((l) => {
        if (l.entries.some((e) => e.id === snapshot.entry.id))
          throw new Error('Este lançamento já está no histórico.');
        const entries = [...l.entries];
        entries.splice(Math.min(snapshot.index, entries.length), 0, snapshot.entry);
        const categories =
          snapshot.category && !l.categories.some((c) => c.id === snapshot.category!.id)
            ? [...l.categories, snapshot.category]
            : l.categories;
        return { ...l, entries, categories };
      });
      setUndo(null);
    } catch (e) {
      Alert.alert('Não foi possível desfazer', errorMessage(e));
    }
  }
  const ledger = store.ledger;
  const title = { home: 'Meu Saldo', history: 'Lançamentos', charts: 'Gráficos', menu: 'Menu' }[
    tab
  ];
  async function exportBackup() {
    if (!ledger || backupBusy || store.busy) return;
    Alert.alert(
      'Exportar backup',
      'O arquivo JSON não é criptografado. Guarde em um lugar seguro; quem tiver acesso poderá ler seus registros.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Escolher destino',
          onPress: async () => {
            setBackupBusy(true);
            try {
              const saved = await Native.exportBackup(encode(ledger), `meu-saldo-${today()}.json`);
              if (saved) {
                await refreshPreferences();
                Alert.alert('Backup salvo', 'Seus registros foram exportados.');
              }
            } catch (e) {
              Alert.alert(
                errorMessage(e).includes('A cópia foi salva')
                  ? 'Cópia salva com aviso'
                  : 'Backup não salvo',
                errorMessage(e),
              );
            } finally {
              setBackupBusy(false);
            }
          },
        },
      ],
    );
  }
  async function importBackup() {
    if (backupBusy || store.busy) return;
    setBackupBusy(true);
    try {
      const text = await Native.importBackup();
      if (text !== null) setPreview(decode(text));
    } catch (e) {
      Alert.alert('Backup inválido', `${errorMessage(e)} Seus registros atuais foram preservados.`);
    } finally {
      setBackupBusy(false);
    }
  }
  async function restoreBackup() {
    if (!preview || store.busy) return;
    try {
      await store.restore(preview);
      setUndo(null);
      clearFilters();
      setPreview(null);
      Alert.alert('Backup restaurado', 'Os registros foram substituídos pelo backup escolhido.');
    } catch (e) {
      Alert.alert('Restauração não salva', errorMessage(e));
    }
  }
  const chooseTab = (next: Tab) => {
    if (next !== tab) {
      navigation.current.push(tab);
      setTab(next);
    }
  };
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <LinearGradient
        colors={[palette.header, palette.background]}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}
      >
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text accessibilityRole="header" style={[s.title, { flex: 1 }]}>
            {title}
          </Text>
          <IconButton
            icon={hidden ? 'eye-off-outline' : 'eye-outline'}
            label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
            onPress={() => void toggleHidden()}
            disabled={preferenceBusy}
          />
        </View>
        <Text style={s.muted}>
          {tab === 'home'
            ? 'Sua vida financeira, no seu celular.'
            : tab === 'menu'
              ? 'Tudo sob seu controle.'
              : tab === 'charts'
                ? 'Entenda para onde seu dinheiro vai.'
                : 'Acompanhe seu mês.'}
        </Text>
        {tab !== 'menu' && (
          <MonthSelector
            month={month}
            onCurrent={() => setMonth(today().slice(0, 7))}
            onShift={(delta) => {
              const next = shiftMonth(month, delta);
              if (/^\d{4}-\d{2}$/.test(next)) setMonth(next);
            }}
          />
        )}
      </LinearGradient>
      {tab === 'history' && ledger ? (
        <HistoryScreen
          ledger={ledger}
          month={month}
          category={categoryFilter}
          search={search}
          kind={historyKind}
          onCategory={setCategoryFilter}
          onSearch={setSearch}
          onKind={setHistoryKind}
          onClear={clearFilters}
          onEdit={setEntry}
        />
      ) : (
        <ScrollView key={tab} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {store.loading && <ActivityIndicator size="large" color={palette.teal} />}
          {!!store.error && (
            <View style={s.card}>
              <Text style={s.heading}>Registros indisponíveis</Text>
              <Text style={s.text}>{store.error}</Text>
              <Text style={s.muted}>
                Não desinstale o app. Você pode restaurar um backup no Menu.
              </Text>
            </View>
          )}
          {tab === 'home' && (
            <>
              <UpdateCard updates={updates} />
              {ledger && <Home ledger={ledger} month={month} openHistory={openCategoryHistory} />}
            </>
          )}
          {tab === 'charts' && ledger && (
            <Charts ledger={ledger} month={month} onCategory={openCategoryHistory} />
          )}
          {tab === 'menu' && (
            <MenuScreen
              ledger={ledger}
              version={updates.version}
              busy={store.busy}
              loading={store.loading}
              backupBusy={backupBusy}
              updateVersion={updates.release?.versionName}
              updateContent={<UpdateCard updates={updates} settings />}
              onCategories={() => setCategories(true)}
              onExport={() => void exportBackup()}
              onImport={() => void importBackup()}
            />
          )}
        </ScrollView>
      )}
      {undo && (
        <View
          style={{
            backgroundColor: palette.hero,
            paddingHorizontal: 20,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <Text accessibilityLiveRegion="polite" style={{ color: 'white', fontSize: 15 }}>
            Lançamento excluído.
          </Text>
          <Button
            title={store.busy ? 'Aguarde…' : 'Desfazer exclusão'}
            onPress={() => void undoDelete()}
            disabled={store.busy}
          />
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: palette.card,
          borderTopWidth: 1,
          borderColor: palette.border,
          paddingTop: 8,
          paddingBottom: Math.max(10, insets.bottom),
          paddingHorizontal: 5,
        }}
      >
        {(['home', 'history', 'add', 'charts', 'menu'] as const).map((key) =>
          key === 'add' ? (
            <View key={key} style={{ flex: 1, alignItems: 'center' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adicionar lançamento"
                disabled={!ledger || store.busy}
                onPress={() => setEntry(null)}
                style={({ pressed }) => ({
                  backgroundColor: palette.teal,
                  borderRadius: 22,
                  width: 55,
                  height: 55,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: ledger && !store.busy ? (pressed ? 0.65 : 1) : 0.4,
                })}
              >
                <Ionicons name="add" color={dark ? '#102D2A' : 'white'} size={32} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === key }}
              onPress={() => chooseTab(key)}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                minHeight: 48,
                paddingVertical: 4,
                gap: 4,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Ionicons
                name={
                  {
                    home: 'home-outline',
                    history: 'list-outline',
                    charts: 'bar-chart-outline',
                    menu: 'menu-outline',
                  }[key] as React.ComponentProps<typeof Ionicons>['name']
                }
                size={23}
                color={tab === key ? palette.teal : palette.muted}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: tab === key ? '700' : '400',
                  color: tab === key ? palette.teal : palette.muted,
                  textAlign: 'center',
                }}
              >
                {{ home: 'Início', history: 'Histórico', charts: 'Gráficos', menu: 'Menu' }[key]}
              </Text>
            </Pressable>
          ),
        )}
      </View>
      {entry !== undefined && ledger && (
        <EntryForm
          entry={entry}
          ledger={ledger}
          month={month}
          onClose={() => setEntry(undefined)}
          onSave={(value) =>
            store.mutate((l) => ({
              ...l,
              entries: l.entries.some((e) => e.id === value.id)
                ? l.entries.map((e) => (e.id === value.id ? value : e))
                : [...l.entries, value],
            }))
          }
          onDelete={deleteEntry}
        />
      )}
      {categories && ledger && (
        <CategoryScreen
          ledger={ledger}
          mutate={store.mutate}
          onClose={() => setCategories(false)}
        />
      )}
      <Modal
        visible={preview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!store.busy) setPreview(null);
        }}
      >
        <View
          style={{ flex: 1, backgroundColor: '#17304F99', justifyContent: 'center', padding: 24 }}
        >
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={s.card}>
            <Text style={s.heading}>Restaurar este backup?</Text>
            <Text style={s.text}>
              {preview?.entries.length ?? 0} lançamentos e {preview?.categories.length ?? 0}{' '}
              categorias.
            </Text>
            <Text style={s.text}>
              Todos os registros atuais serão substituídos. Exporte um backup antes se quiser manter
              uma cópia.
            </Text>
            <Button
              title={store.busy ? 'Restaurando…' : 'Confirmar substituição'}
              disabled={store.busy}
              onPress={() => void restoreBackup()}
            />
            <Button
              secondary
              title="Cancelar"
              disabled={store.busy}
              onPress={() => setPreview(null)}
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <Main />
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}
