import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
const pages = ['index.html','works/index.html','games/index.html','articles/index.html','records/index.html'];
for (const page of pages) {
 const html = await readFile(`dist/${page}`, 'utf8');
 assert.match(html, /lang="ja"/);
 assert.match(html, /id="app"/);
 const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)].map(match => match[1]);
 assert(assets.length >= 2, `${page}: JS/CSS entry missing`);
 for (const asset of assets) await access(`dist${asset}`);
 console.log(`OK ${page}: HTML and linked assets`);
}
await access('dist/favicon.svg');
const demoPath = 'demos/bayesian-mcmc/index.html';
const demo = await readFile(`dist/${demoPath}`, 'utf8');
assert.equal(demo, await readFile(`public/${demoPath}`, 'utf8'), 'Vite must copy the standalone demo unchanged');
assert.match(demo, /href="\/games\/"/);
assert.match(demo, /function mcmc\(/);
assert(!/<script[^>]+src=|<link[^>]+stylesheet/.test(demo), 'Demo must remain standalone');
console.log(`OK ${demoPath}: standalone HTML copied unchanged`);
