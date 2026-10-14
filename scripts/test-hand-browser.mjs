// Headless tests of this application's local build. No user's browser/profile is used.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { preview, createServer } from 'vite';
import { access, mkdir } from 'node:fs/promises';
const candidates = [process.env.HAND_TEST_BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean);
let executablePath;
for (const path of candidates) { try { await access(path); executablePath=path; break; } catch {} }
if (!executablePath) throw new Error('Set HAND_TEST_BROWSER to an installed Chromium executable.');
const base = process.env.HAND_TEST_BASE ?? '/';
const dev = process.env.HAND_TEST_DEV === '1';
const server = dev ? await createServer({ server: { host:'127.0.0.1', port:5187, strictPort:true } }) : await preview({ base, build: { outDir: process.env.HAND_TEST_DIST ?? 'dist' }, preview: { host:'127.0.0.1', port:5187, strictPort:true } });
if (dev) await server.listen();
const browser = await chromium.launch({ executablePath, headless:true });
const root=`http://127.0.0.1:5187${base.replace(/\/$/,'')}`;
const failures=[];
try {
  await mkdir('artifacts/hand-joint', {recursive:true});
  const context=await browser.newContext();
  const page=await context.newPage();
  page.on('pageerror',e=>failures.push(e.message));
  await page.goto(`${root}/hand-joint/`);
  await page.waitForSelector('#chart .main-svg');
  assert.equal(await page.locator('#wrist-value').textContent(),'—');
  await page.locator('#joint-pip').click();
  await page.waitForFunction(()=>document.querySelector('#chart .ytitle')?.textContent==='PIP angle [deg]');
  await page.screenshot({path:'artifacts/hand-joint/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>Number(document.querySelector('#chart .main-svg').getAttribute('width'))<=350 && document.documentElement.scrollWidth<=390);
  await page.screenshot({path:'artifacts/hand-joint/mobile.png',fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=390));
  assert(await page.locator('#camera-heading').evaluate(el=>el.getBoundingClientRect().top)<await page.locator('#chart-heading').evaluate(el=>el.getBoundingClientRect().top));
  const vendor='/hand-joint/vendor/';
  for(const asset of ['hand_landmarker.task','wasm/vision_wasm_internal.mjs','wasm/vision_wasm_internal.wasm','wasm/vision_wasm_nosimd_internal.mjs','wasm/vision_wasm_nosimd_internal.wasm']) assert.equal((await page.request.get(root+vendor+asset)).status(),200);
  // Exercise the real worker, local ESM loader, real WASM, and real model on a blank frame.
  const workerResult=await page.evaluate(async devMode=>{
    const html=await (await fetch(location.href)).text();
    const entry=html.match(/<script[^>]+src="([^"]+)"/)[1];
    const js=await (await fetch(entry)).text();
    const workerPath=devMode ? '/src/hand-joint/tracker.worker.ts?worker_file&type=module' : js.match(/new Worker\(new URL\("([^"]*tracker\.worker[^\"]+)"/)[1];
    const worker=new Worker(new URL(workerPath,new URL(entry,location.href)),{type:'module'});
    return await new Promise(resolve=>{
      const timer=setTimeout(()=>{worker.terminate();resolve({error:'timeout'});},45000);
      const finish=result=>{clearTimeout(timer);worker.terminate();resolve(result);};
      worker.onerror=e=>finish({error:e.message});
      worker.onmessage=async e=>{
        if(e.data.type==='error')finish({error:e.data.message});
        if(e.data.type==='ready'){
          const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
          canvas.getContext('2d').fillRect(0,0,640,480);
          const bitmap=await createImageBitmap(canvas);
          worker.postMessage({type:'frame',bitmap,timestamp:100,generation:0},[bitmap]);
        }
        if(e.data.type==='result')finish({count:e.data.landmarks.length});
      };
      worker.postMessage({type:'init',root:new URL('./vendor/',location.href).href});
    });
  }, dev);
  assert.deepEqual(workerResult,{count:0});
  console.log('OK real MediaPipe worker: local model/WASM initialize, blank frame returns no dummy landmarks.');
  // Deterministic synthetic frames test the app's interaction state, not inference accuracy.
  await context.addInitScript(()=>{
    const nativeCreate=window.createImageBitmap;
    window.createImageBitmap=async()=>({close(){}});
    class FakeWorker {
      constructor(){window.testWorker=this;}
      postMessage(message){
        if(message.type==='init')setTimeout(()=>this.onmessage?.({data:{type:'ready'}}),0);
        if(message.type==='frame'){
          const points=Array.from({length:21},()=>({x:.3,y:.5}));
          points[0]={x:.3,y:.5};points[5]={x:.5,y:.5};points[6]={x:.65,y:.5};points[7]={x:.8,y:.5};points[8]={x:.9,y:.5};
          if(window.testBent){points[6]={x:.5,y:.7};points[7]={x:.65,y:.7};points[8]={x:.8,y:.7};}
          setTimeout(()=>this.onmessage?.({data:{type:'result',landmarks:window.testNoHand?[]:points,width:640,height:480,timestamp:message.timestamp,generation:message.generation}}),10);
        }
      }
      terminate(){}
    }
    window.Worker=FakeWorker;
    navigator.mediaDevices.getUserMedia=async()=>{
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
      const ctx=canvas.getContext('2d');let i=0;setInterval(()=>{ctx.fillStyle=i++%2?'#333':'#444';ctx.fillRect(0,0,640,480);},40);
      return canvas.captureStream(25);
    };
  });
  await page.reload();await page.waitForSelector('#chart .main-svg');
  await page.locator('#camera-start').click();
  await page.waitForFunction(()=>document.querySelector('#camera-badge').textContent==='ライブ');
  await page.locator('#freeze').click();
  await page.waitForFunction(()=>document.querySelector('#detection').textContent==='静止映像で校正中');
  const box=await page.locator('#overlay').boundingBox();
  await page.locator('#overlay').click({position:{x:box.width*.1,y:box.height*.5}});
  await page.locator('#overlay').click({position:{x:box.width*.3,y:box.height*.5}});
  await page.locator('#zero').click();
  assert.equal(await page.locator('#cal-badge').textContent(),'校正済み');
  await page.locator('#measure-start').click();
  await page.waitForFunction(()=>parseInt(document.querySelector('#sample-count').textContent)>2);
  await page.evaluate(()=>window.testBent=true);
  await page.waitForFunction(()=>document.querySelector('#mcp-value').textContent==='90.0');
  await page.locator('#measure-pause').click();
  const count=await page.locator('#sample-count').textContent();
  await page.waitForTimeout(350);assert.equal(await page.locator('#sample-count').textContent(),count);
  await page.locator('#joint-pip').click();
  await page.waitForFunction(()=>document.querySelector('#chart .ytitle')?.textContent==='PIP angle [deg]');
  assert.equal(await page.locator('#sample-count').textContent(),count);
  await page.locator('#measure-start').click();
  await page.waitForFunction(previous=>document.querySelector('#sample-count').textContent!==previous,count);
  await page.evaluate(()=>window.testNoHand=true);
  await page.waitForFunction(()=>document.querySelector('#detection').textContent==='手を検出できません');
  const lostCount=await page.locator('#sample-count').textContent();
  await page.waitForTimeout(250);assert.equal(await page.locator('#sample-count').textContent(),lostCount);
  await page.evaluate(()=>window.testNoHand=false);
  await page.waitForFunction(previous=>document.querySelector('#sample-count').textContent!==previous,lostCount);
  await page.waitForFunction(()=>document.querySelector('#chart').data[0].x.includes(null));
  await page.locator('#measure-pause').click();await page.locator('#measure-reset').click();
  assert.equal(await page.locator('#sample-count').textContent(),'0 点');assert.equal(await page.locator('#cal-badge').textContent(),'校正済み');assert.equal(await page.locator('#camera-badge').textContent(),'ライブ');
  await page.locator('#finger-sign').check();
  await page.waitForFunction(()=>document.querySelector('#mcp-value').textContent==='-90.0');
  await page.locator('#camera-stop').click();assert.equal(await page.locator('#camera-badge').textContent(),'未起動');
  assert.deepEqual(failures,[]);
  console.log('OK Edge desktop/mobile: Plotly rendering, no horizontal overflow, calibration, measure/pause/resume, MCP/PIP history, detection gaps, reset, sign flip, stop. Camera input and landmarks are synthetic for interaction checks.');
} finally {await browser.close();if(dev)await server.close();else await new Promise(resolve=>server.httpServer.close(resolve));}
