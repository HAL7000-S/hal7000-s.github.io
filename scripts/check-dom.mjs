import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
const asModule = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const transpile = code => ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const dataUrl = asModule(transpile(await readFile('src/data.ts','utf8')));
const data = await import(dataUrl);
const mainSource = (await readFile('src/main.ts','utf8')).replace("import './style.css';", '').replace("from './data';", `from '${dataUrl}';`);
const pages = [['/', 'Home', '.door', 4], ['/works/', 'Works', '.work-card', 5], ['/games/', 'Games', '.game-card', 4], ['/articles/', 'Articles', '.article-row', 3], ['/records/', 'Records', '.record', 3]];
const updates = data.recentUpdates();
assert.equal(updates.length,5);
assert(updates.every((entry,i) => !i || updates[i-1].updatedAt >= entry.updatedAt));
for (const [path,name,selector,count] of pages) {
 const dom = new JSDOM('<div id="app"></div>', { url:`https://hal7000-s.github.io${path}` });
 globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.location = dom.window.location;
 await import(asModule(transpile(mainSource) + `\n// page ${name}`));
 assert.equal(document.querySelectorAll(selector).length,count);
 assert.equal(document.querySelector('nav [aria-current="page"]').textContent,name);
 assert.equal(document.querySelectorAll('nav a').length,5);
 assert(document.querySelector('main h1'));
 assert(document.querySelector('a[href="https://hal7000-s.github.io/website01/"]'));
 if(name==='Home') {
  assert.equal(document.querySelectorAll('.update-row').length,5);
  assert.equal(document.querySelector('#avatar').dataset.mode,'fallback');
  for(const entry of updates) {
   const [entryPath,id] = entry.path.split('#');
   const sources = { '/works/': data.works, '/games/': data.games, '/articles/': data.articles, '/records/': data.records };
   assert(sources[entryPath].some(item => item.id===id));
  }
 }
 if(name==='Games') assert.equal(document.querySelectorAll('.game-card a').length,0);
 if(name==='Articles') {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  buttons[1].click();
  assert.equal(document.querySelectorAll('.article-row:not([hidden])').length,1);
  assert.equal(document.querySelectorAll('[data-filter][aria-pressed="true"]').length,1);
  assert.equal(document.querySelector('.filter-count').textContent,'1件を表示');
  buttons[0].click(); assert.equal(document.querySelectorAll('.article-row:not([hidden])').length,3);
 }
 console.log(`OK ${path}: ${name}, navigation, content${name==='Articles'?', filters':''}`);
 dom.window.close();
}
// WebGL非対応の実際のエラー経路を通して2D表示に戻ることを確認。
const dom = new JSDOM('<div><div id="avatar" data-mode="3d"><div class="fallback">2D</div></div></div>');
globalThis.window=dom.window; globalThis.document=dom.window.document;
globalThis.cancelAnimationFrame=()=>{};
dom.window.HTMLCanvasElement.prototype.getContext = () => null;
const avatarSource = (await readFile('src/avatar.ts','utf8')).replace("from 'three';", `from '${pathToFileURL(require.resolve('three').replace('three.cjs','three.module.js')).href}';`).replace("from 'three/addons/loaders/GLTFLoader.js';", `from '${pathToFileURL(require.resolve('three/addons/loaders/GLTFLoader.js')).href}';`);
const { mountAvatar } = await import(asModule(transpile(avatarSource)));
const host = document.querySelector('#avatar');
const originalError = console.error;
try { console.error=()=>{}; await mountAvatar(host,null); } finally { console.error=originalError; }
assert.equal(host.dataset.mode,'fallback'); assert.equal(host.querySelectorAll('canvas').length,0); assert(host.querySelector('.fallback'));
console.log('OK WebGL unavailable: 2D fallback');
dom.window.close();
