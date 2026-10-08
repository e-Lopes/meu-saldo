import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Category, civilDate, dateLabel, Entry, today } from './finance';
import { useAppearance } from './Appearance';
import { CategoryIcon } from './ui';

export function historyDateLabel(date: string) {
  const current = today();
  if (date === current) return 'Hoje';
  const yesterday = civilDate(current);
  yesterday.setDate(yesterday.getDate() - 1);
  const previous = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  return date === previous ? 'Ontem' : dateLabel(date);
}

export function LedgerRow({
  entry,
  category,
  onEdit,
}: {
  entry: Entry;
  category?: Category;
  onEdit: (entry: Entry) => void;
}) {
  const { palette, s, money } = useAppearance();
  const { fontScale } = useWindowDimensions();
  const income = entry.kind === 'RECEITA';
  const type = income ? 'Receita' : 'Despesa';
  const title = entry.description || category?.name || type;
  const date = historyDateLabel(entry.date);
  const symbol = income ? '+' : '−';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Editar ${title}, ${type.toLocaleLowerCase('pt-BR')}, ${symbol} ${money(entry.cents)}, ${date}${entry.recurrenceId ? ', recorrente' : ''}`}
      onPress={() => onEdit(entry)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 72,
        backgroundColor: pressed ? palette.selected : palette.background,
        paddingVertical: 8,
        gap: 8,
        opacity: 1,
      })}
    >
      <CategoryIcon category={category ?? { color: 0, colorKey: 'teal', icon: 'savings' }} />
      <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
        <View style={s.row}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[s.text, { fontWeight: '600', flexShrink: 1, minWidth: 0 }]}
          >
            {title}
          </Text>
          {!!entry.recurrenceId && (
            <View
              style={{
                width: 22,
                height: 22,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                backgroundColor: palette.selected,
              }}
            >
              <Ionicons name="repeat-outline" size={18} color={palette.accent} />
            </View>
          )}
        </View>
        <Text numberOfLines={1} ellipsizeMode="tail" style={s.muted}>
          {category?.name ?? 'Sem categoria'}
          {category?.archived ? ' · arquivada' : ''}
        </Text>
      </View>
      <View
        style={{
          minWidth: 104,
          flexShrink: 0,
          maxWidth: fontScale > 1.2 ? '48%' : '42%',
          alignItems: 'flex-end',
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={[
            s.text,
            {
              textAlign: 'right',
              fontWeight: '600',
              fontVariant: ['tabular-nums'],
              color: income ? palette.income : palette.expense,
            },
          ]}
        >
          {symbol} {money(entry.cents)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={palette.muted} />
    </Pressable>
  );
}
