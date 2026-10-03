import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Category, Entry } from './finance';
import { useAppearance } from './Appearance';
import { CategoryIcon } from './ui';
import { spacing, typography } from './theme/tokens';

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
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 400 || fontScale > 1.2;
  const title = entry.description || category?.name || 'Receita';
  const amount = (
    <Text
      style={[
        typography.amount,
        { fontSize: 17, color: entry.kind === 'RECEITA' ? palette.income : palette.expense },
      ]}
    >
      {entry.kind === 'RECEITA' ? '+' : '−'} {money(entry.cents)}
    </Text>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Editar ${title}, ${entry.kind === 'RECEITA' ? 'receita' : 'despesa'}, ${money(entry.cents)}`}
      onPress={() => onEdit(entry)}
      style={({ pressed }) => [
        s.card,
        s.row,
        { marginBottom: spacing.md, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {category ? (
        <CategoryIcon category={category} />
      ) : (
        <Ionicons name="trending-up" size={30} color={palette.income} />
      )}
      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
        <Text style={[s.text, { fontWeight: '600' }]}>{title}</Text>
        <Text style={s.muted}>
          {category?.name || 'Receita'}
          {category?.archived ? ' · arquivada' : ''}
        </Text>
        {stacked && amount}
      </View>
      {!stacked && <View style={{ maxWidth: '45%', alignItems: 'flex-end' }}>{amount}</View>}
      <Ionicons name="chevron-forward" color={palette.muted} size={20} />
    </Pressable>
  );
}
