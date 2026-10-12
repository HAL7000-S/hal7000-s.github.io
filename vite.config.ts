import { defineConfig } from 'vite';
export default defineConfig({ base: '/', build: { rollupOptions: { input: ['index.html', 'works/index.html', 'games/index.html', 'articles/index.html', 'records/index.html'] } } });
