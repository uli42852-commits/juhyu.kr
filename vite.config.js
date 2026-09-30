import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // 프리렌더 단계에서 페이지별 청크를 modulepreload 하기 위해 사용
    manifest: true,
  },
});
