import type { Currency } from './customs';

export interface Price {
  amount: number;
  currency: Currency;
}

const CURRENCY_MARKERS: Array<[RegExp, Currency]> = [
  [/KRW|₩|￦/, 'KRW'],
  [/JPY|¥|￥|円/, 'JPY'],
  [/USD|US\$|\$/, 'USD'],
];

/**
 * "$1,234.56", "￥3,980", "KRW 357,000" 같은 가격 문구를 읽는다.
 * 범위 가격("$10.99 - $24.99")이면 첫 번째 값을 쓴다.
 */
export function parsePrice(text: string | null | undefined): Price | null {
  if (!text) return null;
  const currency = CURRENCY_MARKERS.find(([pattern]) => pattern.test(text))?.[1];
  if (!currency) return null;

  const match = text.match(/\d[\d,]*(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[0].replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return { amount, currency };
}
