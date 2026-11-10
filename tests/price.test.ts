import { describe, expect, it } from 'vitest';
import { parsePrice } from '../lib/price';

describe('parsePrice', () => {
  it.each([
    [' $265.43 ', { amount: 265.43, currency: 'USD' }],
    ['$1,234.56', { amount: 1234.56, currency: 'USD' }],
    ['US$49.00', { amount: 49, currency: 'USD' }],
    ['￥3,980', { amount: 3980, currency: 'JPY' }],
    ['¥12,800 税込', { amount: 12800, currency: 'JPY' }],
    ['KRW 357,000', { amount: 357000, currency: 'KRW' }],
    ['$10.99 - $24.99', { amount: 10.99, currency: 'USD' }],
  ])('%s', (text, expected) => {
    expect(parsePrice(text)).toEqual(expected);
  });

  it.each([null, '', '   ', 'Currently unavailable', '$0.00', '1,234'])('읽을 수 없으면 null: %s', (text) => {
    expect(parsePrice(text)).toBeNull();
  });
});
