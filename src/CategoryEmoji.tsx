import { requireNativeViewManager } from 'expo-modules-core';
import { processColor, StyleProp, ViewStyle } from 'react-native';

const EmojiView = requireNativeViewManager<{
  value: string;
  input?: boolean;
  editable?: boolean;
  textColor?: ReturnType<typeof processColor>;
  fontSize: number;
  style?: StyleProp<ViewStyle>;
  onChangeText?: (event: { nativeEvent: { text: string } }) => void;
}>('MeuSaldoNative');

export function CategoryEmoji({
  value,
  size,
  input = false,
  editable = true,
  color,
  onChangeText,
  style,
}: {
  value: string;
  size: number;
  input?: boolean;
  editable?: boolean;
  color?: string;
  onChangeText?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <EmojiView
      value={value}
      fontSize={size}
      input={input}
      editable={editable}
      textColor={processColor(color)}
      style={style}
      onChangeText={(event) => onChangeText?.(event.nativeEvent.text)}
    />
  );
}
