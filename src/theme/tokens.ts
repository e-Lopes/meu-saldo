import type { TextStyle } from 'react-native';
export const spacing = {
  xs: 8,
  sm: 8,
  md: 16,
  lg: 16,
  card: 16,
  screen: 16,
  xl: 24,
} as const;
export const radius = { control: 14, card: 20 } as const;
export const controlSize = { touch: 48, input: 50, add: 55 } as const;
export const typography = {
  title: { fontSize: 23, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24 },
  muted: { fontSize: 13, lineHeight: 20 },
  amount: { fontSize: 20, fontWeight: '600', fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;
