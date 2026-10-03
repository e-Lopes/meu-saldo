import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { decode, encode, Ledger, today } from './finance';
import Native from './native';
import { errorMessage, useLedger } from './useLedger';

export function useBackup(
  store: ReturnType<typeof useLedger>,
  refreshPreferences: () => Promise<void>,
  onRestored: () => void,
) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Ledger | null>(null);
  const active = useRef(false);
  function start() {
    if (active.current || store.busy) return false;
    active.current = true;
    setBusy(true);
    return true;
  }
  function finish() {
    active.current = false;
    setBusy(false);
  }
  function exportBackup() {
    const ledger = store.ledger;
    if (!ledger || preview || !start()) return;
    Alert.alert(
      'Exportar backup',
      'A cópia contém seus registros financeiros e não é protegida por senha. Guarde o arquivo em um lugar seguro.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: finish },
        {
          text: 'Escolher destino',
          onPress: async () => {
            try {
              const saved = await Native.exportBackup(encode(ledger), `meu-saldo-${today()}.json`);
              if (saved) {
                await refreshPreferences();
                Alert.alert('Backup salvo', 'Seus registros foram exportados.');
              }
            } catch (error) {
              Alert.alert(
                errorMessage(error).includes('A cópia foi salva')
                  ? 'Cópia salva com aviso'
                  : 'Backup não salvo',
                errorMessage(error),
              );
            } finally {
              finish();
            }
          },
        },
      ],
      { cancelable: false },
    );
  }
  async function importBackup() {
    if (preview || !start()) return;
    try {
      const text = await Native.importBackup();
      if (text !== null) setPreview(decode(text));
    } catch (error) {
      Alert.alert(
        'Backup inválido',
        `${errorMessage(error)} Seus registros atuais foram preservados.`,
      );
    } finally {
      finish();
    }
  }
  async function restoreBackup() {
    if (!preview || !start()) return;
    try {
      await store.restore(preview);
      onRestored();
      setPreview(null);
      Alert.alert('Backup restaurado', 'Os registros foram substituídos pelo backup escolhido.');
    } catch (error) {
      Alert.alert('Restauração não salva', errorMessage(error));
    } finally {
      finish();
    }
  }
  return {
    busy,
    preview,
    exportBackup,
    importBackup,
    restoreBackup,
    cancelPreview: () => {
      if (!active.current && !store.busy) setPreview(null);
    },
  };
}
