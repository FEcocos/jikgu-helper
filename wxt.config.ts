import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '직구 계산기 - 원화·면세 한도·관부가세',
    description: '아마존 상품 페이지에 원화 가격, 면세 한도, 예상 관부가세를 바로 보여줘요.',
    permissions: ['storage'],
    host_permissions: ['https://api.frankfurter.dev/*'],
  },
});
