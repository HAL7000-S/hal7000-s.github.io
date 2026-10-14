import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
let tracker: HandLandmarker | undefined;
self.onmessage = async (event: MessageEvent) => {
  const message = event.data;
  try {
    if (message.type === 'init') {
      // ESM is strict mode: the upstream loader's block-scoped debug function
      // needs an outer binding (classic-script Annex B hoisting is unavailable).
      (globalThis as unknown as { custom_dbg: (...args: unknown[]) => void }).custom_dbg = (...args) => console.warn(...args);
      const files = await FilesetResolver.forVisionTasks(`${message.root}wasm`);
      // The pinned runtime uses importScripts, which module workers cannot call.
      // Our same-origin ESM wrapper installs its unmodified factory on self.
      await import(/* @vite-ignore */ files.wasmLoaderPath.replace(/\.js$/, '.mjs'));
      tracker = await HandLandmarker.createFromOptions({ ...files, wasmLoaderPath: '' }, { baseOptions: { modelAssetPath: `${message.root}hand_landmarker.task`, delegate: 'CPU' }, runningMode: 'VIDEO', numHands: 1 });
      self.postMessage({ type: 'ready' });
    } else if (message.type === 'frame') {
      const bitmap: ImageBitmap = message.bitmap;
      try {
        if (!tracker) throw new Error('推論モデルが未初期化です');
        const result = tracker.detectForVideo(bitmap, message.timestamp);
        self.postMessage({ type: 'result', landmarks: result.landmarks[0] ?? [], timestamp: message.timestamp, width: bitmap.width, height: bitmap.height, generation: message.generation });
      } finally { bitmap.close(); }
    }
  } catch (error) { self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) }); }
};
