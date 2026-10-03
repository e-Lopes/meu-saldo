import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Alert, StyleSheet, useColorScheme, View } from 'react-native';
import Native from './native';
import { money as formatMoney } from './finance';
import { errorMessage } from './useLedger';

import { lightColors, darkColors, Colors } from './theme/palettes';
import { spacing, radius, controlSize, typography } from './theme/tokens';
export { lightColors, darkColors };
export type { Colors };
export const createStyles = (p: Colors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: p.background },
    content: { padding: spacing.screen, gap: spacing.card, paddingBottom: 30 },
    card: {
      backgroundColor: p.card,
      padding: spacing.card,
      borderRadius: radius.card,
      gap: spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    title: { ...typography.title, color: p.navy },
    heading: { ...typography.heading, color: p.navy },
    text: { ...typography.body, color: p.navy },
    muted: { ...typography.muted, color: p.muted },
    label: { color: p.navy, fontSize: 15, fontWeight: '600', marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.card,
      borderRadius: radius.control,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 17,
      color: p.navy,
      minHeight: controlSize.input,
    },
    button: {
      backgroundColor: p.teal,
      borderRadius: radius.control,
      minHeight: controlSize.touch,
      padding: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: p.background === lightColors.background ? '#FFFFFF' : '#102D2A',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    chip: {
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.card,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: controlSize.touch,
      justifyContent: 'center',
    },
    chipSelected: { borderColor: p.teal, backgroundColor: p.selected },
    divider: { height: 1, backgroundColor: p.border },
  });
type Mode = 'system' | 'light' | 'dark';
type Preferences = { theme: Mode; hidden: boolean; lastBackup: number };
type AppearanceValue = {
  palette: Colors;
  s: ReturnType<typeof createStyles>;
  dark: boolean;
  hidden: boolean;
  theme: Mode;
  lastBackup: number;
  saving: boolean;
  money: (cents: number) => string;
  setTheme: (theme: Mode) => Promise<void>;
  toggleHidden: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
};
const AppearanceContext = createContext<AppearanceValue | null>(null);
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [prefs, setPrefs] = useState<Preferences>({ theme: 'system', hidden: true, lastBackup: 0 });
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const refreshPreferences = async () => {
    setPrefs(await Native.getPreferences());
  };
  useEffect(() => {
    refreshPreferences()
      .catch((e) => Alert.alert('Preferências indisponíveis', errorMessage(e)))
      .finally(() => setReady(true));
  }, []);
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && system === 'dark');
  const palette = dark ? darkColors : lightColors;
  const styles = useMemo(() => createStyles(palette), [palette]);
  const save = async (key: 'theme' | 'hidden', value: string) => {
    setPending((n) => n + 1);
    const job = queue.current
      .catch(() => {})
      .then(async () => {
        await Native.setPreference(key, value);
        await refreshPreferences();
      })
      .catch((e) => Alert.alert('Preferência não salva', errorMessage(e)))
      .finally(() => setPending((n) => n - 1));
    queue.current = job;
    await job;
  };
  return (
    <AppearanceContext.Provider
      value={{
        palette,
        s: styles,
        dark,
        hidden: prefs.hidden,
        theme: prefs.theme,
        lastBackup: prefs.lastBackup,
        saving: pending > 0,
        money: (cents) => (prefs.hidden ? '••••' : formatMoney(cents)),
        setTheme: (mode) => save('theme', mode),
        toggleHidden: () => save('hidden', String(!prefs.hidden)),
        refreshPreferences,
      }}
    >
      {ready ? (
        children
      ) : (
        <View style={{ flex: 1, backgroundColor: palette.background, justifyContent: 'center' }}>
          <ActivityIndicator color={palette.teal} accessibilityLabel="Carregando preferências" />
        </View>
      )}
    </AppearanceContext.Provider>
  );
}
export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('AppearanceProvider ausente.');
  return context;
}
