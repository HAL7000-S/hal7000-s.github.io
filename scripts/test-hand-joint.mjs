import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const cache = new Map();
async function load(name) {
  if (cache.has(name)) return import(cache.get(name));
  let source = await readFile(`src/hand-joint/${name}.ts`, 'utf8');
  if (name === 'handTracker') source = source.replace("new URL('./tracker.worker.ts', import.meta.url)", "'test-worker'");
  const imports = [...source.matchAll(/from '\.\/([^']+)'/g)];
  for (const [, dependency] of imports) {
    if (dependency === 'types') continue;
    await load(dependency);
    source = source.replaceAll(`from './${dependency}'`, `from '${cache.get(dependency)}'`);
  }
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const url = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
  cache.set(name, url); return import(url);
}
const { signedAngle, rawAngles, calibratedAngles, wrapDegrees } = await load('kinematics');
const { createCalibration, forearmAxis } = await load('calibration');
const { History } = await load('history');
const { canvasPoint } = await load('overlay');
const near = (a, b) => assert(Math.abs(a-b) < 1e-7, `${a} != ${b}`);
for (const degrees of [0,90,-90,37,-154]) near(signedAngle({x:1,y:0},{x:Math.cos(degrees*Math.PI/180),y:Math.sin(degrees*Math.PI/180)}), degrees);
assert.equal(signedAngle({x:0,y:0},{x:1,y:0}), null);
assert.equal(signedAngle({x:Infinity,y:0},{x:1,y:0}), null);
const pixel = Array.from({length:21},()=>({x:100,y:100}));
pixel[0]={x:100,y:100};pixel[5]={x:200,y:100};pixel[6]={x:200,y:200};pixel[7]={x:300,y:200};pixel[8]={x:350,y:250};
for(const [width,height] of [[640,480],[1280,720],[480,1280]]) {
  const normalized = pixel.map(p=>({x:p.x/width,y:p.y/height}));
  const result = rawAngles(normalized,width,height,{x:1,y:0});
  assert(result); near(result.wristAngle,0); near(result.mcpAngle,90); near(result.pipAngle,-90); near(result.dipAngle,45);
  const cal = createCalibration(); cal.zero={...result};
  assert.deepEqual(calibratedAngles(result,cal),{wristAngle:0,mcpAngle:0,pipAngle:0,dipAngle:0});
  cal.zero={wristAngle:-20,mcpAngle:10,pipAngle:-20,dipAngle:5}; cal.wristSign=-1;cal.fingerSign=-1;
  const adjusted=calibratedAngles(result,cal); near(adjusted.wristAngle,-20);near(adjusted.mcpAngle,-80);near(adjusted.pipAngle,70);
}
assert.equal(rawAngles([],640,480,{x:1,y:0}),null);
assert.equal(rawAngles(pixel,0,480,{x:1,y:0}),null);
assert.equal(rawAngles(pixel,640,NaN,{x:1,y:0}),null);
assert.equal(rawAngles(pixel.map((p,i)=>i===7?{x:NaN,y:0}:p),640,480,{x:1,y:0}),null);
assert.equal(rawAngles(Array(21).fill({x:0,y:0}),640,480,{x:1,y:0}),null);
near(wrapDegrees(-358),2);near(wrapDegrees(358),-2);
assert.equal(forearmAxis({x:1,y:1},{x:2,y:2}),null);
assert.deepEqual(forearmAxis({x:20,y:30},{x:80,y:50}),{x:60,y:20});
assert.deepEqual(canvasPoint(60,45,{left:10,top:20,width:100,height:50},640,480,false),{x:320,y:240});
assert.deepEqual(canvasPoint(35,45,{left:10,top:20,width:100,height:50},640,480,true),{x:480,y:240});
const history=new History(3), angles={wristAngle:10,mcpAngle:20,pipAngle:30,dipAngle:40};
history.add(angles,1);history.gap();history.add(angles,2);
assert.notEqual(history.samples[0].segment,history.samples[1].segment);
assert.deepEqual(history.samples.map(s=>s.mcpAngle),[20,20]);assert.deepEqual(history.samples.map(s=>s.pipAngle),[30,30]);
history.add(angles,3);history.add(angles,4);assert.equal(history.samples.length,3);assert.equal(history.samples[0].timestamp,2);
history.add({...angles,mcpAngle:NaN},5);assert.equal(history.samples.length,3);
history.clear();assert.equal(history.samples.length,0);
const manifest=JSON.parse(await readFile('public/hand-joint/vendor/manifest.json','utf8'));
const model=await readFile('public/hand-joint/vendor/hand_landmarker.task');
assert.equal(createHash('sha256').update(model).digest('hex'),manifest.modelSha256);
assert.equal(manifest.tasksVisionVersion,'0.10.32');assert.equal(model.length,7819105);
for(const name of ['vision_wasm_internal','vision_wasm_nosimd_internal']) {
  const original=await readFile(`node_modules/@mediapipe/tasks-vision/wasm/${name}.js`,'utf8');
  assert.equal(await readFile(`public/hand-joint/vendor/wasm/${name}.mjs`,'utf8'),`${original}\nself.ModuleFactory = ModuleFactory;\n`);
  assert.deepEqual(await readFile(`public/hand-joint/vendor/wasm/${name}.wasm`),await readFile(`node_modules/@mediapipe/tasks-vision/wasm/${name}.wasm`));
}
await access('dist/hand-joint/index.html');
// Cancelling an initialization must not leave a timer that closes a later worker.
const { HandTracker } = await load('handTracker');
const saved = { Worker:globalThis.Worker, document:globalThis.document, setTimeout:globalThis.setTimeout, clearTimeout:globalThis.clearTimeout };
const timers = new Map();let timerId=0, worker;
try {
  globalThis.document={baseURI:'https://example.test/hand-joint/'};
  globalThis.Worker=class { constructor(){worker=this;} postMessage(){} terminate(){this.terminated=true;} };
  globalThis.setTimeout=fn=>{timers.set(++timerId,fn);return timerId;};
  globalThis.clearTimeout=id=>timers.delete(id);
  const tracker=new HandTracker(()=>{},()=>{});
  const cancelled=tracker.init();tracker.close();await assert.rejects(cancelled,/中止/);assert.equal(timers.size,0);
  const restarted=tracker.init();worker.onmessage({data:{type:'ready'}});await restarted;assert.equal(timers.size,0);tracker.close();
  const timedOut=tracker.init();[...timers.values()][0]();await assert.rejects(timedOut,/タイムアウト/);assert.equal(timers.size,0);
} finally {Object.assign(globalThis,saved);}
console.log('OK hand-joint: signed angles, aspect ratios, zero/sign calibration, invalid input, mirror coordinates, gaps, bounded history, pinned assets.');
console.log('OK hand-joint: worker initialization cancellation/restart and timeout cleanup.');
