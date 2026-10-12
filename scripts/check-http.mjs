import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('dist');
const server = createServer(async (req,res) => {
 const path = new URL(req.url,'http://localhost').pathname;
 const file = resolve(root, `.${path}${path.endsWith('/')?'index.html':''}`);
 if(!file.startsWith(`${root}/`) && !file.startsWith(`${root}\\`)) { res.writeHead(403).end(); return; }
 try { const content = await readFile(file); res.setHeader('Content-Type', {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'}[extname(file)]??'application/octet-stream'); res.end(content); }
 catch { res.writeHead(404).end(); }
});
try {
 await new Promise((done,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',done); });
 const base = `http://127.0.0.1:${server.address().port}`;
 for(const path of ['/','/works/','/games/','/articles/','/records/','/demos/bayesian-mcmc/index.html']) {
  for(let attempt=0;attempt<2;attempt++) {
   const response = await fetch(`${base}${path}`); assert.equal(response.status,200);
   const html = await response.text();
   if(path.includes('bayesian-mcmc')) assert.match(html, /<title>Bayesian MCMC Demo<\/title>/);
   for(const [,asset] of html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)) assert.equal((await fetch(`${base}${asset}`)).status,200);
  }
  console.log(`OK ${path}: direct HTTP access, repeat request, assets (no SPA fallback)`);
 }
 assert.equal((await fetch(`${base}/missing/`)).status,404);
} finally { await new Promise(done=>server.close(done)); }
