import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages のサブディレクトリ(/product-update/2026-07/)配置用の静的ビルド。
// base:'./' で相対パス化し、fetch を使わず july-data.json を焼き込む。
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist-static',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.static.html',
    },
  },
})
