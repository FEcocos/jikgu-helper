import { storage } from '#imports';
import type { Rates, ShippingMethod } from './customs';

export const enabledItem = storage.defineItem<boolean>('sync:enabled', { fallback: true });

export const shippingItem = storage.defineItem<ShippingMethod>('sync:shipping', { fallback: 'express' });

/** 'auto' 면 아마존 분류로 추정, 아니면 고정 품목 id */
export const defaultCategoryItem = storage.defineItem<string>('sync:defaultCategory', { fallback: 'auto' });

export interface CachedRates extends Rates {
  fetchedAt: number;
}

export const ratesItem = storage.defineItem<CachedRates | null>('local:rates', { fallback: null });
