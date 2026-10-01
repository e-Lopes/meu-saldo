import React, { ReactNode } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Category, categoryColor, monthName, today } from './finance';

import { useAppearance } from './Appearance';

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
  const { palette, s } = useAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        secondary && { backgroundColor: palette.soft },
        danger && { backgroundColor: palette.soft },
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
  disabled = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { palette, s } = useAppearance();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        {
          minWidth: 48,
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.5 : 1,
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
  label,
  disabled = false,
}: {
  children: ReactNode;
  selected?: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
}) {
  const { palette, s } = useAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        selected && s.chipSelected,
        { opacity: disabled ? 0.4 : pressed ? 0.65 : 1 },
      ]}
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
  const { palette, s } = useAppearance();
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
        color={palette.navy}
      />
    </View>
  );
}
export function Field({
  label,
  error,
  helper,
  inputRef,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  helper?: string;
  inputRef?: React.Ref<TextInput>;
}) {
  const { palette, s } = useAppearance();
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        placeholderTextColor={palette.muted}
        {...props}
        style={[s.input, error ? { borderColor: palette.expense } : null, props.style]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={[s.muted, { color: palette.expense, marginTop: 6 }]}>
          {error}
        </Text>
      )}
      {!!helper && !error && <Text style={[s.muted, { marginTop: 6 }]}>{helper}</Text>}
    </View>
  );
}
export function MonthSelector({
  month,
  onShift,
  onCurrent,
}: {
  month: string;
  onShift: (delta: number) => void;
  onCurrent: () => void;
}) {
  const { palette, s } = useAppearance();
  return (
    <View>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <IconButton icon="chevron-back" label="Mês anterior" onPress={() => onShift(-1)} />
        <Text style={[s.heading, { flex: 1, textAlign: 'center' }]}>
          {monthName(month).replace(/^./, (first) => first.toLocaleUpperCase('pt-BR'))}
        </Text>
        <IconButton icon="chevron-forward" label="Próximo mês" onPress={() => onShift(1)} />
      </View>
      {month !== today().slice(0, 7) && (
        <Button secondary title="Voltar ao mês atual" onPress={onCurrent} />
      )}
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
  const { palette, s } = useAppearance();
  return (
    <View style={[s.card, { alignItems: 'center', paddingVertical: 30 }]}>
      <Ionicons name="wallet-outline" color={palette.teal} size={40} />
      <Text style={[s.heading, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}
