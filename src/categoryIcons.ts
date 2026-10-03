import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export const categoryIconOptions = [
  { value: '🍴', label: 'Alimentação', glyph: 'restaurant-outline' },
  { value: '🚗', label: 'Transporte', glyph: 'car-outline' },
  { value: '🏠', label: 'Casa', glyph: 'home-outline' },
  { value: '🎬', label: 'Lazer', glyph: 'film-outline' },
  { value: '●', label: 'Outros', glyph: 'shapes-outline' },
  { value: '💼', label: 'Trabalho', glyph: 'briefcase-outline' },
  { value: '🛒', label: 'Compras', glyph: 'cart-outline' },
  { value: '❤', label: 'Saúde', glyph: 'heart-outline' },
  { value: 'education', label: 'Educação', glyph: 'school-outline' },
  { value: 'pets', label: 'Pets', glyph: 'paw-outline' },
  { value: 'travel', label: 'Viagens', glyph: 'airplane-outline' },
  { value: 'fitness', label: 'Academia', glyph: 'barbell-outline' },
  { value: 'coffee', label: 'Café', glyph: 'cafe-outline' },
  { value: 'gifts', label: 'Presentes', glyph: 'gift-outline' },
  { value: 'games', label: 'Jogos', glyph: 'game-controller-outline' },
  { value: 'music', label: 'Música', glyph: 'musical-notes-outline' },
  { value: 'phone', label: 'Telefone', glyph: 'phone-portrait-outline' },
  { value: 'internet', label: 'Internet', glyph: 'wifi-outline' },
  { value: 'utilities', label: 'Energia', glyph: 'flash-outline' },
  { value: 'water', label: 'Água', glyph: 'water-outline' },
  { value: 'clothes', label: 'Roupas', glyph: 'shirt-outline' },
  { value: 'beauty', label: 'Beleza', glyph: 'cut-outline' },
  { value: 'tools', label: 'Manutenção', glyph: 'construct-outline' },
  { value: 'savings', label: 'Economias', glyph: 'wallet-outline' },
] satisfies { value: string; label: string; glyph: ComponentProps<typeof Ionicons>['name'] }[];

// Includes joined families, skin tones, flags and keycaps as a single emoji.
const emojiPart =
  '(?:\\p{Extended_Pictographic}\\uFE0F?\\p{Emoji_Modifier}?|\\p{Regional_Indicator}{2}|[0-9#*]\\uFE0F?\\u20E3)';
const emojiPattern = new RegExp(
  `^${emojiPart}(?:\\u200D${emojiPart})*(?:[\\u{E0020}-\\u{E007E}]+\\u{E007F})?$`,
  'u',
);
export const isCategoryEmoji = (value: string) => value.length <= 32 && emojiPattern.test(value);
export const isCategoryIcon = (value: string) =>
  categoryIconOptions.some((option) => option.value === value) ||
  (value.startsWith('emoji:') && isCategoryEmoji(value.slice(6)));
