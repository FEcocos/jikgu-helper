import { useEffect, useState } from 'react';
import { CATEGORIES, DEFAULT_CATEGORY_ID, getCategory, guessCategoryId } from '@/lib/categories';
import { limitReason, quote, type Rates } from '@/lib/customs';
import { formatKrw, formatRate, formatShortDate, formatUsd } from '@/lib/format';
import type { Site } from '@/lib/amazon';
import { defaultCategoryItem, enabledItem, shippingItem } from '@/lib/settings';
import { useStorageItem } from '@/lib/useStorageItem';
import { usePageSnapshot } from './usePageSnapshot';

type RatesState = { status: 'loading' } | { status: 'ready'; rates: Rates } | { status: 'error' };

function useRates(): RatesState {
  const [state, setState] = useState<RatesState>({ status: 'loading' });
  useEffect(() => {
    browser.runtime
      .sendMessage({ type: 'getRates' })
      .then((res: { ok: boolean; rates?: Rates }) =>
        setState(res?.ok && res.rates ? { status: 'ready', rates: res.rates } : { status: 'error' }),
      )
      .catch(() => setState({ status: 'error' }));
  }, []);
  return state;
}

/** 면세 한도까지 이만큼 안 남았으면 합산과세를 미리 알려준다 */
const NEAR_LIMIT_USD = 20;

/**
 * 아마존 가격 아래에 붙는 배지.
 * 원화 가격, 면세 여부, 한도를 넘으면 예상 관부가세와 합계를 보여준다.
 */
export function Badge({ site }: { site: Site }) {
  const snapshot = usePageSnapshot();
  const ratesState = useRates();
  const [enabled] = useStorageItem(enabledItem);
  const [shipping] = useStorageItem(shippingItem);
  const [defaultCategory] = useStorageItem(defaultCategoryItem);
  const [pickedCategoryId, setPickedCategoryId] = useState<string>();

  if (!enabled || !shipping || !defaultCategory || !snapshot.price) return null;

  const guessedId = guessCategoryId(snapshot.department);
  const autoId = defaultCategory === 'auto' ? (guessedId ?? DEFAULT_CATEGORY_ID) : defaultCategory;
  const category = getCategory(pickedCategoryId ?? autoId);
  const isGuess = !pickedCategoryId && defaultCategory === 'auto' && guessedId !== null;

  if (ratesState.status !== 'ready') {
    return (
      <div className="card">
        <Header />
        <p className="muted">{ratesState.status === 'loading' ? '환율을 불러오는 중이에요…' : '환율을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.'}</p>
      </div>
    );
  }

  const { rates } = ratesState;
  const q = quote({ ...snapshot.price, rates, category, origin: site.origin, shipping });
  const reason = limitReason(site.origin, category.listClearance, shipping);
  const rateText =
    snapshot.price.currency === 'JPY'
      ? `100엔 = ${formatRate((rates.KRW / rates.JPY) * 100)}원`
      : `1달러 = ${formatRate(rates.KRW)}원`;

  return (
    <div className="card">
      <Header aside={`${rateText} · ${formatShortDate(rates.date)} 기준`} />

      <div className="amount">
        <span className="krw">{formatKrw(q.itemKrw)}</span>
        {!q.dutyFree && <span className="total">→ 예상 합계 {formatKrw(q.totalKrw)}</span>}
      </div>

      {q.dutyFree ? (
        <p className="status ok">
          ● 면세 예상 · 한도 {formatUsd(q.limitUsd)}까지 {formatUsd(q.remainingUsd)} 남음
          <span className="reason"> ({reason} 기준)</span>
        </p>
      ) : (
        <>
          <p className="status over">
            ▲ 면세 한도 {formatUsd(q.limitUsd)} 초과 · 전체 금액에 세금이 붙어요
            <span className="reason"> ({reason} 기준)</span>
          </p>
          <dl className="taxes">
            <dt>관세 {percent(category.dutyRate)}</dt>
            <dd>{formatKrw(q.duty)}</dd>
            <dt>부가세 {category.vatExempt ? '면제' : '10%'}</dt>
            <dd>{formatKrw(q.vat)}</dd>
          </dl>
        </>
      )}

      {q.dutyFree && q.remainingUsd < NEAR_LIMIT_USD && (
        <p className="note">한도에 가까워요. 같은 날 다른 물건과 함께 들어오면 합쳐서 계산될 수 있어요.</p>
      )}

      <label className="category">
        <span>품목</span>
        <select value={category.id} onChange={(e) => setPickedCategoryId(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} · 관세 {percent(c.dutyRate)}
            </option>
          ))}
        </select>
        {isGuess && <span className="muted">아마존 분류로 추정</span>}
      </label>

      {snapshot.importDeposit && q.dutyFree && (
        <p className="note">아마존이 받는 수입 예치금(Import Fees Deposit)은 실제 세금이 없으면 나중에 환불돼요.</p>
      )}

      <p className="muted fine">
        국제 배송비 제외 · 실제 세금은 관세청 고시 환율과 품목 분류로 정해져요.
      </p>
    </div>
  );
}

function Header({ aside }: { aside?: string }) {
  return (
    <div className="header">
      <strong>직구 계산기</strong>
      {aside && <span className="muted">{aside}</span>}
    </div>
  );
}

function percent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}
