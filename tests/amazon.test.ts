import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { findAnchor, findAnchorSelector, hasImportDeposit, readDepartment, readPrice, siteFromHost } from '../lib/amazon';

const fixture = readFileSync(resolve(__dirname, 'fixtures/amazon-com-product.html'), 'utf8');

function load(html: string) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.title = parsed.title;
  document.body.innerHTML = parsed.body.innerHTML;
}

describe('아마존 상품 페이지 읽기', () => {
  beforeEach(() => load(fixture));

  it('가격 영역을 배지 위치로 찾는다', () => {
    expect(findAnchor(document)?.id).toBe('corePriceDisplay_desktop_feature_div');
    expect(findAnchorSelector(document)).toBe('#corePriceDisplay_desktop_feature_div');
  });

  it('결제 가격을 읽는다', () => {
    expect(readPrice(document)).toEqual({ amount: 265.43, currency: 'USD' });
  });

  it('접근성 문구가 없으면 화면에 보이는 숫자 조각을 합쳐서 읽는다', () => {
    document.querySelector('#apex-pricetopay-accessibility-label')?.remove();
    expect(readPrice(document)).toEqual({ amount: 265.43, currency: 'USD' });
  });

  it('분류 경로가 없으면 제목 끝에서 분류를 읽는다', () => {
    expect(readDepartment(document)).toBe('Electronics');
  });

  it('분류 경로가 있으면 첫 번째 분류를 쓴다', () => {
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<div id="wayfinding-breadcrumbs_feature_div"><ul><li><a> Clothing, Shoes &amp; Jewelry </a></li><li><a>Women</a></li></ul></div>',
    );
    expect(readDepartment(document)).toBe('Clothing, Shoes & Jewelry');
  });

  it('수입 예치금 문구를 알아본다', () => {
    expect(hasImportDeposit(document)).toBe(true);
    document.querySelector('#mir-layout-DELIVERY_BLOCK')!.textContent = 'FREE delivery Wednesday, November 11';
    expect(hasImportDeposit(document)).toBe(false);
  });

  it('가격이 없는 페이지(검색 결과 등)에서는 null', () => {
    document.body.innerHTML = '<div id="search"></div>';
    expect(findAnchor(document)).toBeNull();
    expect(readPrice(document)).toBeNull();
  });
});

describe('siteFromHost', () => {
  it('amazon.com 은 미국 발송, amazon.co.jp 는 그 외 국가로 본다', () => {
    expect(siteFromHost('www.amazon.com')?.origin).toBe('US');
    expect(siteFromHost('www.amazon.co.jp')?.origin).toBe('OTHER');
    expect(siteFromHost('www.amazon.de')).toBeNull();
    expect(siteFromHost('notamazon.com')).toBeNull();
  });
});
