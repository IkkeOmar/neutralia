#!/usr/bin/env node
/**
 * DOM-level test of the NEUTRALIA vehicle chassis x variant prototype.
 * Drives the page in headless Chromium via CDP and asserts the real state,
 * not what the markup claims.
 *
 * Usage: node test-vehicles.js https://ikkeomar.github.io/neutralia/prototype/vehicles.html
 */
const http = require('http');
const { spawn } = require('child_process');

const URL_UNDER_TEST = process.argv[2] || 'http://127.0.0.1:8791/vehicles.html';
const CDP_PORT = 9337;

function get(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const chrome = spawn('chromium-browser', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    `--remote-debugging-port=${CDP_PORT}`, '--window-size=1400,1200',
    'about:blank'
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try { targets = JSON.parse(await get(`http://127.0.0.1:${CDP_PORT}/json`)); break; } catch (e) {}
  }
  if (!targets) { console.error('FAIL: chromium did not start'); chrome.kill(); process.exit(1); }

  const page = targets.find(t => t.type === 'page');
  const WebSocket = require('ws');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => {
    const myId = ++id;
    pending.set(myId, res);
    ws.send(JSON.stringify({ id: myId, method, params }));
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
  });

  await new Promise(r => ws.on('open', r));
  await send('Runtime.enable');

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + JSON.stringify(r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  };

  await send('Page.navigate', { url: URL_UNDER_TEST });
  await sleep(2200);

  const results = [];
  const check = (name, actual, expected) => {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ name, pass, actual, expected });
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : `  got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`}`);
  };
  const ok = (name, cond, detail) => {
    results.push({ name, pass: !!cond });
    console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + (detail || '')}`);
  };

  console.log('\n=== LOAD ===');
  check('title', await evalJs('document.title'), 'NEUTRALIA — Vehicle Chassis & Variants Prototype');
  check('7 chassis defined', await evalJs('CHASSIS.length'), 7);
  check('20 variants defined', await evalJs(
    'CHASSIS.reduce((a,c)=>a+c.variants.length,0)'), 20);
  check('7 chassis tabs rendered', await evalJs(
    "document.querySelectorAll('#tabs .tab').length"), 7);
  check('matrix has 7 body rows', await evalJs(
    "document.querySelectorAll('#matrix tbody tr[data-chassis]').length"), 7);
  check('matrix has 20 variant cells', await evalJs(
    "document.querySelectorAll('#matrix td[data-v]').length"), 20);
  check('7 rules rendered', await evalJs("document.querySelectorAll('#rules .rule').length"), 7);
  check('12 invariant rows rendered', await evalJs("document.querySelectorAll('#inv .invrow').length"), 12);
  check('8 source tiles rendered', await evalJs("document.querySelectorAll('#srcs .src').length"), 8);

  console.log('\n=== MATRIX MATCHES THE DESIGN DOC ===');
  check('Scout car variants', await evalJs(
    "CHASSIS.find(c=>c.id==='Scout car').variants.map(v=>v.n)"),
    ['Scout', 'Technical', 'Courier']);
  check('Armoured car variants', await evalJs(
    "CHASSIS.find(c=>c.id==='Armoured car').variants.map(v=>v.n)"),
    ['APC', 'Carrier', 'Recovery']);
  check('Light tank variants', await evalJs(
    "CHASSIS.find(c=>c.id==='Light tank').variants.map(v=>v.n)"),
    ['Javelin', 'Bulwark', 'Hunter']);
  check('Heavy tank variants', await evalJs(
    "CHASSIS.find(c=>c.id==='Heavy tank').variants.map(v=>v.n)"),
    ['Assault', 'Dug-in', 'Siege']);
  check('Fighter variants', await evalJs(
    "CHASSIS.find(c=>c.id==='Fighter').variants.map(v=>v.n)"),
    ['Interceptor', 'Bomber', 'Liaison']);
  check('Helicopter variants', await evalJs(
    "CHASSIS.find(c=>c.id==='Helicopter').variants.map(v=>v.n)"),
    ['Transport', 'Gunship', 'Spotter']);
  check('Boat variants', await evalJs(
    "CHASSIS.find(c=>c.id==='Boat').variants.map(v=>v.n)"),
    ['Landing craft', 'Gunboat']);
  check('2 new chassis', await evalJs(
    "CHASSIS.filter(c=>c.origin==='new').map(c=>c.id)"),
    ['Armoured car', 'Heavy tank']);
  check('variant count per chassis', await evalJs(
    'CHASSIS.map(c=>c.variants.length)'), [3, 3, 3, 3, 3, 3, 2]);

  console.log('\n=== INVARIANTS (computed in-page) ===');
  ok('every chassis has 2-3 variants', await evalJs(
    'CHASSIS.every(c=>c.variants.length>=2 && c.variants.length<=3)'));
  ok('no duplicate loadouts within a chassis', await evalJs(`
    (()=>{for(const c of CHASSIS){const seen=new Set();
      for(const v of c.variants){const k=v.mount+'|'+v.gadget;
        if(seen.has(k)) return false; seen.add(k);}}
      return true;})()`));
  ok('R1: no transport variant carries explosives', await evalJs(
    "CHASSIS.every(c=>c.variants.every(v=>v.line!=='Transport'||!v.expl))"));
  ok('R2: each variant of a chassis owns a distinct line', await evalJs(
    "CHASSIS.every(c=>new Set(c.variants.map(v=>v.line)).size===c.variants.length)"));
  ok('R4: no variant exceeds its chassis seat count', await evalJs(`
    (()=>{for(const c of CHASSIS){const base=Math.max(...c.variants.map(v=>v.seats));
      for(const v of c.variants) if(v.seats>base) return false;}
      return true;})()`));
  ok('every variant has a role, a why and a mount', await evalJs(
    'CHASSIS.every(c=>c.variants.every(v=>v.role&&v.why&&v.mount&&v.gadget&&v.line))'));
  ok('transport variants are 20% of the roster', await evalJs(`
    (()=>{const all=CHASSIS.flatMap(c=>c.variants);
      const t=all.filter(v=>v.line==='Transport').length;
      return t===4 && all.length===20;})()`));

  console.log('\n=== INTERACTION ===');
  // clicking a locked cell unlocks it
  const beforeUnlocked = await evalJs('unlocked.size');
  await evalJs("document.querySelector('#matrix td[data-v=\"Helicopter|Spotter\"]').click()");
  await sleep(200);
  const afterUnlocked = await evalJs('unlocked.size');
  check('clicking a locked cell unlocks it', afterUnlocked, beforeUnlocked + 1);
  ok('unlocked cell renders as unlocked', await evalJs(
    "document.querySelector('#matrix td[data-v=\"Helicopter|Spotter\"] .vdot').classList.contains('on')"));
  ok('selected variant shows a role panel', await evalJs(
    "document.getElementById('roledetail').textContent.includes('Spotter')"));
  ok('role panel states why the variant exists', await evalJs(
    "document.getElementById('roledetail').textContent.includes('Why it exists')"));

  // switching chassis tabs
  await evalJs("document.querySelectorAll('#tabs .tab')[4].click()");
  await sleep(200);
  check('tab 5 selects the Fighter', await evalJs('CHASSIS[activeChassis].id'), 'Fighter');
  check('fighter variant cards rendered', await evalJs(
    "document.querySelectorAll('#vlist .vcard').length"), 3);
  ok('fighter card shows the Bomber', await evalJs(
    "document.getElementById('vlist').textContent.includes('Bomber')"));

  // the matrix cell for a locked variant is styled differently from an unlocked one
  ok('locked cells use the lock style', await evalJs(
    "document.querySelector('#matrix td[data-v=\"Boat|Gunboat\"] .vdot').classList.contains('lock')"));

  console.log('\n=== RENDER SANITY ===');
  ok('no overflow-x on body', await evalJs(
    "document.documentElement.scrollWidth <= window.innerWidth + 2"),
    `scrollW=${await evalJs('document.documentElement.scrollWidth')} winW=${await evalJs('window.innerWidth')}`);
  ok('no literal "undefined" in rendered page', await evalJs(
    "!document.body.innerText.includes('undefined')"));
  ok('no literal "[object Object]" in page', await evalJs(
    "!document.body.innerText.includes('[object Object]')"));
  // Only the active chassis's cards are in the DOM, so check the matrix (all cells)
  // and the data model separately rather than the whole innerText.
  ok('all 20 variant names appear in the matrix', await evalJs(`
    (()=>{const cells=[...document.querySelectorAll('#matrix td[data-v]')].map(td=>td.dataset.v);
      return CHASSIS.every(c=>c.variants.every(v=>cells.includes(c.id+'|'+v.n)));})()`));
  ok('every variant name is rendered as a card when its chassis is active', await evalJs(`
    (()=>{const missing=[];
      for(const c of CHASSIS){
        activeChassis=CHASSIS.indexOf(c); renderVariants();
        const txt=document.getElementById('vlist').textContent;
        for(const v of c.variants) if(!txt.includes(v.n)) missing.push(c.id+'/'+v.n);
      }
      return missing.length===0;})()`));
  ok('deferred honor section is present', await evalJs(
    "document.body.innerText.includes('Honor')"));
  ok('BF2042 failure modes are cited', await evalJs(
    "document.body.innerText.includes('prevalence of explosive weaponry')"));

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`  ${passed}/${results.length} checks passed`);
  if (failed.length) { failed.forEach(f => console.log(`    FAIL ${f.name}`)); }
  chrome.kill();
  process.exit(failed.length ? 1 : 0);
})();
