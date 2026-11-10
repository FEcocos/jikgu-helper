import ReactDOM from 'react-dom/client';
import { findAnchorSelector, siteFromHost } from '@/lib/amazon';
import { Badge } from './Badge';
import './style.css';

export default defineContentScript({
  matches: ['https://www.amazon.com/*', 'https://www.amazon.co.jp/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const site = siteFromHost(location.hostname);
    const anchor = findAnchorSelector(document);
    if (!site || !anchor) return;

    const ui = await createShadowRootUi(ctx, {
      name: 'jikgu-badge',
      position: 'inline',
      anchor,
      append: 'after',
      onMount(container) {
        const root = ReactDOM.createRoot(container);
        root.render(<Badge site={site} />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.autoMount();
  },
});
