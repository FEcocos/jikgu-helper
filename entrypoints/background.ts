import { getRates } from '@/lib/rates';

export type RatesMessage = { type: 'getRates' };

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: RatesMessage, _sender, sendResponse) => {
    if (message?.type !== 'getRates') return;
    getRates()
      .then((rates) => sendResponse({ ok: true, rates }))
      .catch((error: unknown) => sendResponse({ ok: false, error: String(error) }));
    return true;
  });
});
