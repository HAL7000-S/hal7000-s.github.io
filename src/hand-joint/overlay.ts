import type { Point } from './types';
const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
export function drawOverlay(canvas: HTMLCanvasElement, landmarks: Point[], points: Point[]): void {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const w = canvas.width, h = canvas.height, scale = Math.max(w, h) / 500;
  ctx.clearRect(0, 0, w, h); ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = '#6ee0c6';
  if (landmarks.length === 21) {
    for (const [a,b] of connections) { ctx.beginPath(); ctx.moveTo(landmarks[a].x*w, landmarks[a].y*h); ctx.lineTo(landmarks[b].x*w, landmarks[b].y*h); ctx.stroke(); }
    for (const p of landmarks) { ctx.beginPath(); ctx.arc(p.x*w, p.y*h, 3*scale, 0, Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill(); }
  }
  ctx.strokeStyle = '#ffb36b'; ctx.fillStyle = '#ffb36b';
  if (points.length === 2) { ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y); ctx.stroke(); }
  points.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 6*scale, 0, Math.PI*2); ctx.fill(); });
}
export function canvasPoint(clientX: number, clientY: number, rect: Pick<DOMRect,'left'|'top'|'width'|'height'>, width: number, height: number, mirrored: boolean): Point {
  const x = (clientX - rect.left) / rect.width;
  return { x: (mirrored ? 1-x : x)*width, y: (clientY - rect.top)/rect.height*height };
}
