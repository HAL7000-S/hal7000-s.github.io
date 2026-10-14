import { defineConfig } from 'vite';
export default defineConfig({
  base: '/',
  // Prebundle the worker-only dependency before camera startup, avoiding a
  // first-use dependency optimization reload in the development server.
  optimizeDeps: { include: ['@mediapipe/tasks-vision'] },
  build: { rollupOptions: { input: ['index.html', 'works/index.html', 'games/index.html', 'articles/index.html', 'records/index.html', 'hand-joint/index.html'] } }
});
