import { useState } from 'react';
import { AlertButton, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from './Appearance';
import { Button } from './ui';

type SheetButton = AlertButton & { detail?: string };

export function useSheetDialog() {
  const { palette, s } = useAppearance();
  const [prompt, setPrompt] = useState<{
    title: string;
    message: string;
    buttons: SheetButton[];
  } | null>(null);
  const [selected, setSelected] = useState(0);
  function alert(
    title: string,
    message: string,
    buttons: SheetButton[],
    _options?: { cancelable?: boolean },
  ) {
    setSelected(0);
    setPrompt({ title, message, buttons });
  }
  const cancel = prompt?.buttons.find((button) => button.style === 'cancel');
  const actions = prompt?.buttons.filter((button) => button.style !== 'cancel') ?? [];
  function choose(button?: AlertButton) {
    setPrompt(null);
    button?.onPress?.();
  }
  const dialog = (
    <Modal
      visible={!!prompt}
      transparent
      animationType="slide"
      onRequestClose={() => choose(cancel)}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}>
        <SafeAreaView
          style={{
            backgroundColor: palette.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 16,
            maxHeight: '85%',
          }}
        >
          <ScrollView contentContainerStyle={{ gap: 16 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: palette.border,
                alignSelf: 'center',
                marginBottom: 8,
              }}
            />
            <Text accessibilityRole="header" style={s.title}>
              {prompt?.title}
            </Text>
            <Text style={s.muted}>{prompt?.message}</Text>
            {actions.length > 1 &&
              actions.map((button, index) => (
                <Pressable
                  key={button.text}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected === index }}
                  onPress={() => setSelected(index)}
                  style={[
                    s.row,
                    {
                      minHeight: 56,
                      padding: 16,
                      borderRadius: 14,
                      backgroundColor: selected === index ? palette.selected : palette.background,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24, color: palette.accent }}>
                    {selected === index ? '◉' : '○'}
                  </Text>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={s.text}>{button.text}</Text>
                    {!!button.detail && <Text style={s.muted}>{button.detail}</Text>}
                  </View>
                </Pressable>
              ))}
            <Button
              title={actions.length > 1 ? 'Aplicar alterações' : (actions[0]?.text ?? 'Confirmar')}
              danger={actions[selected]?.style === 'destructive'}
              onPress={() => choose(actions[selected])}
            />
            <Button secondary title={cancel?.text ?? 'Cancelar'} onPress={() => choose(cancel)} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
  return { alert, dialog };
}
