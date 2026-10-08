import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { decode, encode, generateOccurrences, initialLedger, Ledger } from './finance';
import Native from './native';
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
export function useLedger() {
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(0);
  const current = useRef<Ledger | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    Native.readLedger()
      .then(async (text) => {
        const data = text === null ? initialLedger() : decode(text);
        current.current = data;
        await mutate(
          generateOccurrences,
          undefined,
          text !== null &&
            (JSON.parse(text).version === 1 ||
              JSON.parse(text).categories.some(
                (category: { colorKey?: string }) => !category.colorKey,
              )),
        );
        if (mounted.current) {
          setLedger(current.current);
          setError(null);
        }
      })
      .catch((e) => {
        if (mounted.current) {
          if (current.current) setLedger(current.current);
          setError(
            current.current
              ? `Não foi possível atualizar os registros automáticos. Os registros anteriores foram mantidos. ${errorMessage(e)}`
              : `Não foi possível abrir os registros. O arquivo foi preservado. ${errorMessage(e)}`,
          );
        }
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const refresh = () => {
      if (!current.current || AppState.currentState !== 'active') return;
      void mutate(generateOccurrences).catch((e) => {
        if (mounted.current)
          setError(`Não foi possível registrar as recorrências. ${errorMessage(e)}`);
      });
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const timer = setInterval(refresh, 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);
  function mutate(change: (previous: Ledger) => Ledger, replacement?: Ledger, forceWrite = false) {
    setPending((n) => n + 1);
    const job = queue.current
      .catch(() => {})
      .then(async () => {
        const previous = current.current;
        if (!replacement && previous === null)
          throw new Error('Restaure um backup para recuperar os registros.');
        const next = replacement ?? change(previous!);
        if (next === previous && !forceWrite) return;
        const text = encode(next);
        await Native.writeLedger(text);
        const persisted = decode(text);
        current.current = persisted;
        if (mounted.current) {
          setLedger(persisted);
          setError(null);
        }
      })
      .finally(() => {
        if (mounted.current) setPending((n) => n - 1);
      });
    queue.current = job;
    return job;
  }
  return {
    ledger,
    error,
    loading,
    busy: pending > 0,
    mutate,
    restore: (data: Ledger) => mutate((v) => v, generateOccurrences(data)),
  };
}
