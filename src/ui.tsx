import React, { ReactNode } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { categoryIconOptions } from './categoryIcons';
import { Category, categoryColor, monthName, today } from './finance';

import { useAppearance } from './Appearance';
import { spacing, radius, controlSize, typography } from './theme/tokens';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { s } = useAppearance();
  return <View style={[s.card, style]}>{children}</View>;
}
export function SectionHeader({ children }: { children: ReactNode }) {
  const { s } = useAppearance();
  return (
    <Text accessibilityRole="header" style={s.heading}>
      {children}
    </Text>
  );
}
export function MetricCard({
  label,
  value,
  tone,
  stacked,
}: {
  label: string;
  value: string;
  tone: 'income' | 'expense';
  stacked?: boolean;
}) {
  const { palette, s } = useAppearance();
  const { width, fontScale } = useWindowDimensions();
  const fullWidth = stacked ?? (width < 360 || fontScale > 1.2);
  return (
    <Card
      style={{
        flexGrow: 1,
        flexBasis: fullWidth ? '100%' : 130,
        backgroundColor: palette.soft,
        borderWidth: 1,
        borderColor: palette.border,
        gap: spacing.xs,
      }}
    >
      <Text style={[s.muted, { color: palette[tone] }]}>{label}</Text>
      <Text style={[typography.amount, { color: palette[tone] }]}>{value}</Text>
    </Card>
  );
}
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled = false,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
}) {
  const { palette, s } = useAppearance();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  return (
    <View
      accessibilityLabel={label}
      style={{
        flexDirection: stacked ? 'column' : 'row',
        backgroundColor: palette.soft,
        borderRadius: radius.control,
        padding: spacing.xs,
        gap: spacing.xs,
      }}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityLabel={option.label}
          accessibilityState={{ selected: value === option.value, disabled }}
          disabled={disabled}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => ({
            flex: stacked ? undefined : 1,
            minHeight: controlSize.touch,
            justifyContent: 'center',
            padding: spacing.sm,
            borderRadius: radius.control,
            backgroundColor: value === option.value ? palette.selected : 'transparent',
            opacity: disabled ? 0.45 : pressed ? 0.65 : 1,
          })}
        >
          <Text
            style={[
              s.text,
              {
                textAlign: 'center',
                color: value === option.value ? palette.accent : palette.navy,
                fontWeight: value === option.value ? '700' : '400',
              },
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  danger = false,
  expanded,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  expanded?: boolean;
}) {
  const { palette, s } = useAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, ...(expanded === undefined ? {} : { expanded }) }}
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
  const { palette } = useAppearance();
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
            <Text
              style={[
                s.text,
                { flexShrink: 1 },
                selected && { color: palette.accent, fontWeight: '600' },
              ]}
            >
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
export function CategoryIcon({
  category,
  size = 42,
}: {
  category: Pick<Category, 'color' | 'icon'>;
  size?: number;
}) {
  const { palette } = useAppearance();
  const color = categoryColor(category.color);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        backgroundColor: color + '22',
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {category.icon.startsWith('emoji:') ? (
        <Text allowFontScaling={false} style={{ fontSize: size * 0.55 }}>
          {category.icon.slice(6)}
        </Text>
      ) : (
        <Ionicons
          name={
            categoryIconOptions.find((option) => option.value === category.icon)?.glyph ??
            'shapes-outline'
          }
          size={size * 0.55}
          color={palette.navy}
        />
      )}
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
        selectionColor={palette.accent}
        cursorColor={palette.accent}
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
  const { s } = useAppearance();
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
  actionLabel,
  onAction,
}: {
  title?: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { palette, s } = useAppearance();
  return (
    <View style={[s.card, { alignItems: 'center', paddingVertical: 30 }]}>
      <Ionicons name="wallet-outline" color={palette.accent} size={40} />
      <Text style={[s.heading, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>{text}</Text>
      {!!actionLabel && onAction && <Button title={actionLabel} onPress={onAction} />}
    </View>
  );
}
