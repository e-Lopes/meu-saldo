import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppearance } from './Appearance';
import { spacing, controlSize } from './theme/tokens';

export function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  expanded,
  disabled = false,
  highlight = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  onPress: () => void;
  expanded?: boolean;
  disabled?: boolean;
  highlight?: boolean;
}) {
  const { palette, s } = useAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, ...(expanded === undefined ? {} : { expanded }) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        {
          minHeight: controlSize.touch,
          paddingVertical: spacing.sm,
          backgroundColor: pressed || expanded ? palette.selected : 'transparent',
          borderRadius: 8,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={23} color={highlight ? palette.accent : palette.muted} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={[s.text, { fontWeight: '600' }]}>{title}</Text>
        {!!subtitle && <Text style={s.muted}>{subtitle}</Text>}
      </View>
      <Ionicons
        name={expanded === undefined ? 'chevron-forward' : expanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={palette.muted}
      />
    </Pressable>
  );
}
