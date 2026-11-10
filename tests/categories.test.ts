import { describe, expect, it } from 'vitest';
import { getCategory, guessCategoryId } from '../lib/categories';

describe('guessCategoryId', () => {
  it.each([
    ['Electronics', 'electronics'],
    ['Clothing, Shoes & Jewelry', 'clothing'],
    ['Health & Household', 'supplement'],
    ['Grocery & Gourmet Food', 'food'],
    ['Beauty & Personal Care', 'cosmetics'],
    ['Books', 'books'],
    ['Computers', 'it'],
    ['家電＆カメラ', 'electronics'],
    ['食品・飲料・お酒', 'food'],
  ])('%s → %s', (department, expected) => {
    expect(guessCategoryId(department)).toBe(expected);
  });

  it('모르는 분류나 빈 값은 null', () => {
    expect(guessCategoryId('Toys & Games')).toBeNull();
    expect(guessCategoryId(null)).toBeNull();
  });
});

it('없는 품목 id 는 일반 물품으로', () => {
  expect(getCategory('nope').id).toBe('general');
});
