import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import Native from './native';
import { money as formatMoney } from './finance';
import { errorMessage } from './useLedger';

import { darkColors, Colors } from './theme/palettes';
import { spacing, radius, controlSize, typography } from './theme/tokens';
export type { Colors };
export const createStyles = (p: Colors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: p.background },
    content: { padding: spacing.screen, gap: spacing.card, paddingBottom: spacing.xl },
    card: {
      backgroundColor: p.card,
      padding: spacing.card,
      borderRadius: radius.card,
      gap: spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    title: { ...typography.title, color: p.navy },
    heading: { ...typography.heading, color: p.navy },
    text: { ...typography.body, color: p.navy },
    muted: { ...typography.muted, color: p.muted },
    label: { color: p.navy, fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.card,
      borderRadius: radius.control,
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 17,
      color: p.navy,
      minHeight: controlSize.input,
    },
    button: {
      backgroundColor: p.accent,
      borderRadius: radius.control,
      minHeight: controlSize.touch,
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: p.onAccent,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    chip: {
      maxWidth: '100%',
      borderRadius: radius.control,
      backgroundColor: p.soft,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: controlSize.touch,
      minWidth: controlSize.touch,
      justifyContent: 'center',
    },
    chipSelected: { backgroundColor: p.accent },
    divider: { height: 1, backgroundColor: p.border },
  });
type Preferences = { lastBackup: number; backgroundBackup: boolean; reminderAfter: number };
type AppearanceValue = {
  palette: Colors;
  s: ReturnType<typeof createStyles>;
  dark: boolean;
  lastBackup: number;
  backgroundBackup: boolean;
  money: (cents: number) => string;
  refreshPreferences: () => Promise<void>;
};
const AppearanceContext = createContext<AppearanceValue | null>(null);
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>({
    lastBackup: 0,
    backgroundBackup: false,
    reminderAfter: 0,
  });
  const [ready, setReady] = useState(false);
  const refreshPreferences = async () => {
    setPrefs(await Native.getPreferences());
  };
  useEffect(() => {
    refreshPreferences()
      .catch((e) => Alert.alert('Preferências indisponíveis', errorMessage(e)))
      .finally(() => setReady(true));
  }, []);
  const palette = darkColors;
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <AppearanceContext.Provider
      value={{
        palette,
        s: styles,
        dark: true,
        lastBackup: prefs.lastBackup,
        backgroundBackup: prefs.backgroundBackup,
        money: formatMoney,
        refreshPreferences,
      }}
    >
      {ready ? (
        children
      ) : (
        <View style={{ flex: 1, backgroundColor: palette.background, justifyContent: 'center' }}>
          <ActivityIndicator color={palette.accent} accessibilityLabel="Carregando preferências" />
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
