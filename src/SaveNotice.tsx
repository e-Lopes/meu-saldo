import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useAppearance } from './Appearance';
import { spacing } from './theme/tokens';

export function SaveNotice({
  event,
  message,
  show = true,
}: {
  event: number;
  message: string;
  show?: boolean;
}) {
  const { palette } = useAppearance();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!event) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [event]);
  if (!visible || !show) return null;
  return (
    <View style={{ backgroundColor: palette.selected, padding: spacing.md }}>
      <Text style={{ color: palette.accent, textAlign: 'center', fontWeight: '600' }}>
        {message}
      </Text>
    </View>
  );
}
