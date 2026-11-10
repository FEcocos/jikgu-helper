import { expect, it } from 'vitest';
import { formatKrw, formatShortDate, formatUsd } from '../lib/format';

it('금액·날짜 표시', () => {
  expect(formatUsd(200)).toBe('$200');
  expect(formatUsd(34.57)).toBe('$34.57');
  expect(formatUsd(1234.5)).toBe('$1,234.50');
  expect(formatKrw(357478.4)).toBe('₩357,478');
  expect(formatShortDate('2026-11-09')).toBe('11/9');
});
