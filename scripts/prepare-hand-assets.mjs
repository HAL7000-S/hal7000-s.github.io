import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const version = '0.10.32';
const source = 'node_modules/@mediapipe/tasks-vision';
const target = 'public/hand-joint/vendor';
const pkg = JSON.parse(await readFile(`${source}/package.json`, 'utf8'));
if (pkg.version !== version) throw new Error(`Expected MediaPipe ${version}, got ${pkg.version}`);
await mkdir(`${target}/wasm`, { recursive: true });
for (const name of ['vision_wasm_internal', 'vision_wasm_nosimd_internal']) {
  for (const extension of ['js', 'wasm']) await copyFile(`${source}/wasm/${name}.${extension}`, `${target}/wasm/${name}.${extension}`);
  const js = await readFile(`${source}/wasm/${name}.js`, 'utf8');
  await writeFile(`${target}/wasm/${name}.mjs`, `${js}\nself.ModuleFactory = ModuleFactory;\n`);
}
const url = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
if (process.argv.includes('--download-model')) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Model download: HTTP ${response.status}`);
  await writeFile(`${target}/hand_landmarker.task`, new Uint8Array(await response.arrayBuffer()));
}
const model = await readFile(`${target}/hand_landmarker.task`);
await writeFile(`${target}/manifest.json`, JSON.stringify({ tasksVisionVersion: version, modelVersion: 'float16/1', modelSource: url, modelBytes: model.length, modelSha256: createHash('sha256').update(model).digest('hex') }, null, 2) + '\n');
console.log('Pinned Hand Landmarker model, WASM, ESM wrappers and manifest ready.');
