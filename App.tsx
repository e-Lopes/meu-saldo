import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CategoryScreen } from './src/CategoryScreen';
import { Charts } from './src/Charts';
import { EntryForm } from './src/EntryForm';
import {
  dateLabel,
  decode,
  encode,
  Entry,
  groups,
  Kind,
  Ledger,
  money,
  monthEntries,
  shiftMonth,
  today,
  totals,
} from './src/finance';
import Native from './src/native';
import {
  Button,
  CategoryIcon,
  Chip,
  Empty,
  Field,
  IconButton,
  MonthSelector,
  palette,
  s,
} from './src/ui';
import { errorMessage, useLedger } from './src/useLedger';
import { useUpdates } from './src/useUpdates';

type Tab = 'home' | 'history' | 'charts' | 'menu';
type Updates = ReturnType<typeof useUpdates>;

function UpdateCard({ updates, settings = false }: { updates: Updates; settings?: boolean }) {
  if (!settings && (!updates.release || updates.dismissed)) return null;
  return (
    <View style={[s.card, { backgroundColor: '#E5F0F2' }]}>
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
  const entries = monthEntries(ledger, month);
  const summary = totals(entries);
  const grouped = groups(ledger, month);
  return (
    <>
      <View style={[s.card, { backgroundColor: palette.navy, padding: 24 }]}>
        <Text style={{ color: '#BFD0E1', fontSize: 15 }}>Saldo do mês</Text>
        <Text style={{ color: 'white', fontSize: 35, fontWeight: '700' }}>
          {money(summary.balance)}
        </Text>
        <Text style={{ color: '#BFD0E1', fontSize: 13 }}>
          Receitas menos despesas, sem saldo anterior
        </Text>
        <View style={[s.wrap, { marginTop: 12 }]}>
          <View style={{ flexGrow: 1, minWidth: '40%', gap: 5 }}>
            <Text style={{ color: '#8AD3C2', fontSize: 14 }}>↗ Receitas</Text>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
              {money(summary.income)}
            </Text>
          </View>
          <View style={{ flexGrow: 1, minWidth: '40%', gap: 5 }}>
            <Text style={{ color: '#F0AC9A', fontSize: 14 }}>↘ Despesas</Text>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>
              {money(summary.expense)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={s.heading}>Despesas por categoria</Text>
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
              style={[s.card, { width: '47%', flexGrow: 1, minWidth: 135 }]}
            >
              <CategoryIcon category={g.category} />
              <Text style={s.text}>{g.category.name}</Text>
              <Text style={[s.heading, { fontSize: 19 }]}>{money(g.cents)}</Text>
              <Text style={s.muted}>{g.percentage.toFixed(1).replace('.', ',')}% dos gastos</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}
function History({
  ledger,
  month,
  selectedCategory,
  onCategory,
  onEdit,
}: {
  ledger: Ledger;
  month: string;
  selectedCategory: string | null;
  onCategory: (id: string | null) => void;
  onEdit: (entry: Entry) => void;
}) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<Kind | null>(null);
  const rows = useMemo(
    () =>
      monthEntries(ledger, month)
        .filter(
          (e) =>
            (!kind || e.kind === kind) &&
            (!selectedCategory || e.categoryId === selectedCategory) &&
            e.description
              .toLocaleLowerCase('pt-BR')
              .includes(search.trim().toLocaleLowerCase('pt-BR')),
        )
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [ledger, month, search, kind, selectedCategory],
  );
  const categories = ledger.categories.filter(
    (c) => !c.archived || monthEntries(ledger, month).some((e) => e.categoryId === c.id),
  );
  return (
    <>
      <Field
        label="Buscar lançamentos"
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar pela descrição"
      />
      <View style={s.wrap}>
        <Chip selected={!kind} onPress={() => setKind(null)}>
          Todos
        </Chip>
        <Chip selected={kind === 'RECEITA'} onPress={() => setKind('RECEITA')}>
          Receitas
        </Chip>
        <Chip selected={kind === 'DESPESA'} onPress={() => setKind('DESPESA')}>
          Despesas
        </Chip>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      >
        <Chip selected={!selectedCategory} onPress={() => onCategory(null)}>
          Todas as categorias
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} selected={selectedCategory === c.id} onPress={() => onCategory(c.id)}>
            {c.name}
            {c.archived ? ' (arquivada)' : ''}
          </Chip>
        ))}
      </ScrollView>
      <Text style={s.muted}>
        {rows.length} lançamento{rows.length !== 1 ? 's' : ''} · saldo filtrado{' '}
        {money(totals(rows).balance)}
      </Text>
      {rows.length === 0 ? (
        <Empty
          title="Nenhum lançamento encontrado"
          text="Tente outro filtro ou adicione um lançamento."
        />
      ) : (
        rows.map((e, i) => {
          const category = ledger.categories.find((c) => c.id === e.categoryId);
          return (
            <React.Fragment key={e.id}>
              {(i === 0 || rows[i - 1].date !== e.date) && (
                <Text style={s.heading}>{dateLabel(e.date)}</Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar ${e.description || category?.name || 'Receita'}, ${money(e.cents)}`}
                onPress={() => onEdit(e)}
                style={[s.card, s.row]}
              >
                {category ? (
                  <CategoryIcon category={category} />
                ) : (
                  <Ionicons name="trending-up" size={30} color={palette.income} />
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[s.text, { fontWeight: '600' }]}>
                    {e.description || category?.name || 'Receita'}
                  </Text>
                  <Text style={s.muted}>
                    {category?.name || 'Receita'}
                    {category?.archived ? ' · arquivada' : ''}
                  </Text>
                  <Text
                    style={{
                      color: e.kind === 'RECEITA' ? palette.income : palette.expense,
                      fontSize: 17,
                      fontWeight: '600',
                    }}
                  >
                    {e.kind === 'RECEITA' ? '+' : '−'} {money(e.cents)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" color={palette.muted} size={20} />
              </Pressable>
            </React.Fragment>
          );
        })
      )}
    </>
  );
}
function Main() {
  const store = useLedger();
  const updates = useUpdates();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [entry, setEntry] = useState<Entry | null | undefined>();
  const [categories, setCategories] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [preview, setPreview] = useState<Ledger | null>(null);
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
              if (saved) Alert.alert('Backup salvo', 'Seus registros foram exportados.');
            } catch (e) {
              Alert.alert('Backup não salvo', errorMessage(e));
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
      setPreview(null);
      Alert.alert('Backup restaurado', 'Os registros foram substituídos pelo backup escolhido.');
    } catch (e) {
      Alert.alert('Restauração não salva', errorMessage(e));
    }
  }
  const chooseTab = (next: Tab) => {
    setTab(next);
    if (next === 'history') setCategoryFilter(null);
  };
  return (
    <SafeAreaView style={s.page} edges={['top']}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#D6EFEB', '#F3F6F8']}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}
      >
        <Text style={s.title}>{title}</Text>
        <Text style={s.muted}>
          {tab === 'home'
            ? 'Sua vida financeira, no seu celular.'
            : tab === 'menu'
              ? 'Tudo sob seu controle.'
              : 'Acompanhe seu mês.'}
        </Text>
        {tab !== 'menu' && (
          <MonthSelector
            month={month}
            onShift={(delta) => {
              const next = shiftMonth(month, delta);
              if (/^\d{4}-\d{2}$/.test(next)) setMonth(next);
            }}
          />
        )}
      </LinearGradient>
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
            {ledger && (
              <Home
                ledger={ledger}
                month={month}
                openHistory={(key) => {
                  setCategoryFilter(key);
                  setTab('history');
                }}
              />
            )}
          </>
        )}
        {tab === 'history' && ledger && (
          <History
            ledger={ledger}
            month={month}
            selectedCategory={categoryFilter}
            onCategory={setCategoryFilter}
            onEdit={setEntry}
          />
        )}
        {tab === 'charts' && ledger && <Charts ledger={ledger} month={month} />}
        {tab === 'menu' && (
          <>
            <View style={s.card}>
              <Text style={s.heading}>Organize seus registros</Text>
              <Button
                secondary
                title="Gerenciar categorias"
                disabled={!ledger || store.busy}
                onPress={() => setCategories(true)}
              />
            </View>
            <View style={s.card}>
              <Text style={s.heading}>Backup manual</Text>
              <Text style={s.text}>
                Desinstalar ou limpar os dados apaga seus registros. Exporte uma cópia para
                recuperá-los depois.
              </Text>
              <Button
                title={backupBusy ? 'Aguarde…' : 'Exportar backup JSON'}
                disabled={!ledger || backupBusy || store.busy}
                onPress={() => void exportBackup()}
              />
              <Button
                secondary
                title="Restaurar backup JSON"
                disabled={backupBusy || store.busy || store.loading}
                onPress={() => void importBackup()}
              />
              <Text style={s.muted}>
                O backup não é criptografado. A restauração substitui todos os registros após sua
                confirmação.
              </Text>
            </View>
            <UpdateCard updates={updates} settings />
            <View style={s.card}>
              <Text style={s.heading}>Privacidade</Text>
              <Text style={s.text}>
                Seus lançamentos e categorias ficam somente neste celular. Sem login, banco de
                dados, sincronização, anúncios ou rastreamento.
              </Text>
              <Text style={s.muted}>
                A internet é usada apenas para buscar versões e baixar APKs do GitHub. Nenhum
                registro financeiro é enviado. O GitHub recebe dados normais de acesso, como IP e
                versão do app.
              </Text>
              <Text style={s.muted}>Meu Saldo {updates.version} · gratuito · Android</Text>
            </View>
          </>
        )}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'white',
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
                style={{
                  backgroundColor: palette.teal,
                  borderRadius: 22,
                  width: 55,
                  height: 55,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: ledger && !store.busy ? 1 : 0.4,
                }}
              >
                <Ionicons name="add" color="white" size={32} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === key }}
              onPress={() => chooseTab(key)}
              style={{ flex: 1, alignItems: 'center', minHeight: 48, paddingVertical: 4, gap: 4 }}
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
          onClose={() => setEntry(undefined)}
          onSave={(value) =>
            store.mutate((l) => ({
              ...l,
              entries: l.entries.some((e) => e.id === value.id)
                ? l.entries.map((e) => (e.id === value.id ? value : e))
                : [...l.entries, value],
            }))
          }
          onDelete={(key) =>
            store.mutate((l) => ({ ...l, entries: l.entries.filter((e) => e.id !== key) }))
          }
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
          <View style={s.card}>
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}
