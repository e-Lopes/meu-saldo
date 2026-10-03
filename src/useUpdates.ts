import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import Native, { Release } from './native';
import { errorMessage } from './useLedger';

export function useUpdates() {
  const [release, setRelease] = useState<Release | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const inProgress = useRef(false);
  const active = useRef(true);
  const releaseRef = useRef<Release | null>(null);
  const releaseRevision = useRef(0);
  const permissionPending = useRef<Release | null>(null);
  const applyRelease = useCallback((value: Release | null) => {
    releaseRevision.current += 1;
    if (releaseRef.current?.sha256 !== value?.sha256) {
      setReady(false);
      setDismissed(false);
    }
    releaseRef.current = value;
    setRelease(value);
  }, []);
  const check = useCallback(
    async (manual = false) => {
      if (inProgress.current) return;
      inProgress.current = true;
      setChecking(true);
      try {
        const result = await Native.checkUpdate(manual);
        if (active.current) {
          applyRelease(result.release);
          if (manual || result.release) setMessage(result.message);
        }
      } catch {
        if (active.current && manual)
          setMessage('Não foi possível verificar agora. Continue usando o app offline.');
      } finally {
        inProgress.current = false;
        if (active.current) setChecking(false);
      }
    },
    [applyRelease],
  );
  const install = useCallback(async (value: Release) => {
    try {
      const result = await Native.installUpdate(JSON.stringify(value));
      if (result === 'permission')
        Alert.alert(
          'Autorizar atualização',
          'O Android pede autorização para instalar apps pelo Meu Saldo. Depois, volte para confirmar a instalação. Seus registros serão mantidos.',
          [
            { text: 'Agora não', style: 'cancel' },
            {
              text: 'Abrir configurações',
              onPress: () => {
                permissionPending.current = value;
                Native.openInstallPermission().catch((e) => {
                  permissionPending.current = null;
                  setMessage(errorMessage(e));
                });
              },
            },
          ],
        );
      else
        setMessage('Confirme a atualização no Android. Se cancelar, você pode tentar novamente.');
    } catch (e) {
      setReady(false);
      setMessage(errorMessage(e));
    }
  }, []);
  useEffect(() => {
    active.current = true;
    const cachedRevision = releaseRevision.current;
    Native.cachedUpdate()
      .then((value) => {
        if (active.current && releaseRevision.current === cachedRevision) applyRelease(value);
      })
      .catch(() => {})
      .then(() => {
        if (active.current) void check();
      });
    const progressSub = Native.addListener('updateProgress', (event) => {
      if (active.current) setProgress(event.progress);
    });
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const pending = permissionPending.current;
        permissionPending.current = null;
        if (pending) {
          void install(pending);
        } else {
          void check();
        }
      }
    });
    return () => {
      active.current = false;
      progressSub.remove();
      appSub.remove();
      Native.cancelDownload();
    };
  }, [applyRelease, check, install]);
  async function update() {
    const value = releaseRef.current;
    if (!value || inProgress.current) return;
    if (ready) {
      inProgress.current = true;
      setInstalling(true);
      try {
        await install(value);
      } finally {
        inProgress.current = false;
        if (active.current) setInstalling(false);
      }
      return;
    }
    inProgress.current = true;
    setDownloading(true);
    setProgress(0);
    setMessage('');
    try {
      await Native.downloadUpdate(JSON.stringify(value));
      if (active.current) {
        setReady(true);
        await install(value);
      }
    } catch (e) {
      if (active.current) {
        setReady(false);
        setMessage(errorMessage(e));
      }
    } finally {
      inProgress.current = false;
      if (active.current) setDownloading(false);
    }
  }
  return {
    release,
    checking,
    downloading,
    installing,
    progress,
    ready,
    message,
    dismissed,
    check,
    update,
    dismiss: () => setDismissed(true),
    cancel: () => Native.cancelDownload(),
    version: Native.versionName,
  };
}
