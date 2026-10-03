import { AppearanceProvider, useAppearance } from './src/Appearance';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/HomeScreen';
import { UpdateCard } from './src/UpdateCard';
import { useBackup } from './src/useBackup';
import { BottomNavigation, Tab } from './src/BottomNavigation';
import { CategoryScreen } from './src/CategoryScreen';
import { Charts } from './src/Charts';
import { HistoryScreen } from './src/HistoryScreen';
import { MenuScreen } from './src/MenuScreen';
import { EntryForm } from './src/EntryForm';
import { Entry, Kind, Ledger, shiftMonth, today } from './src/finance';
import { Button, IconButton, MonthSelector } from './src/ui';
import { errorMessage, useLedger } from './src/useLedger';
import { useUpdates } from './src/useUpdates';

function Main() {
  const {
    palette,
    s,
    dark,
    hidden,
    toggleHidden,
    saving: preferenceBusy,
    refreshPreferences,
  } = useAppearance();
  const store = useLedger();
  const updates = useUpdates();
  const [tab, setTab] = useState<Tab>('home');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [entry, setEntry] = useState<Entry | null | undefined>();
  const [categories, setCategories] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [historyKind, setHistoryKind] = useState<Kind | null>(null);
  const navigation = useRef<Tab[]>([]);
  const [undo, setUndo] = useState<{
    entry: Entry;
    index: number;
    category: Ledger['categories'][number] | undefined;
    deadline: number;
  } | null>(null);
  const {
    busy: backupBusy,
    preview,
    cancelPreview,
    exportBackup,
    importBackup,
    restoreBackup,
  } = useBackup(store, refreshPreferences, () => {
    setUndo(null);
    clearFilters();
  });
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
  const title = { home: 'Meu Saldo', history: 'Histórico', charts: 'Gráficos', menu: 'Menu' }[tab];
  const chooseTab = (next: Tab) => {
    if (next !== tab) {
      navigation.current.push(tab);
      setTab(next);
    }
  };
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text accessibilityRole="header" style={[s.title, { flex: 1 }]}>
            {title}
          </Text>
          {tab !== 'menu' && (
            <IconButton
              icon={hidden ? 'eye-off-outline' : 'eye-outline'}
              label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
              onPress={() => void toggleHidden()}
              disabled={preferenceBusy}
            />
          )}
        </View>
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
      </View>
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
              {tab !== 'menu' && (
                <Button secondary title="Recuperar uma cópia" onPress={() => chooseTab('menu')} />
              )}
            </View>
          )}
          {tab === 'home' && (
            <>
              {ledger && (
                <HomeScreen
                  ledger={ledger}
                  month={month}
                  openHistory={openCategoryHistory}
                  onAdd={() => {
                    if (!store.busy) setEntry(null);
                  }}
                  onCharts={() => chooseTab('charts')}
                />
              )}
            </>
          )}
          {tab === 'home' && (
            <UpdateCard updates={updates} onOpenSettings={() => chooseTab('menu')} />
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
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            backgroundColor: palette.hero,
            paddingHorizontal: 20,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: palette.heroText, fontSize: 15, flexGrow: 1 }}
          >
            Lançamento excluído.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Desfazer exclusão"
            accessibilityState={{ disabled: store.busy }}
            onPress={() => void undoDelete()}
            disabled={store.busy}
            style={({ pressed }) => ({
              minHeight: 48,
              paddingHorizontal: 12,
              justifyContent: 'center',
              opacity: store.busy ? 0.45 : pressed ? 0.65 : 1,
            })}
          >
            <Text style={{ color: palette.heroText, fontWeight: '700', fontSize: 16 }}>
              Desfazer
            </Text>
          </Pressable>
        </View>
      )}
      <BottomNavigation
        tab={tab}
        onSelect={chooseTab}
        onAdd={() => setEntry(null)}
        addDisabled={!ledger || store.busy}
      />
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
          if (!store.busy && !backupBusy) cancelPreview();
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
              title={store.busy || backupBusy ? 'Restaurando…' : 'Confirmar substituição'}
              disabled={store.busy || backupBusy}
              onPress={() => void restoreBackup()}
            />
            <Button
              secondary
              title="Cancelar"
              disabled={store.busy || backupBusy}
              onPress={() => cancelPreview()}
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
