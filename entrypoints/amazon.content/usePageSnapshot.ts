import { useEffect, useState } from 'react';
import { hasImportDeposit, readDepartment, readPrice } from '@/lib/amazon';
import type { Price } from '@/lib/price';

export interface PageSnapshot {
  price: Price | null;
  department: string | null;
  importDeposit: boolean;
}

function takeSnapshot(): PageSnapshot {
  return {
    price: readPrice(document),
    department: readDepartment(document),
    importDeposit: hasImportDeposit(document),
  };
}

/** 사이즈·색상을 바꾸면 아마존이 가격을 다시 그리므로 페이지 변화를 지켜보며 다시 읽는다. */
export function usePageSnapshot(): PageSnapshot {
  const [snapshot, setSnapshot] = useState(takeSnapshot);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const target = document.querySelector('#ppd') ?? document.body;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const next = takeSnapshot();
        setSnapshot((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      }, 250);
    });
    observer.observe(target, { childList: true, subtree: true, characterData: true });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return snapshot;
}
