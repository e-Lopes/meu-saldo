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
import { SaveNotice } from './src/SaveNotice';
import {
  Entry,
  duplicateEntry,
  Kind,
  Ledger,
  Recurrence,
  removeEntry,
  saveEntry,
  shiftMonth,
  today,
} from './src/finance';
import { Button, MonthSelector } from './src/ui';
import { errorMessage, useLedger } from './src/useLedger';
import { useUpdates } from './src/useUpdates';

function Main() {
  const { palette, s, dark, refreshPreferences } = useAppearance();
  const store = useLedger();
  const updates = useUpdates();
  const [tab, setTab] = useState<Tab>('home');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [entry, setEntry] = useState<Entry | null | undefined>();
  const [duplicateDraft, setDuplicateDraft] = useState<Entry>();
  const [initialKind, setInitialKind] = useState<Kind>('DESPESA');
  const [chartsKind, setChartsKind] = useState<Kind>('DESPESA');
  const [savedEvent, setSavedEvent] = useState(0);
  const [savedMessage, setSavedMessage] = useState('Lançamento salvo');
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
    recurrence: Recurrence | undefined;
  } | null>(null);
  const {
    busy: backupBusy,
    backgroundSavedEvent,
    preview,
    cancelPreview,
    exportBackup,
    enableBackground,
    disableBackground,
    importBackup,
    restoreBackup,
  } = useBackup(
    store,
    refreshPreferences,
    () => {
      setUndo(null);
      clearFilters();
    },
    entry === undefined && !categories,
  );
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
  const openCategoryHistory = (key: string, kind: Kind = 'DESPESA') => {
    setCategoryFilter(key);
    setHistoryKind(kind);
    setSearch('');
    chooseTab('history');
  };
  const openKindHistory = (kind: Kind) => {
    clearFilters();
    setHistoryKind(kind);
    chooseTab('history');
  };
  const addEntry = (kind: Kind = 'DESPESA') => {
    if (!store.busy && store.ledger) {
      setDuplicateDraft(undefined);
      setInitialKind(kind);
      setEntry(null);
    }
  };
  async function deleteEntry(key: string, stopRecurrence = false) {
    let removed: Entry | undefined;
    let position = 0;
    let originalCategory: Ledger['categories'][number] | undefined;
    let originalRecurrence: Recurrence | undefined;
    await store.mutate((l) => {
      position = l.entries.findIndex((e) => e.id === key);
      removed = l.entries[position];
      originalCategory = l.categories.find((c) => c.id === removed?.categoryId);
      originalRecurrence = stopRecurrence
        ? l.recurrences.find((r) => r.id === removed?.recurrenceId)
        : undefined;
      return removeEntry(l, key, stopRecurrence);
    });
    if (removed) {
      const timeout = await AccessibilityInfo.getRecommendedTimeoutMillis(15000).catch(() => 15000);
      setUndo({
        entry: removed,
        index: position,
        category: originalCategory,
        deadline: Date.now() + timeout,
        recurrence: originalRecurrence,
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
        const recurrences = snapshot.recurrence
          ? l.recurrences.map((r) =>
              r.id === snapshot.recurrence!.id ? { ...r, active: snapshot.recurrence!.active } : r,
            )
          : l.recurrences;
        return { ...l, entries, categories, recurrences };
      });
      setUndo(null);
    } catch (e) {
      Alert.alert('Não foi possível desfazer', errorMessage(e));
    }
  }
  const ledger = store.ledger;
  const title = { home: 'Resumo', history: 'Histórico', charts: 'Gráficos', menu: 'Ajustes' }[tab];
  const chooseTab = (next: Tab) => {
    if (next !== tab) {
      navigation.current.push(tab);
      setTab(next);
    }
  };
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text accessibilityRole="header" style={[s.title, { flex: 1 }]}>
            {title}
          </Text>
        </View>
        {tab !== 'menu' && (
          <MonthSelector
            month={month}
            onCurrent={() => setMonth(today().slice(0, 7))}
            onShift={(delta) => {
              setMonth((current) => {
                const next = shiftMonth(current, delta);
                return /^\d{4}-\d{2}$/.test(next) ? next : current;
              });
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
          onKind={(kind) => {
            setHistoryKind(kind);
            if (
              categoryFilter !== null &&
              (categoryFilter === ''
                ? kind === 'DESPESA'
                : !!kind && ledger.categories.find((c) => c.id === categoryFilter)?.kind !== kind)
            )
              setCategoryFilter(null);
          }}
          onClear={clearFilters}
          onEdit={setEntry}
          onAdd={() => addEntry()}
        />
      ) : (
        <ScrollView
          key={tab}
          contentContainerStyle={[s.content, tab === 'home' && { paddingBottom: 96 }]}
          keyboardShouldPersistTaps="handled"
        >
          {store.loading && <ActivityIndicator size="large" color={palette.accent} />}
          {!!store.error && (
            <View style={s.card}>
              <Text style={s.heading}>Registros indisponíveis</Text>
              <Text style={s.text}>{store.error}</Text>
              <Text style={s.muted}>
                Não desinstale o app. Você pode restaurar um backup em Ajustes.
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
                  onAdd={addEntry}
                  onKindHistory={openKindHistory}
                  onCharts={(kind = 'DESPESA') => {
                    setChartsKind(kind);
                    chooseTab('charts');
                  }}
                />
              )}
            </>
          )}
          {tab === 'charts' && ledger && (
            <Charts
              ledger={ledger}
              month={month}
              initialKind={chartsKind}
              onCategory={openCategoryHistory}
            />
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
              onBackgroundBackup={enableBackground}
              onDisableBackground={() => void disableBackground()}
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
            paddingHorizontal: 16,
            paddingVertical: 8,
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
      <SaveNotice event={backgroundSavedEvent} message="Backup salvo" show={entry === undefined} />
      <SaveNotice event={savedEvent} message={savedMessage} show={entry === undefined} />
      <BottomNavigation
        tab={tab}
        onSelect={chooseTab}
        onAdd={() => addEntry()}
        addDisabled={!ledger || store.busy}
      />
      {entry !== undefined && ledger && (
        <EntryForm
          key={entry?.id ?? duplicateDraft?.id ?? 'new'}
          draft={duplicateDraft}
          onDuplicate={(source) => {
            setDuplicateDraft(duplicateEntry(source));
            setEntry(null);
          }}
          entry={entry}
          ledger={ledger}
          month={month}
          initialKind={initialKind}
          mutate={store.mutate}
          onClose={() => {
            setEntry(undefined);
            setDuplicateDraft(undefined);
          }}
          onSave={async (value, recurrence) => {
            const previous = store.ledger?.entries.find((item) => item.id === value.id);
            const ending =
              !recurrence.repeat &&
              store.ledger?.recurrences.some(
                (rule) => rule.id === previous?.recurrenceId && rule.active,
              );
            await store.mutate((l) => saveEntry(l, value, recurrence));
            setSavedMessage(
              ending
                ? 'Recorrência encerrada. Histórico preservado.'
                : value.kind === 'DESPESA'
                  ? 'Despesa salva'
                  : 'Receita salva',
            );
            setSavedEvent((event) => event + 1);
          }}
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
          style={{
            flex: 1,
            backgroundColor: `${palette.background}99`,
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={s.card}>
            <Text style={s.heading}>Restaurar este backup?</Text>
            <Text style={s.text}>
              {preview?.entries.length ?? 0} lançamentos e {preview?.categories.length ?? 0}{' '}
              categorias. {preview?.recurrences.length ?? 0} recorrências.
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
