import type { Origin } from './customs';
import { parsePrice, type Price } from './price';

export interface Site {
  origin: Origin;
  name: string;
}

export function siteFromHost(host: string): Site | null {
  if (/(^|\.)amazon\.com$/.test(host)) return { origin: 'US', name: 'Amazon.com' };
  if (/(^|\.)amazon\.co\.jp$/.test(host)) return { origin: 'OTHER', name: 'Amazon.co.jp' };
  return null;
}

/** 배지를 붙일 가격 영역. 위에서부터 먼저 찾은 것을 쓴다. */
const ANCHOR_SELECTORS = [
  '#corePriceDisplay_desktop_feature_div',
  '#corePrice_feature_div',
  '#apex_desktop',
  '#price',
];

export function findAnchorSelector(doc: Document): string | null {
  return ANCHOR_SELECTORS.find((selector) => doc.querySelector(selector)) ?? null;
}

export function findAnchor(doc: Document): Element | null {
  const selector = findAnchorSelector(doc);
  return selector ? doc.querySelector(selector) : null;
}

export function readPrice(doc: Document): Price | null {
  const candidates: Array<() => string | null | undefined> = [
    () => doc.querySelector('#apex-pricetopay-accessibility-label')?.textContent,
    () => joinPriceParts(doc.querySelector('#corePriceDisplay_desktop_feature_div .priceToPay')),
    () => joinPriceParts(doc.querySelector('#corePriceDisplay_desktop_feature_div .a-price')),
    () => firstFilled(doc.querySelectorAll('#corePrice_feature_div .a-price .a-offscreen')),
    () => firstFilled(doc.querySelectorAll('#apex_desktop .a-price .a-offscreen')),
    () => doc.querySelector('#priceblock_ourprice, #priceblock_dealprice, #price_inside_buybox')?.textContent,
  ];
  for (const read of candidates) {
    const price = parsePrice(read());
    if (price) return price;
  }
  return null;
}

/** 첫 번째 상품 분류. 분류 경로가 없으면 제목 끝("Amazon.com: 상품명 : Electronics")에서 읽는다. */
export function readDepartment(doc: Document): string | null {
  const crumb = doc.querySelector('#wayfinding-breadcrumbs_feature_div li a')?.textContent?.trim();
  if (crumb) return crumb;
  const parts = doc.title.split(' : ');
  return parts.length > 1 ? (parts.at(-1)?.trim() ?? null) : null;
}

/** 배송 안내에 아마존 수입 예치금(Import Fees Deposit) 문구가 있는지 */
export function hasImportDeposit(doc: Document): boolean {
  const block = doc.querySelector('#mir-layout-DELIVERY_BLOCK, #deliveryBlockMessage');
  return /import fees deposit|輸入手数料/i.test(block?.textContent ?? '');
}

function joinPriceParts(el: Element | null): string | null {
  if (!el) return null;
  const symbol = el.querySelector('.a-price-symbol')?.textContent ?? '';
  const whole = el.querySelector('.a-price-whole')?.textContent ?? '';
  const fraction = el.querySelector('.a-price-fraction')?.textContent ?? '';
  if (!whole) return null;
  const wholeDigits = whole.replace(/[^\d,]/g, '');
  return fraction ? `${symbol}${wholeDigits}.${fraction}` : `${symbol}${wholeDigits}`;
}

function firstFilled(nodes: NodeListOf<Element>): string | null {
  for (const node of nodes) {
    const text = node.textContent?.trim();
    if (text) return text;
  }
  return null;
}
