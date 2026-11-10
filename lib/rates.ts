import type { Rates } from './customs';
import { ratesItem, type CachedRates } from './settings';

/** 유럽중앙은행 기준 환율 (키 없이 쓰는 무료 API, 평일 하루 한 번 갱신) */
export const RATES_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW,JPY';

const TTL_MS = 6 * 60 * 60 * 1000;

export function parseRatesResponse(body: unknown): Rates | null {
  if (!body || typeof body !== 'object') return null;
  const { date, rates } = body as { date?: unknown; rates?: { KRW?: unknown; JPY?: unknown } };
  if (typeof date !== 'string' || typeof rates?.KRW !== 'number' || typeof rates?.JPY !== 'number') return null;
  return { date, KRW: rates.KRW, JPY: rates.JPY };
}

/** 캐시가 6시간 안이면 그대로 쓰고, 아니면 새로 받는다. 받기에 실패하면 오래된 캐시라도 쓴다. */
export async function getRates(now = Date.now()): Promise<CachedRates> {
  const cached = await ratesItem.getValue();
  if (cached && now - cached.fetchedAt < TTL_MS) return cached;

  try {
    const res = await fetch(RATES_URL);
    if (!res.ok) throw new Error(`환율 API 응답 ${res.status}`);
    const rates = parseRatesResponse(await res.json());
    if (!rates) throw new Error('환율 API 응답 형식이 달라요');
    const fresh = { ...rates, fetchedAt: now };
    await ratesItem.setValue(fresh);
    return fresh;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}
