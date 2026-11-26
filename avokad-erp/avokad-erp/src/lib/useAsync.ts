import { useCallback, useEffect, useState } from 'react';

export function useAsync<T>(fn: () => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const run = useCallback(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => live && setState({ data, error: null, loading: false }),
      (e: unknown) => live && setState({ data: null, error: e instanceof Error ? e.message : 'Something went wrong.', loading: false }),
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => run(), [run]);
  return { ...state, reload: run };
}
