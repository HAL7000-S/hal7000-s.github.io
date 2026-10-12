import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';

// Execute the actual built standalone HTML. Canvas calls are recorded because
// jsdom has no graphics renderer; visual browser QA remains a separate check.
const html = await readFile('dist/demos/bayesian-mcmc/index.html', 'utf8');
const calls = { hist: [], trace: [] };
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => { throw error; });
let seed = 42;
const dom = new JSDOM(html, {
  url: 'https://hal7000-s.github.io/demos/bayesian-mcmc/index.html',
  runScripts: 'dangerously',
  virtualConsole,
  beforeParse(window) {
    window.Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    window.HTMLCanvasElement.prototype.getContext = function () {
      const log = calls[this.id];
      return Object.fromEntries(['clearRect', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'stroke', 'fillText'].map(name => [name, (...args) => {
        for (const value of args) if (typeof value === 'number') assert(Number.isFinite(value), `${this.id}: non-finite ${name} coordinate`);
        log.push({ name, args });
      }]));
    };
  }
});
const { window } = dom;
const document = window.document;
const text = id => document.getElementById(id).textContent;
const input = (id, value) => { document.getElementById(id).value = String(value); };
const run = () => document.getElementById('run').click();
const resetInputs = () => { input('n', 10); input('h', 8); input('sigma', .15); input('steps', 12000); };

try {
  assert.equal(document.querySelector('a').getAttribute('href'), '/games/');
  assert.equal(text('exact-mean'), '0.7500');
  assert.match(text('result'), /Beta\(9, 3\)/);
  assert(Math.abs(Number(text('mcmc-mean')) - .75) < .025, 'Seeded MCMC should approximate Beta(9,3) mean');
  assert(parseFloat(text('acceptance')) > 0 && parseFloat(text('acceptance')) < 100);
  assert.equal(calls.hist.filter(call => call.name === 'fillRect').length, 50);
  assert(calls.hist.some(call => call.name === 'stroke'));
  assert(calls.hist.filter(call => call.name === 'lineTo').length >= 200);
  assert(calls.trace.filter(call => call.name === 'lineTo').length > 500);
  assert(calls.trace.some(call => call.name === 'fillRect'), 'Burn-in region should be drawn');
  assert.equal(document.querySelectorAll('canvas:not([hidden])').length, 2);
  console.log('OK MCMC: initial execution, mean 0.7500, histogram, Beta curve, trace drawing calls');

  // Exact density normalization and expectation, including all-heads/all-tails.
  for (const [n, h] of [[10,8], [10,0], [10,10], [100,0], [100,100]]) {
    let mass = 0, expectation = 0;
    const intervals = 10000;
    for (let i = 0; i < intervals; i++) {
      const theta = (i + .5) / intervals;
      const density = window.exactPdf(theta, h, n);
      mass += density / intervals;
      expectation += theta * density / intervals;
    }
    assert(Math.abs(mass - 1) < .00001, `Beta normalization n=${n}, H=${h}`);
    assert(Math.abs(expectation - (h+1)/(n+2)) < .00001, `Beta expectation n=${n}, H=${h}`);
  }
  const chain = window.mcmc(8, 10, .15, 10000);
  assert.equal(chain.chain.length, 10000);
  assert.equal(chain.samples.length, 8000);
  assert.deepEqual(chain.samples, chain.chain.slice(2000));
  assert(chain.chain.every(value => value > 0 && value < 1));
  assert.equal(window.logPosterior(-.1,8,10), -Infinity);
  assert.equal(window.logPosterior(1.1,8,10), -Infinity);
  console.log('OK MCMC: theoretical normalization/mean, boundary observations, 20% burn-in, state bounds');

  input('h',2); run();
  assert.equal(text('exact-mean'),'0.2500');
  assert.match(text('result'), /Beta\(3, 9\)/);
  assert(Math.abs(Number(text('mcmc-mean')) - .25) < .025);
  resetInputs(); input('sigma', .03); input('steps', 1000); run();
  const firstAcceptance = text('acceptance');
  input('sigma', .8); run();
  assert.notEqual(text('acceptance'), firstAcceptance, 'Proposal width changes acceptance');
  resetInputs(); input('n',20); run();
  assert.equal(text('exact-mean'), '0.4091');
  input('steps',100); calls.trace.length = 0; run();
  assert(calls.trace.some(call => call.name === 'fillText' && call.args[0] === '100'));
  console.log('OK MCMC: n/H/sigma/steps input changes and run button');

  const invalidInputs = [
    ['n',''], ['h',''], ['sigma',''], ['steps',''],
    ['n',0], ['n',101], ['n',10.5], ['n','Infinity'],
    ['h',-1], ['h',11], ['h',1.5], ['h','not-a-number'],
    ['sigma',0], ['sigma',-.1], ['sigma','1e309'],
    ['steps',99], ['steps',100001], ['steps',100.5]
  ];
  for (const [id,value] of invalidInputs) {
    resetInputs(); input(id,value);
    const drawCount = calls.hist.length + calls.trace.length;
    run();
    assert.match(text('error'), /入力値を確認/);
    assert.equal(document.getElementById(id).getAttribute('aria-invalid'),'true');
    assert.equal(document.activeElement.id,id);
    assert(document.getElementById('metrics').hidden);
    assert.equal(document.querySelectorAll('canvas:not([hidden])').length,0);
    assert.equal(calls.hist.length+calls.trace.length,drawCount, 'Invalid input must not render a new result');
  }
  resetInputs(); input('sigma',.001); run();
  assert.equal(text('error'),'');
  assert(!document.getElementById('metrics').hidden);
  assert.equal(document.querySelectorAll('[aria-invalid]').length,0);
  assert.equal(document.querySelectorAll('canvas:not([hidden])').length,2);
  for(const h of [0,10]) { input('h',h); run(); assert.equal(text('error'),''); }
  // A browser without Canvas still presents computed numeric results.
  window.HTMLCanvasElement.prototype.getContext = () => null;
  resetInputs(); run();
  assert.match(text('error'), /Canvas/);
  assert.equal(text('exact-mean'),'0.7500');
  assert.equal(document.querySelectorAll('canvas:not([hidden])').length,0);
  console.log('OK MCMC: invalid/empty input rejection, recovery, valid extreme observations, Canvas fallback');
} finally {
  dom.window.close();
}
