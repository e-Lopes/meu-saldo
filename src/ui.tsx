import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Category, categoryColor, monthName } from './finance';

export const palette = {
  teal: '#328D8A',
  navy: '#17304F',
  background: '#F3F6F8',
  muted: '#667487',
  border: '#DEE6EC',
  expense: '#C75E58',
  income: '#25877B',
};
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  content: { padding: 20, gap: 18, paddingBottom: 30 },
  card: { backgroundColor: 'white', padding: 18, borderRadius: 20, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  title: { color: palette.navy, fontSize: 23, fontWeight: '700' },
  heading: { color: palette.navy, fontSize: 18, fontWeight: '700' },
  text: { color: palette.navy, fontSize: 15, lineHeight: 22 },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  label: { color: palette.navy, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 17,
    color: palette.navy,
    minHeight: 50,
  },
  button: {
    backgroundColor: palette.teal,
    borderRadius: 14,
    minHeight: 48,
    padding: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: { borderColor: palette.teal, backgroundColor: '#E5F3F0' },
  divider: { height: 1, backgroundColor: palette.border },
});
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        secondary && { backgroundColor: '#EAF0F4' },
        danger && { backgroundColor: '#FBEDEB' },
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text
        style={[
          s.buttonText,
          secondary && { color: palette.navy },
          danger && { color: palette.expense },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        {
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.5 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={25} color={palette.navy} />
    </Pressable>
  );
}
export function Chip({
  children,
  selected,
  onPress,
}: {
  children: ReactNode;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[s.chip, selected && s.chipSelected]}
    >
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        {React.Children.map(children, (child) =>
          typeof child === 'string' || typeof child === 'number' ? (
            <Text style={[s.text, selected && { color: palette.teal, fontWeight: '600' }]}>
              {child}
            </Text>
          ) : (
            child
          ),
        )}
      </View>
    </Pressable>
  );
}
const categoryIcons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  '🍴': 'restaurant-outline',
  '🚗': 'car-outline',
  '🏠': 'home-outline',
  '🎬': 'film-outline',
  '●': 'shapes-outline',
  '💼': 'briefcase-outline',
  '🛒': 'cart-outline',
  '❤': 'heart-outline',
};
export function CategoryIcon({
  category,
  size = 42,
}: {
  category: Pick<Category, 'color' | 'icon'>;
  size?: number;
}) {
  const color = categoryColor(category.color);
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color + '22',
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name={categoryIcons[category.icon] ?? 'shapes-outline'}
        size={size * 0.55}
        color={color}
      />
    </View>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={palette.muted}
        {...props}
        style={[s.input, props.style]}
      />
    </View>
  );
}
export function MonthSelector({
  month,
  onShift,
}: {
  month: string;
  onShift: (delta: number) => void;
}) {
  return (
    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <IconButton icon="chevron-back" label="Mês anterior" onPress={() => onShift(-1)} />
      <Text style={[s.heading, { flex: 1, textAlign: 'center', textTransform: 'capitalize' }]}>
        {monthName(month)}
      </Text>
      <IconButton icon="chevron-forward" label="Próximo mês" onPress={() => onShift(1)} />
    </View>
  );
}
export function Empty({
  title = 'Tudo pronto para começar',
  text = 'Adicione seu primeiro lançamento no botão +.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <View style={[s.card, { alignItems: 'center', paddingVertical: 30 }]}>
      <Ionicons name="wallet-outline" color={palette.teal} size={40} />
      <Text style={[s.heading, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}
