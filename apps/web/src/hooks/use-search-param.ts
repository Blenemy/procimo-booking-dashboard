import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export function useSearchParam<T>(
  name: string,
  parse: (raw: string | null) => T,
): [T, (next: string | number) => void] {
  const [params, setParams] = useSearchParams();

  const setValue = useCallback(
    (next: string | number) =>
      setParams(
        (current) => {
          current.set(name, String(next));
          return current;
        },
        { replace: true },
      ),
    [name, setParams],
  );

  return [parse(params.get(name)), setValue];
}
