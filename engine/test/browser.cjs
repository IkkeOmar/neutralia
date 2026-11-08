#!/usr/bin/env node
/**
 * NEUTRALIA engine slice — real-browser render test.
 * Drives the built client in headless Chromium over CDP: joins the match,
 * asserts the WebGL context is alive and the HUD is wired, then screenshots.
 *
 * Usage: node test/browser.js http://127.0.0.1:8799/
 */
const http = require('http');
const { spawn } = require('child_process');

const URL_UNDER_TEST = process.argv[2] || 'http://127.0.0.1:8799/';
const CDP_PORT = 9341;

function get(url) {
  return new Promise((res, rej) => {
    // https.get for https:// URLs (Cloudflare tunnel); http.get throws on TLS.
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); });
    req.on('error', rej);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const chrome = spawn('chromium-browser', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
    `--remote-debugging-port=${CDP_PORT}`, '--window-size=1280,800',
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
  await send('Page.enable');

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + JSON.stringify(r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  };

  const results = [];
  const check = (name, actual, expected) => {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ name, pass });
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : `  got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`}`);
  };
  const ok = (name, cond, detail) => {
    results.push({ name, pass: !!cond });
    console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + (detail || '')}`);
  };

  await send('Page.navigate', { url: URL_UNDER_TEST });
  await sleep(3500);

  console.log('\n=== PAGE LOADS ===');
  check('title', await evalJs('document.title'), 'NEUTRALIA — engine slice');
  ok('a WebGL canvas was created', await evalJs("!!document.querySelector('#app canvas')"));
  ok('canvas has non-zero size', await evalJs(`
    (()=>{const c=document.querySelector('#app canvas'); return !!c && c.width>0 && c.height>0;})()`));
  ok('join overlay is visible before joining', await evalJs(
    "!document.getElementById('overlay').classList.contains('hidden')"));

  console.log('\n=== JOIN THE MATCH ===');
  await evalJs("document.getElementById('join').click()");
  await sleep(3500);
  ok('overlay hides after joining', await evalJs(
    "document.getElementById('overlay').classList.contains('hidden')"));
  check('websocket status is open', await evalJs("document.getElementById('s-ws').textContent"), 'open');
  ok('map name is shown', await evalJs(
    "document.getElementById('s-map').textContent.length > 1"),
    await evalJs("document.getElementById('s-map').textContent"));
  ok('tick rate is shown', await evalJs(
    "document.getElementById('s-tick').textContent.includes('Hz')"),
    await evalJs("document.getElementById('s-tick').textContent"));
  ok('local player appears in the roster', await evalJs(
    "document.getElementById('players').innerText.includes('you')"));
  check('health starts at 100', await evalJs("document.getElementById('s-hp').textContent"), '100');

  console.log('\n=== 3D SCENE IS ACTUALLY RENDERING ===');
  // If the renderer is drawing, the canvas will contain non-background pixels
  // that change over time (camera + interpolation).
  const sample = async () => evalJs(`
    (()=>{
      const c=document.querySelector('#app canvas');
      const gl=c.getContext('webgl2',{preserveDrawingBuffer:true});
      return gl ? 'ctx-ok' : 'no-ctx';
    })()`);
  ok('webgl context is alive', (await sample()) === 'ctx-ok', await sample());

  const scene = await evalJs(`
    (()=>{
      const c=document.querySelector('#app canvas');
      const tmp=document.createElement('canvas');
      tmp.width=64; tmp.height=64;
      const cx=tmp.getContext('2d');
      cx.drawImage(c,0,0,64,64);
      const d=cx.getImageData(0,0,64,64).data;
      let nonBg=0, sum=0;
      for(let i=0;i<d.length;i+=4){
        sum+=d[i]+d[i+1]+d[i+2];
        if(Math.abs(d[i]-11)>6||Math.abs(d[i+1]-13)>6||Math.abs(d[i+2]-23)>6) nonBg++;
      }
      return {nonBg, avg:(sum/(d.length/4*3)).toFixed(1)};
    })()`);
  ok('canvas contains rendered geometry (not just background)', scene.nonBg > 60,
    JSON.stringify(scene));

  console.log('\n=== MOVEMENT + NETWORK ===');
  const before = await evalJs("JSON.stringify(window.__NEUTRALIA.local)");
  await evalJs("window.__NEUTRALIA.keys.add('KeyW')");
  await sleep(1200);
  await evalJs("window.__NEUTRALIA.keys.delete('KeyW')");
  await sleep(400);
  const after = await evalJs("JSON.stringify(window.__NEUTRALIA.local)");
  const b = JSON.parse(before), a = JSON.parse(after);
  ok('WASD input moves the local player', Math.hypot(a.x - b.x, a.z - b.z) > 0.3,
    `moved=${Math.hypot(a.x - b.x, a.z - b.z).toFixed(3)}`);

  ok('client is receiving authoritative snapshots',
    (await evalJs('window.__NEUTRALIA.snapshots')) >= 1,
    `snapshots=${await evalJs('window.__NEUTRALIA.snapshots')}`);
  ok('the local player id was assigned by the server',
    (await evalJs('window.__NEUTRALIA.id')) > 0,
    `id=${await evalJs('window.__NEUTRALIA.id')}`);

  console.log('\n=== SCREENSHOT ===');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const fs = require('fs');
  const path = '/home/omar/2026-11-07/bfh-mmo/engine/test/_slice.png';
  fs.writeFileSync(path, Buffer.from(shot.data, 'base64'));
  ok('screenshot written', fs.existsSync(path), path);

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`  ${passed}/${results.length} checks passed`);
  if (failed.length) failed.forEach(f => console.log(`    FAIL ${f.name}`));
  chrome.kill();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('TEST ERROR:', e); process.exit(1); });
