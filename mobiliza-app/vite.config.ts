import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` gera a pasta dist/ normal.
// `npm run build:arquivo-unico` gera um único index.html (abre com duplo clique, sem servidor).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'arquivo-unico' ? [viteSingleFile()] : [])],
  build: {
    // 'publicar' gera o site em ../mobiliza, servido pelo GitHub Pages em /santander_finance/mobiliza/
    outDir: mode === 'arquivo-unico' ? 'dist-arquivo-unico' : mode === 'publicar' ? '../mobiliza' : 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
  test: { environment: 'node' },
}));
