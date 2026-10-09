import React, { ReactNode } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
  StyleProp,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CategoryEmoji } from './CategoryEmoji';
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
  onPress,
}: {
  label: string;
  value: string;
  tone: 'income' | 'expense';
  stacked?: boolean;
  onPress?: () => void;
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
        gap: spacing.xs,
      }}
    >
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${label}: ${value}${onPress ? '. Ver lançamentos.' : ''}`}
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => ({ minHeight: 48, gap: spacing.xs, opacity: pressed ? 0.65 : 1 })}
      >
        <Text style={[s.muted, { color: palette[tone] }]}>{label}</Text>
        <Text style={[typography.amount, { color: palette[tone] }]}>
          {tone === 'income' ? '+' : '−'} {value}
        </Text>
      </Pressable>
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
            backgroundColor:
              value === option.value ? palette.accent : pressed ? palette.selected : 'transparent',
            opacity: disabled ? 0.45 : 1,
          })}
        >
          <Text
            style={[
              s.text,
              {
                textAlign: 'center',
                color: value === option.value ? palette.onAccent : palette.navy,
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
        secondary && { backgroundColor: pressed ? palette.selected : palette.soft },
        danger && { backgroundColor: pressed ? palette.selected : palette.soft },
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
          backgroundColor: pressed ? palette.selected : 'transparent',
          borderRadius: radius.control,
          opacity: disabled ? 0.4 : 1,
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
        !selected && pressed && { backgroundColor: palette.selected },
        { opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <View style={[s.row, { justifyContent: 'center', minWidth: 0 }]}>
        {React.Children.map(children, (child) =>
          typeof child === 'string' && !child.trim() ? null : typeof child === 'string' ||
            typeof child === 'number' ? (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                s.text,
                { flexShrink: 1, textAlign: 'center' },
                selected && { color: palette.onAccent, fontWeight: '600' },
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
  size = 36,
}: {
  category: Pick<Category, 'color' | 'colorKey' | 'icon'>;
  size?: number;
}) {
  const { dark, palette } = useAppearance();
  const color = categoryColor(category, dark);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: palette.card,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: color + (dark ? '22' : '10'), borderRadius: 8 },
        ]}
      />
      {category.icon.startsWith('emoji:') ? (
        <CategoryEmoji
          value={category.icon.slice(6)}
          size={size * 0.5}
          style={{ width: size, height: size }}
        />
      ) : (
        <Ionicons
          name={
            categoryIconOptions.find((option) => option.value === category.icon)?.glyph ??
            'shapes-outline'
          }
          size={size * 0.5}
          color={color}
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
  hideLabel = false,
  emoji = false,
  formattedValue,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  helper?: string;
  inputRef?: React.Ref<TextInput>;
  hideLabel?: boolean;
  emoji?: boolean;
  formattedValue?: string;
}) {
  const { palette, s } = useAppearance();
  return (
    <View>
      {!hideLabel && <Text style={s.label}>{label}</Text>}
      {emoji ? (
        <View
          style={[
            s.input,
            error ? { borderColor: palette.expense } : null,
            { justifyContent: 'center' },
          ]}
        >
          <CategoryEmoji
            input
            value={props.value ?? ''}
            size={22}
            color={palette.navy}
            editable={props.editable}
            onChangeText={props.onChangeText}
            style={{ height: 40, width: '100%' }}
          />
        </View>
      ) : formattedValue !== undefined ? (
        <View>
          <TextInput
            ref={inputRef}
            accessibilityLabel={label}
            {...props}
            caretHidden
            selectionColor="transparent"
            cursorColor="transparent"
            style={[
              s.input,
              error ? { borderColor: palette.expense } : null,
              props.style,
              { color: 'transparent' },
            ]}
          />
          {/* Native keystrokes stay hidden until the formatted value is ready. */}
          <View
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              left: 17,
              right: 17,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[{ fontSize: s.input.fontSize, color: palette.navy }, props.style]}
            >
              {formattedValue}
            </Text>
          </View>
        </View>
      ) : (
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          placeholderTextColor={palette.muted}
          selectionColor={palette.accent}
          cursorColor={palette.accent}
          {...props}
          style={[s.input, error ? { borderColor: palette.expense } : null, props.style]}
        />
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={[s.muted, { color: palette.expense, marginTop: 8 }]}>
          {error}
        </Text>
      )}
      {!!helper && !error && <Text style={[s.muted, { marginTop: 8 }]}>{helper}</Text>}
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
