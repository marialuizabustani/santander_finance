import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` gera a pasta dist/ normal.
// `npm run build:arquivo-unico` gera um único index.html (abre com duplo clique, sem servidor).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'arquivo-unico' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'arquivo-unico' ? 'dist-arquivo-unico' : 'dist' },
  test: { environment: 'node' },
}));
