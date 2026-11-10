import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { getRates, parseRatesResponse } from '../lib/rates';
import { ratesItem } from '../lib/settings';

const body = { amount: 1, base: 'USD', date: '2026-11-09', rates: { JPY: 157.95, KRW: 1346.79 } };

describe('parseRatesResponse', () => {
  it('환율 응답을 읽는다', () => {
    expect(parseRatesResponse(body)).toEqual({ date: '2026-11-09', KRW: 1346.79, JPY: 157.95 });
  });

  it('형식이 다르면 null', () => {
    expect(parseRatesResponse({ rates: { KRW: '1346' } })).toBeNull();
    expect(parseRatesResponse(null)).toBeNull();
  });
});

describe('getRates', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
  });

  it('6시간 안에 받은 환율은 다시 받지 않는다', async () => {
    await ratesItem.setValue({ date: '2026-11-09', KRW: 1300, JPY: 150, fetchedAt: 1_000 });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect((await getRates(1_000 + 60_000)).KRW).toBe(1300);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('오래됐으면 새로 받아 저장한다', async () => {
    await ratesItem.setValue({ date: '2026-11-01', KRW: 1300, JPY: 150, fetchedAt: 0 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body)));
    const now = 7 * 60 * 60 * 1000;
    expect(await getRates(now)).toEqual({ date: '2026-11-09', KRW: 1346.79, JPY: 157.95, fetchedAt: now });
    expect((await ratesItem.getValue())?.KRW).toBe(1346.79);
  });

  it('받기에 실패하면 오래된 환율이라도 쓴다', async () => {
    await ratesItem.setValue({ date: '2026-11-01', KRW: 1300, JPY: 150, fetchedAt: 0 });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    expect((await getRates(7 * 60 * 60 * 1000)).KRW).toBe(1300);
  });

  it('캐시도 없고 받기에도 실패하면 에러', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await expect(getRates()).rejects.toThrow('offline');
  });
});
