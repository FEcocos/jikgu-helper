import { describe, expect, it } from 'vitest';
import { getCategory } from '../lib/categories';
import { dutyFreeLimitUsd, limitReason, quote, type Rates } from '../lib/customs';

const rates: Rates = { KRW: 1400, JPY: 150, date: '2026-11-09' };
const general = getCategory('general');

describe('면세 한도', () => {
  it('미국 발송·특송·목록통관 품목은 200달러', () => {
    expect(dutyFreeLimitUsd('US', true, 'express')).toBe(200);
  });

  it('우편 배송이면 미국발이어도 150달러', () => {
    expect(dutyFreeLimitUsd('US', true, 'post')).toBe(150);
    expect(limitReason('US', true, 'post')).toBe('우편 배송');
  });

  it('목록통관이 안 되는 품목(영양제 등)은 150달러', () => {
    expect(dutyFreeLimitUsd('US', getCategory('supplement').listClearance, 'express')).toBe(150);
  });

  it('미국 외 국가는 150달러', () => {
    expect(dutyFreeLimitUsd('OTHER', true, 'express')).toBe(150);
  });
});

describe('quote', () => {
  it('한도 이하면 세금 0원, 남은 금액을 알려준다', () => {
    const q = quote({ amount: 180, currency: 'USD', rates, category: general, origin: 'US', shipping: 'express' });
    expect(q).toMatchObject({ dutyFree: true, itemKrw: 252_000, duty: 0, vat: 0, totalKrw: 252_000, remainingUsd: 20 });
  });

  it('한도와 같은 금액은 면세', () => {
    expect(quote({ amount: 200, currency: 'USD', rates, category: general, origin: 'US', shipping: 'express' }).dutyFree).toBe(true);
  });

  it('한도를 넘으면 전체 금액에 관세와 부가세가 붙는다', () => {
    const q = quote({ amount: 250, currency: 'USD', rates, category: general, origin: 'US', shipping: 'express' });
    // 350,000원 × 8% = 28,000원, (350,000 + 28,000) × 10% = 37,800원
    expect(q).toMatchObject({ dutyFree: false, itemKrw: 350_000, duty: 28_000, vat: 37_800, totalKrw: 415_800, remainingUsd: -50 });
  });

  it('의류는 관세 13%', () => {
    const q = quote({ amount: 250, currency: 'USD', rates, category: getCategory('clothing'), origin: 'US', shipping: 'express' });
    expect(q.duty).toBe(45_500);
    expect(q.vat).toBe(39_550);
  });

  it('책은 관세·부가세 모두 0원', () => {
    const q = quote({ amount: 300, currency: 'USD', rates, category: getCategory('books'), origin: 'US', shipping: 'express' });
    expect(q).toMatchObject({ dutyFree: false, duty: 0, vat: 0, totalKrw: 420_000 });
  });

  it('엔화는 달러로 바꿔서 한도를 판단한다', () => {
    // 22,500엔 = 150달러 → 한도 이내, 22,650엔 = 151달러 → 초과
    expect(quote({ amount: 22_500, currency: 'JPY', rates, category: general, origin: 'OTHER', shipping: 'express' }).dutyFree).toBe(true);
    const over = quote({ amount: 22_650, currency: 'JPY', rates, category: general, origin: 'OTHER', shipping: 'express' });
    expect(over.dutyFree).toBe(false);
    expect(over.itemKrw).toBe(211_400);
  });
});
