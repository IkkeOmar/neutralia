#!/usr/bin/env node
/**
 * NEUTRALIA — browser test for the rocket jump.
 *
 * This is the end-to-end version of test/explosions.js: it drives a real
 * browser, fires a rocket at the ground under the player's own feet, and
 * asserts the player actually leaves the ground and comes back down.
 *
 * Usage: node test/browser-rocket.cjs [baseUrl]
 */

const { spawn } = require('node:child_process');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');

const BASE = process.argv[2] || 'http://127.0.0.1:8801';
const CHROME = process.env.CHROME_PATH || 'chromium-browser';

const results = [];
function ok(name, cond, detail) {
  results.push({ name, pass: !!cond });
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + (detail || '')}`);
}

function get(url) {
  return new Promise((res, rej) => {
    // https.get for https:// URLs - http.get throws on a TLS URL, which made
    // the test report "server never came up" against a Cloudflare tunnel.
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(d));
    });
    req.on('error', rej);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
  });
}

async function waitFor(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { await get(url); return true; } catch { await new Promise(r => setTimeout(r, 500)); }
  }
  return false;
}

(async () => {
  console.log('=== BROWSER ROCKET-JUMP TEST ===');
  console.log(`  target: ${BASE}`);

  if (!await waitFor(BASE + '/')) {
    console.error('  server never came up');
    process.exit(1);
  }

  // Launch chromium with a remote debugging port.
  const port = 9222 + Math.floor(Math.random() * 500);
  const userDir = path.join(require('node:os').tmpdir(), `neutralia-rocket-${Date.now()}`);
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--enable-unsafe-swiftshader',
    '--window-size=1280,720',
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => { try { chrome.kill('SIGKILL'); } catch {} };
  process.on('exit', cleanup);

  // Wait for the debugger endpoint.
  let wsUrl = null;
  for (let i = 0; i < 60; i++) {
    try {
      const info = JSON.parse(await get(`http://127.0.0.1:${port}/json/version`));
      wsUrl = info.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  if (!wsUrl) { console.error('  chromium did not start'); cleanup(); process.exit(1); }

  // Minimal CDP client over the built-in WebSocket (Node 22+ has it global).
  const WebSocket = globalThis.WebSocket;
  const sock = new WebSocket(wsUrl);
  await new Promise((res, rej) => { sock.onopen = res; sock.onerror = rej; });

  let msgId = 0;
  const pending = new Map();
  sock.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  };
  const cdp = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, { res, rej });
    sock.send(JSON.stringify({ id, method, params, sessionId }));
  });

  // Attach to a page target.
  const { targetInfos } = await cdp('Target.getTargets');
  const page = targetInfos.find(t => t.type === 'page');
  const { sessionId } = await cdp('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  const S = (method, params) => cdp(method, params, sessionId);

  await S('Page.enable');
  await S('Runtime.enable');
  await S('Page.navigate', { url: BASE + '/' });
  await new Promise(r => setTimeout(r, 3500));

  const evalJs = async (expr) => {
    const r = await S('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' +
      (r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  };

  // --- join ---
  const joined = await evalJs(`(()=>{
    const b = document.getElementById('join');
    if (b) b.click();
    return !!b;
  })()`);
  ok('join button exists', joined);

  await new Promise(r => setTimeout(r, 3000));

  // The glTF assets load AFTER the client boots (the 4.3 MB Rapier WASM has
  // to download and parse first). Poll until they arrive instead of
  // sampling once and reporting a false failure.
  let state = null;
  for (let i = 0; i < 40; i++) {
    state = await evalJs(`(()=>{
      const n = window.__NEUTRALIA;
      if (!n) return null;
      return {
        connected: n.connected, id: n.id,
        local: n.local, build: n.physicsBuild,
        assets: n.assetsLoaded, weapon: n.weapon, ammo: n.ammo
      };
    })()`);
    if (state && state.assets && state.assets.map && state.assets.soldier) break;
    await new Promise(r => setTimeout(r, 500));
  }
  ok('client connected', state && state.connected, JSON.stringify(state));
  ok('the client runs the standard Rapier build', state && state.build === 'standard',
    state && state.build);
  ok('the glTF map loaded', state && state.assets && state.assets.map === true,
    JSON.stringify(state && state.assets));
  ok('the glTF soldier loaded', state && state.assets && state.assets.soldier === true,
    JSON.stringify(state && state.assets));

  // The local player must actually BE the skinned model, not the primitive
  // fallback. Loading the asset is not enough: the mesh has to be built
  // from it.
  const meshKind = await evalJs(`(()=>{
    const n = window.__NEUTRALIA;
    return n.localMeshKind || null;
  })()`);
  ok('the local player is the skinned glTF model',
    meshKind && meshKind.kind === 'skinned',
    JSON.stringify(meshKind));
  ok('the skinned model carries its 19 bones',
    meshKind && meshKind.bones >= 19, JSON.stringify(meshKind));

  // --- switch to the rocket ---
  const switched = await evalJs(`(()=>{
    window.__NEUTRALIA.selectWeapon('rocket');
    return window.__NEUTRALIA.weapon;
  })()`);
  ok('the client can select the Panzerfaust', switched === 'rocket', switched);
  await new Promise(r => setTimeout(r, 1200));

  // --- establish a clean baseline -----------------------------------------
  // The player must be standing still on the ground before we measure, or
  // the jump height is polluted by the ordinary jump and the walk.
  await new Promise(r => setTimeout(r, 1500));
  const baseline = await evalJs(`(()=>{ const n=window.__NEUTRALIA; return n.local; })()`);
  ok('the player starts on the ground', baseline && baseline.y < 0.3 && baseline.onGround,
    JSON.stringify(baseline));

  // --- fire the rocket at the ground under our own feet ---
  // The client fires along the camera's forward vector, so we aim straight
  // down by pitching the camera hard. That is exactly the BFH rocket jump:
  // shoot the ground under yourself.
  const fired = await evalJs(`(()=>{
    const n = window.__NEUTRALIA;
    const before = n.local;
    // Pitch is POSITIVE = looking UP, so looking straight DOWN is -1.2.
    n.setPitch(-1.2);
    n.fire();
    return { before };
  })()`);
  ok('captured the pre-fire state', !!fired.before, JSON.stringify(fired));

  // Release the trigger immediately: a held trigger fired rocket after
  // rocket, which is not the BFH rocket jump and made the measurement noise.
  await new Promise(r => setTimeout(r, 150));
  await evalJs(`(()=>{ window.__NEUTRALIA.stopFire(); return true; })()`);

  // Wait for the rocket to detonate and the launch to happen. The rocket
  // flies 42 m/s, so it hits the ground within a frame or two.
  let peak = 0, samples = [], airborne = false, landed = false;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 100));
    const s = await evalJs(`(()=>{ const n=window.__NEUTRALIA; return n.local; })()`);
    if (!s) continue;
    samples.push(s.y);
    if (s.y > peak) peak = s.y;
    if (!s.onGround) airborne = true;
    // Once we have been airborne, come back down and settled, we can stop.
    if (airborne && s.onGround && i > 10) { landed = true; break; }
  }

  const netInfo = await evalJs(`(()=>{
    const n = window.__NEUTRALIA;
    return JSON.stringify({
      shots: n.shotsFired, explosions: n.explosionsSeen,
      last: n.lastExplosion, local: n.local
    });
  })()`);
  console.log(`  samples: ${samples.map(v => v.toFixed(2)).join(' ')}`);
  console.log(`  net: ${netInfo}`);
  ok('the server confirmed the shot', JSON.parse(netInfo).shots >= 1, netInfo);
  ok('the server broadcast the explosion', JSON.parse(netInfo).explosions >= 1, netInfo);
  ok('the player left the ground', airborne, `peak y=${peak.toFixed(2)}`);
  ok('the rocket jump reached a useful height', peak > 4, `peak y=${peak.toFixed(2)}`);
  ok('the player came back down', landed, `peak y=${peak.toFixed(2)}`);

  // --- the player must land again, not fall through the world ---
  await new Promise(r => setTimeout(r, 3000));
  const finalState = await evalJs(`(()=>{ const n=window.__NEUTRALIA; return n.local; })()`);
  ok('the player landed back on the ground',
    finalState && finalState.y > -0.5 && finalState.y < 1.5 && finalState.onGround,
    JSON.stringify(finalState));

  // --- the weapon bar renders ---
  const bar = await evalJs(`(()=>{
    const b = document.getElementById('weaponbar');
    if (!b) return null;
    return {
      tiles: b.children.length,
      active: b.querySelector('.w.active')?.dataset.weapon || null,
      labels: [...b.children].map(e => e.querySelector('b')?.textContent)
    };
  })()`);
  ok('the weapon bar rendered all four weapons',
    bar && bar.tiles === 4, JSON.stringify(bar));
  ok('the Panzerfaust is the active weapon', bar && bar.active === 'rocket',
    JSON.stringify(bar));

  // --- screenshot ---
  const shot = await S('Page.captureScreenshot', { format: 'png' });
  const outPath = path.join(__dirname, '_rocket.png');
  require('node:fs').writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  ok('screenshot written', require('node:fs').existsSync(outPath), outPath);
  console.log(`  screenshot: ${outPath}`);

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`  ${passed}/${results.length} checks passed`);
  if (failed.length) failed.forEach(f => console.log(`    FAIL ${f.name}`));

  cleanup();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('TEST ERROR:', e); process.exit(1); });
