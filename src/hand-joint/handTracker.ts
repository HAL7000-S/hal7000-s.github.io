import type { Point } from './types';
export interface Detection { landmarks: Point[]; timestamp: number; width: number; height: number; generation: number }
export class HandTracker {
  private worker?: Worker;
  private busy = false;
  private lastFrame = -1;
  private lastInference = -Infinity;
  private initReject?: (reason: Error) => void;
  private initTimer?: ReturnType<typeof setTimeout>;
  constructor(private result: (result: Detection) => void, private failure: (error: Error) => void) {}
  async init(): Promise<void> {
    this.worker = new Worker(new URL('./tracker.worker.ts', import.meta.url), { type: 'module' });
    await new Promise<void>((resolve, reject) => {
      this.initReject = reject;
      const timer = setTimeout(() => { reject(new Error('モデルの読み込みがタイムアウトしました。接続とモデル・WASMの配置を確認してください。')); this.close(); }, 60000);
      this.initTimer = timer;
      const fail = (error: Error) => { clearTimeout(timer); this.busy = false; reject(error); this.failure(error); };
      this.worker!.onerror = event => fail(new Error(event.message || '推論Workerを起動できません。最新ブラウザをご利用ください。'));
      this.worker!.onmessage = event => {
        if (event.data.type === 'ready') { clearTimeout(timer); this.initReject = undefined; resolve(); }
        else if (event.data.type === 'result') { this.busy = false; this.result(event.data); }
        else fail(new Error(event.data.message));
      };
      this.worker!.postMessage({ type: 'init', root: new URL('./vendor/', document.baseURI).href });
    });
  }
  async frame(video: HTMLVideoElement, timestamp: number, fps: number, generation: number): Promise<void> {
    if (!this.worker || this.busy || video.readyState < 2 || video.currentTime === this.lastFrame || timestamp - this.lastInference < 1000 / fps) return;
    this.busy = true; this.lastFrame = video.currentTime; this.lastInference = timestamp;
    const worker = this.worker;
    try {
      const bitmap = await createImageBitmap(video);
      if (this.worker !== worker) { bitmap.close(); return; }
      worker.postMessage({ type: 'frame', bitmap, timestamp, generation }, [bitmap]);
    } catch (error) { this.busy = false; this.failure(error instanceof Error ? error : new Error(String(error))); }
  }
  resetFrame(): void { this.lastFrame = -1; }
  close(): void { clearTimeout(this.initTimer); this.initTimer = undefined; this.worker?.terminate(); this.worker = undefined; this.busy = false; this.initReject?.(new Error('モデル初期化を中止しました。')); this.initReject = undefined; }
}
