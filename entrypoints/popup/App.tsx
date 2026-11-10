import { useEffect, useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import type { Rates, ShippingMethod } from '@/lib/customs';
import { formatRate, formatShortDate } from '@/lib/format';
import { defaultCategoryItem, enabledItem, shippingItem } from '@/lib/settings';
import { useStorageItem } from '@/lib/useStorageItem';

/** 툴바 아이콘을 누르면 뜨는 설정 창 */
function App() {
  const [enabled, setEnabled] = useStorageItem(enabledItem);
  const [shipping, setShipping] = useStorageItem(shippingItem);
  const [defaultCategory, setDefaultCategory] = useStorageItem(defaultCategoryItem);
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    browser.runtime
      .sendMessage({ type: 'getRates' })
      .then((res: { ok: boolean; rates?: Rates }) => res?.ok && res.rates && setRates(res.rates))
      .catch(() => undefined);
  }, []);

  if (enabled === undefined || !shipping || !defaultCategory) return null;

  return (
    <main>
      <header>
        <h1>직구 계산기</h1>
        <label className="switch">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>{enabled ? '켜짐' : '꺼짐'}</span>
        </label>
      </header>

      <p className="lead">아마존 상품 페이지에 원화 가격, 면세 여부, 예상 관부가세를 보여줘요.</p>

      <section>
        <h2>배송 방식</h2>
        <div className="segmented">
          {(
            [
              ['express', '특송 (기본)'],
              ['post', '우편 (EMS 등)'],
            ] as Array<[ShippingMethod, string]>
          ).map(([value, label]) => (
            <button key={value} className={shipping === value ? 'active' : ''} onClick={() => setShipping(value)}>
              {label}
            </button>
          ))}
        </div>
        <p className="hint">미국 면세 한도 200달러는 특송으로 받을 때만 적용돼요.</p>
      </section>

      <section>
        <h2>기본 품목</h2>
        <select value={defaultCategory} onChange={(e) => setDefaultCategory(e.target.value)}>
          <option value="auto">아마존 분류로 자동 추정</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h2>오늘 환율</h2>
        {rates ? (
          <p className="rates">
            1달러 {formatRate(rates.KRW)}원 · 100엔 {formatRate((rates.KRW / rates.JPY) * 100)}원
            <span className="hint"> ({formatShortDate(rates.date)} 유럽중앙은행 기준)</span>
          </p>
        ) : (
          <p className="hint">환율을 불러오는 중이에요…</p>
        )}
      </section>

      <section className="rules">
        <h2>면세 기준</h2>
        <ul>
          <li>미국 발송·특송·목록통관 품목: 200달러 이하</li>
          <li>그 외 국가, 우편 배송, 식품·영양제·기능성 화장품: 150달러 이하</li>
          <li>한도를 넘으면 전체 금액에 관세와 부가세 10%가 붙어요.</li>
        </ul>
        <p className="hint">
          세율은 대표값이라 실제와 다를 수 있어요. 정확한 금액은{' '}
          <a href="https://unipass.customs.go.kr" target="_blank" rel="noreferrer">
            관세청 유니패스
          </a>
          에서 확인하세요.
        </p>
      </section>
    </main>
  );
}

export default App;
