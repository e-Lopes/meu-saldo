import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppearance } from './Appearance';
import { controlSize, radius, spacing } from './theme/tokens';

export type Tab = 'home' | 'history' | 'charts' | 'menu';
const tabs = {
  home: { icon: 'home-outline', label: 'Início' },
  history: { icon: 'list-outline', label: 'Histórico' },
  charts: { icon: 'bar-chart-outline', label: 'Gráficos' },
  menu: { icon: 'menu-outline', label: 'Menu' },
} as const;
export function BottomNavigation({
  tab,
  onSelect,
  onAdd,
  addDisabled,
}: {
  tab: Tab;
  onSelect: (tab: Tab) => void;
  onAdd: () => void;
  addDisabled: boolean;
}) {
  const { palette } = useAppearance();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.card,
        borderTopWidth: 1,
        borderColor: palette.border,
        paddingTop: spacing.sm,
        paddingBottom: Math.max(spacing.md, insets.bottom),
        paddingHorizontal: spacing.xs,
      }}
    >
      {(['home', 'history', 'add', 'charts', 'menu'] as const).map((key) =>
        key === 'add' ? (
          <View key={key} style={{ flex: 1, alignItems: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Adicionar lançamento"
              accessibilityState={{ disabled: addDisabled }}
              disabled={addDisabled}
              onPress={onAdd}
              style={({ pressed }) => ({
                backgroundColor: palette.accent,
                borderRadius: radius.card,
                width: controlSize.add,
                height: controlSize.add,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: addDisabled ? 0.4 : pressed ? 0.65 : 1,
              })}
            >
              <Ionicons name="add" color={palette.onAccent} size={32} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityLabel={tabs[key].label}
            accessibilityState={{ selected: tab === key }}
            onPress={() => onSelect(key)}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              minHeight: controlSize.touch,
              paddingVertical: spacing.xs,
              gap: spacing.xs,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Ionicons
              name={tabs[key].icon}
              size={23}
              color={tab === key ? palette.accent : palette.muted}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: tab === key ? '700' : '400',
                color: tab === key ? palette.accent : palette.muted,
                textAlign: 'center',
              }}
            >
              {tabs[key].label}
            </Text>
          </Pressable>
        ),
      )}
    </View>
  );
}
