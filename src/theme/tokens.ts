import type { TextStyle } from 'react-native';
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  card: 18,
  screen: 20,
  xl: 24,
  xxl: 32,
} as const;
export const radius = { sm: 8, control: 14, card: 20, pill: 999 } as const;
export const controlSize = { touch: 48, input: 50, add: 55 } as const;
export const typography = {
  title: { fontSize: 23, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  muted: { fontSize: 14, lineHeight: 21 },
  action: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 20, fontWeight: '600', fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;
