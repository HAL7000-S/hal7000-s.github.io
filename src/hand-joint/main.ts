import './style.css';
import { mount, element } from './ui';
import { Camera, cameraError } from './camera';
import { HandTracker } from './handTracker';
import { JointChart } from './chart';
import { createCalibration, forearmAxis } from './calibration';
import { rawAngles, calibratedAngles } from './kinematics';
import { History } from './history';
import { drawOverlay, canvasPoint } from './overlay';
import type { Angles, Joint, Point } from './types';

mount();
const video = element<HTMLVideoElement>('video'), canvas = element<HTMLCanvasElement>('overlay'), viewport = element('viewport');
const camera = new Camera(video), chart = new JointChart(element<HTMLDivElement>('chart')), history = new History();
let calibration = createCalibration(), calibrated = false, axisReady = false, points: Point[] = [], landmarks: Point[] = [];
let raw: Angles | null = null, lastResult = 0, dimensions = '', active = false, loading = false, frozen = false, measuring = false, hasStarted = false;
let generation = 0, joint: Joint = 'mcpAngle', plotRevision = -1, plotJoint: Joint | undefined, frameHandle = 0, starting = 0;
const button = (id: string) => element<HTMLButtonElement>(id);
const say = (text: string) => { element('notice').textContent = text; };
const error = (text: string) => { element('error').textContent = text; element('error').hidden = !text; };
const tracker = new HandTracker(result => {
  if (!active || result.generation !== generation) return;
  const size = `${result.width}x${result.height}`;
  if (dimensions && dimensions !== size) invalidate('動画の解像度が変わりました。前腕軸とゼロ点を設定し直してください。');
  dimensions = size; canvas.width = result.width; canvas.height = result.height;
  viewport.style.aspectRatio = `${result.width}/${result.height}`;
  landmarks = result.landmarks; lastResult = performance.now();
  raw = axisReady ? rawAngles(landmarks, result.width, result.height, calibration.forearm) : null;
  const detected = landmarks.length === 21;
  element('detection').textContent = detected ? (frozen ? '静止映像で校正中' : '手を検出中 · 前腕を固定してください') : '手を検出できません';
  if (raw && calibrated) {
    const angles = calibratedAngles(raw, calibration);
    showAngles(angles);
    if (measuring && !frozen) history.add(angles, result.timestamp);
  } else { showAngles(null); if (measuring) history.gap(); }
  drawOverlay(canvas, landmarks, points); update();
}, failure => { if (active || loading) { error(`骨格推定に失敗しました。カメラを再起動してください。詳細: ${failure.message}`); stop(); } });

function showAngles(angles: Angles | null): void {
  for (const [id,key] of [['wrist-value','wristAngle'],['mcp-value','mcpAngle'],['pip-value','pipAngle']] as const) element(id).textContent = angles ? angles[key].toFixed(1) : '—';
}
function update(): void {
  button('camera-start').disabled = active || loading;
  button('camera-start').textContent = loading ? 'モデルを準備中…' : 'カメラを起動';
  button('camera-switch').disabled = !active || loading;
  button('camera-stop').disabled = !active && !loading;
  button('freeze').disabled = !active || frozen;
  button('unfreeze').disabled = !active || !frozen;
  button('zero').disabled = !active || !axisReady || !raw || (!frozen && performance.now()-lastResult > 500);
  button('measure-start').disabled = !active || !calibrated || measuring;
  button('measure-start').textContent = hasStarted ? '再開' : '計測開始';
  button('measure-pause').disabled = !measuring;
  element('camera-badge').textContent = loading ? '準備中' : active ? frozen ? '静止中' : 'ライブ' : '未起動';
  element('cal-badge').textContent = calibrated ? '校正済み' : axisReady ? 'ゼロ点未設定' : '未設定';
  element('measure-state').textContent = measuring ? '● 計測中' : calibrated ? hasStarted ? '一時停止中' : '計測できます' : '校正を完了してください';
  element('sample-count').textContent = `${history.samples.length.toLocaleString()} 点`;
  element('chart-empty').hidden = history.samples.length > 0;
}
function invalidate(message: string): void {
  measuring = false; hasStarted = false; calibrated = false; axisReady = false; raw = null; points = []; landmarks = [];
  calibration.forearm = { x: 0, y: 0 }; history.clear(); showAngles(null); say(message); update();
}
function stop(): void {
  starting++; generation++; active = false; loading = false; frozen = false; measuring = false;
  camera.stop(); tracker.close(); viewport.classList.remove('selecting');
  invalidate('カメラを停止しました。再起動後は校正を行ってください。');
  element('placeholder').hidden = false; drawOverlay(canvas, [], []); update();
}
async function start(): Promise<void> {
  const ticket = ++starting; generation++; loading = true; error(''); update();
  say('カメラの許可と推論モデルを準備しています。初回は少し時間がかかります。');
  // Request camera directly in the user gesture, before waiting for the model.
  try {
    await camera.start();
    if (ticket !== starting) return;
    await tracker.init();
    if (ticket !== starting) return;
    active = true; loading = false; dimensions = ''; frozen = false;
    viewport.classList.toggle('mirrored', camera.facing === 'user');
    element('placeholder').hidden = true;
    element('cal-instruction').textContent = '中立姿勢で「映像を静止・前腕軸を設定」を押してください。';
    invalidate('カメラを起動しました。静止映像上で前腕軸を設定してください。'); update();
  } catch (reason) { if (ticket === starting) { stop(); error(`起動に失敗しました。${cameraError(reason)}`); } }
}
button('camera-start').onclick = () => void start();
button('camera-stop').onclick = stop;
button('camera-switch').onclick = async () => {
  stop(); camera.facing = camera.facing === 'environment' ? 'user' : 'environment';
  button('camera-switch').textContent = camera.facing === 'environment' ? '前面に切替' : '背面に切替';
  await start();
};
button('freeze').onclick = () => {
  video.pause(); frozen = true; measuring = false; generation++; tracker.resetFrame();
  invalidate('静止映像で前腕の肘側、手首側の順にタップしてください。');
  viewport.classList.add('selecting');
  element('cal-instruction').textContent = '① 前腕の肘側をタップしてください。'; update();
};
canvas.addEventListener('pointerdown', event => {
  if (!active || !frozen || !canvas.width || points.length >= 2) return;
  const p = canvasPoint(event.clientX, event.clientY, canvas.getBoundingClientRect(), canvas.width, canvas.height, camera.facing === 'user');
  points.push(p);
  if (points.length === 1) element('cal-instruction').textContent = '② 前腕の手首側をタップしてください（骨格の手首点に向かう方向）。';
  else {
    const axis = forearmAxis(points[0], points[1]);
    if (!axis) { points = []; element('cal-instruction').textContent = '2点が近すぎます。肘側から15ピクセル以上離して指定し直してください。'; }
    else {
      calibration.forearm = axis; axisReady = true;
      raw = rawAngles(landmarks, canvas.width, canvas.height, axis);
      viewport.classList.remove('selecting');
      element('cal-instruction').textContent = '③ 手・指が中立姿勢の映像で「中立姿勢をゼロに設定」を押してください。';
    }
  }
  drawOverlay(canvas, landmarks, points); update();
});
button('zero').onclick = () => {
  if (!raw || !axisReady || (!frozen && performance.now()-lastResult > 500)) return;
  calibration.zero = { ...raw }; calibrated = true; measuring = false; generation++; history.clear();
  showAngles(calibratedAngles(raw, calibration));
  say('中立姿勢を0°に設定しました。軌跡をクリアしました。「計測開始」でライブ計測できます。');
  element('cal-instruction').textContent = '校正完了。前腕・端末を動かさず、手首と人差し指を動かしてください。'; update();
};
async function unfreeze(): Promise<void> {
  if (!frozen) return;
  await video.play(); frozen = false; generation++; raw = null; lastResult = 0; history.gap(); showAngles(null); update();
}
button('unfreeze').onclick = () => { void unfreeze().catch(reason => { stop(); error(cameraError(reason)); }); };
button('measure-start').onclick = async () => {
  if (!calibrated || !active) return;
  try { await unfreeze(); measuring = true; hasStarted = true; generation++; history.gap(); say('計測中です。前腕を固定したまま、手首と人差し指を動かしてください。'); update(); }
  catch (reason) { stop(); error(cameraError(reason)); }
};
button('measure-pause').onclick = () => { measuring = false; generation++; history.gap(); say('計測を一時停止しました。再開すると同じ履歴に追記します。'); update(); };
button('measure-reset').onclick = () => { generation++; history.clear(); say('軌跡をクリアしました。カメラと校正は維持しています。'); update(); };
for (const [id,key] of [['joint-mcp','mcpAngle'],['joint-pip','pipAngle']] as const) button(id).onclick = () => {
  joint = key; button('joint-mcp').setAttribute('aria-pressed', String(key === 'mcpAngle')); button('joint-pip').setAttribute('aria-pressed', String(key === 'pipAngle'));
};
for (const [id,key] of [['wrist-sign','wristSign'],['finger-sign','fingerSign']] as const) element<HTMLInputElement>(id).onchange = event => {
  calibration[key] = (event.target as HTMLInputElement).checked ? -1 : 1;
  generation++; history.clear(); showAngles(raw && calibrated ? calibratedAngles(raw, calibration) : null);
  say('符号を変更し、軌跡をクリアしました。背屈・指の屈曲が正になることを確認してください。'); update();
};
video.addEventListener('resize', () => {
  if (active && dimensions && dimensions !== `${video.videoWidth}x${video.videoHeight}`) {
    generation++; dimensions = ''; invalidate('動画サイズが変わりました。前腕軸とゼロ点を設定し直してください。');
    if (frozen) { void unfreeze().catch(reason => { stop(); error(cameraError(reason)); }); viewport.classList.remove('selecting'); }
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { measuring = false; generation++; history.gap(); showAngles(null); say('画面が非表示になったため計測を一時停止しました。戻ったら再開してください。'); update(); } });
window.addEventListener('pagehide', stop);
let lastPlot = 0;
function loop(now: number): void {
  if (active && !document.hidden) {
    void tracker.frame(video, now, Number(element<HTMLSelectElement>('fps').value), generation);
    if (!frozen && lastResult && now-lastResult > 600) { raw = null; landmarks = []; showAngles(null); drawOverlay(canvas, [], points); element('detection').textContent = '手を検出できません'; if (measuring) history.gap(); }
  }
  frameHandle = requestAnimationFrame(loop);
}
function plot(): void {
  const revision = history.revision, selected = joint;
  if (revision === plotRevision && selected === plotJoint) return;
  void chart.render(history.samples, selected).then(drawn => { if (drawn) { plotRevision = revision; plotJoint = selected; } }).catch(reason => { error(`グラフ描画に失敗しました。ページを再読み込みしてください。${String(reason)}`); });
}
void chart.init().then(() => {
  frameHandle = requestAnimationFrame(loop);
  lastPlot = window.setInterval(plot, 160);
}).catch(reason => error(`グラフを初期化できません。ページを再読み込みしてください。${String(reason)}`));
window.addEventListener('pagehide', () => { cancelAnimationFrame(frameHandle); clearInterval(lastPlot); });
window.addEventListener('pageshow', event => { if (event.persisted) { frameHandle = requestAnimationFrame(loop); lastPlot = window.setInterval(plot, 160); } });
update();
