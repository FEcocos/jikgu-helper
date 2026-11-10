import { useEffect, useState } from 'react';
import type { WxtStorageItem } from '#imports';

/** 저장된 설정을 읽고, 팝업에서 바꾸면 열린 페이지에도 바로 반영한다. */
export function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>): [T | undefined, (value: T) => void] {
  const [value, setValue] = useState<T>();

  useEffect(() => {
    item.getValue().then(setValue);
    return item.watch((next) => setValue(next));
  }, [item]);

  return [value, (next: T) => void item.setValue(next)];
}
