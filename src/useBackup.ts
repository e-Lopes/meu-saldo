import { useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { decode, encode, Ledger, today, backupDue } from './finance';
import Native from './native';
import { errorMessage, useLedger } from './useLedger';

export function useBackup(
  store: ReturnType<typeof useLedger>,
  refreshPreferences: () => Promise<void>,
  onRestored: () => void,
  canPrompt = true,
) {
  const [backgroundSavedEvent, setBackgroundSavedEvent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Ledger | null>(null);
  const active = useRef(false);
  const sessionChecked = useRef(false);
  const latest = useRef({ store, canPrompt, preview });
  latest.current = { store, canPrompt, preview };
  async function saveBackground() {
    const ledger = latest.current.store.ledger;
    if (!ledger || !start()) return;
    try {
      await Native.backgroundBackup(encode(ledger));
      await refreshPreferences();
      setBackgroundSavedEvent((event) => event + 1);
    } catch (error) {
      Alert.alert('Backup não salvo', `${errorMessage(error)} Confira a pasta em Ajustes.`);
    } finally {
      finish();
    }
  }
  async function configureBackground() {
    if (!start()) return;
    try {
      const selected = await Native.chooseBackupFolder();
      if (selected) {
        const ledger = latest.current.store.ledger;
        if (ledger) await Native.backgroundBackup(encode(ledger));
        await refreshPreferences();
        Alert.alert(
          'Backup automático ativado',
          'Cópia salva. A cada três meses, ao abrir o app, uma nova cópia será gravada nesta pasta.',
        );
      }
    } catch (error) {
      Alert.alert('Backup não configurado', errorMessage(error));
    } finally {
      finish();
    }
  }
  function enableBackground() {
    Alert.alert(
      'Backup em segundo plano',
      'Escolha uma pasta para autorizar a gravação. A primeira cópia será salva agora; as próximas, ao abrir o app após três meses. Os arquivos contêm seus dados e não têm senha.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Escolher pasta', onPress: () => void configureBackground() },
      ],
    );
  }
  async function checkReminder() {
    const state = latest.current;
    if (
      sessionChecked.current ||
      active.current ||
      state.store.busy ||
      state.store.loading ||
      !state.canPrompt ||
      state.preview ||
      !state.store.ledger?.entries.length ||
      AppState.currentState !== 'active'
    )
      return;
    sessionChecked.current = true;
    try {
      const prefs = await Native.getPreferences();
      if (!backupDue(prefs.lastBackup)) return;
      if (prefs.backgroundBackup) {
        await saveBackground();
        return;
      }
      if (prefs.reminderAfter > Date.now() || !latest.current.canPrompt) return;
      Alert.alert(
        'Proteja seus registros',
        prefs.lastBackup
          ? 'Já passaram três meses desde o último backup. Quer criar uma nova cópia?'
          : 'Crie um arquivo de backup para recuperar seus registros se trocar de celular.',
        [
          {
            text: 'Depois',
            style: 'cancel',
            onPress: () => {
              void Native.postponeBackup().catch((error) =>
                Alert.alert('Lembrete não adiado', errorMessage(error)),
              );
            },
          },
          { text: 'Em segundo plano', onPress: enableBackground },
          { text: 'Fazer agora', onPress: exportBackup },
        ],
        { cancelable: false },
      );
    } catch (error) {
      Alert.alert('Backup indisponível', errorMessage(error));
    }
  }
  useEffect(() => {
    void checkReminder();
  }, [store.loading, store.busy, store.ledger, canPrompt]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sessionChecked.current = false;
        void checkReminder();
      }
    });
    return () => subscription.remove();
  }, []);
  async function disableBackground() {
    try {
      await Native.disableBackgroundBackup();
      await refreshPreferences();
    } catch (error) {
      Alert.alert('Alteração não salva', errorMessage(error));
    }
  }
  function start() {
    if (active.current || latest.current.store.busy) return false;
    active.current = true;
    setBusy(true);
    return true;
  }
  function finish() {
    active.current = false;
    setBusy(false);
  }
  function exportBackup() {
    const ledger = latest.current.store.ledger;
    if (!ledger || latest.current.preview || !start()) return;
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
    backgroundSavedEvent,
    preview,
    exportBackup,
    enableBackground,
    disableBackground,
    importBackup,
    restoreBackup,
    cancelPreview: () => {
      if (!active.current && !store.busy) setPreview(null);
    },
  };
}
