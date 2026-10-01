import { useEffect, useRef, useState } from 'react';
import { decode, encode, initialLedger, Ledger } from './finance';
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
      .then((text) => {
        const data = text === null ? initialLedger() : decode(text);
        current.current = data;
        if (mounted.current) {
          setLedger(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (mounted.current)
          setError(
            `Não foi possível abrir os registros. O arquivo foi preservado. ${errorMessage(e)}`,
          );
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, []);
  function mutate(change: (previous: Ledger) => Ledger, replacement?: Ledger) {
    setPending((n) => n + 1);
    const job = queue.current
      .catch(() => {})
      .then(async () => {
        const previous = current.current;
        if (!replacement && previous === null)
          throw new Error('Restaure um backup para recuperar os registros.');
        const next = replacement ?? change(previous!);
        const text = encode(next);
        await Native.writeLedger(text);
        current.current = next;
        if (mounted.current) {
          setLedger(next);
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
    restore: (data: Ledger) => mutate((v) => v, data),
  };
}
