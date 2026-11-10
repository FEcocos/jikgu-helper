import type { Category } from './categories';

export type Currency = 'USD' | 'JPY' | 'KRW';
export type ShippingMethod = 'express' | 'post';
export type Origin = 'US' | 'OTHER';

/** 1달러당 각 통화 금액 (USD 기준 환율) */
export interface Rates {
  KRW: number;
  JPY: number;
  date: string;
}

export interface QuoteInput {
  amount: number;
  currency: Currency;
  rates: Rates;
  category: Category;
  origin: Origin;
  shipping: ShippingMethod;
}

export interface Quote {
  itemUsd: number;
  itemKrw: number;
  limitUsd: number;
  dutyFree: boolean;
  /** 한도까지 남은 금액(달러). 넘었으면 음수 */
  remainingUsd: number;
  duty: number;
  vat: number;
  totalKrw: number;
}

/**
 * 면세 한도(달러).
 * 미국발 + 목록통관 품목 + 특송이면 200달러, 나머지는 150달러.
 */
export function dutyFreeLimitUsd(origin: Origin, listClearance: boolean, shipping: ShippingMethod): number {
  return origin === 'US' && listClearance && shipping === 'express' ? 200 : 150;
}

/** 한도가 왜 그 금액인지 한 줄 설명 */
export function limitReason(origin: Origin, listClearance: boolean, shipping: ShippingMethod): string {
  if (origin === 'OTHER') return '미국 외 국가 발송';
  if (shipping === 'post') return '우편 배송';
  if (!listClearance) return '목록통관이 안 되는 품목';
  return '미국 발송·특송';
}

export function toUsd(amount: number, currency: Currency, rates: Rates): number {
  if (currency === 'USD') return amount;
  return amount / rates[currency];
}

/**
 * 예상 원화 가격과 관부가세를 계산한다.
 * 한도를 넘으면 초과분이 아니라 전체 금액에 관세와 부가세가 붙는다.
 * 국제 배송비는 상품 페이지에서 알 수 없어 빼고 계산한다.
 */
export function quote(input: QuoteInput): Quote {
  const { amount, currency, rates, category, origin, shipping } = input;
  const itemUsd = toUsd(amount, currency, rates);
  const itemKrw = Math.round(itemUsd * rates.KRW);
  const limitUsd = dutyFreeLimitUsd(origin, category.listClearance, shipping);
  const remainingUsd = round2(limitUsd - itemUsd);
  const dutyFree = itemUsd <= limitUsd;

  if (dutyFree) {
    return { itemUsd, itemKrw, limitUsd, dutyFree, remainingUsd, duty: 0, vat: 0, totalKrw: itemKrw };
  }

  const duty = floorWon(itemKrw * category.dutyRate);
  const vat = category.vatExempt ? 0 : floorWon((itemKrw + duty) * 0.1);
  return { itemUsd, itemKrw, limitUsd, dutyFree, remainingUsd, duty, vat, totalKrw: itemKrw + duty + vat };
}

/** 원 미만 절사. 0.13 같은 소수 곱셈 오차로 1원 덜 나오는 것을 막는다. */
function floorWon(n: number): number {
  return Math.floor(n + 1e-6);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
