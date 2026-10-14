export class Camera {
  private stream?: MediaStream;
  private epoch = 0;
  facing: 'environment' | 'user' = 'environment';
  constructor(readonly video: HTMLVideoElement) {}
  async start(): Promise<void> {
    this.stop();
    const ticket = this.epoch;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('カメラにはHTTPS接続が必要です。HTTPSの公開URLまたはlocalhostで開いてください。');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: this.facing }, width: { ideal: 1280 }, height: { ideal: 720 } } });
    if (ticket !== this.epoch) { stream.getTracks().forEach(t => t.stop()); throw new DOMException('カメラ起動を中止しました。', 'AbortError'); }
    this.stream = stream;
    this.video.srcObject = stream;
    try { await this.video.play(); } catch (error) { if (ticket === this.epoch) this.stop(); throw error; }
  }
  stop(): void { this.epoch++; this.stream?.getTracks().forEach(t => t.stop()); this.stream = undefined; this.video.srcObject = null; }
}
export function cameraError(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  const messages: Record<string, string> = {
    NotAllowedError: 'カメラの使用が許可されていません。ブラウザのサイト設定でカメラを許可して、もう一度起動してください。',
    NotFoundError: 'カメラが見つかりません。カメラを接続し、端末の設定を確認してください。',
    NotReadableError: 'カメラを起動できません。他のアプリのカメラ使用を終了して再試行してください。',
    OverconstrainedError: '指定したカメラ設定が使えません。別のカメラまたはブラウザで再試行してください。'
  };
  return messages[name] ?? (error instanceof Error ? error.message : String(error));
}
