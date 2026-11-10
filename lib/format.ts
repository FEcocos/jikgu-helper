const krw = new Intl.NumberFormat('ko-KR');
const usd = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatKrw(n: number): string {
  return `₩${krw.format(Math.round(n))}`;
}

/** 소수점 아래가 0이면 "$200" 처럼 정수로 보여준다 */
export function formatUsd(n: number): string {
  return Number.isInteger(n) ? `$${n.toLocaleString('en-US')}` : `$${usd.format(n)}`;
}

export function formatRate(n: number): string {
  return krw.format(Math.round(n * 100) / 100);
}

/** "2026-11-09" → "11/9" */
export function formatShortDate(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return m && d ? `${m}/${d}` : date;
}
