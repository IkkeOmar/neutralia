/**
 * Directional movement test.
 *
 * The bug it exists to prevent: A and D moved the player the WRONG way on
 * screen. The source looked plausible - `+X` for "strafe right" - but the
 * camera's screen-right is -X when facing +Z, so the player went left when
 * pressing D.
 *
 * Distance-based movement tests cannot catch this. Every earlier test
 * asserted only that the player MOVED, so an inverted strafe passed.
 *
 * The assertion here is made against Three.js's own matrixWorld basis:
 * column 0 is screen-right, column 1 is up, and the camera looks down -Z.
 * That is ground truth - it cannot be argued both ways the way a hand-derived
 * trigonometry can.
 *
 * Expected:
 *   W -> along the aim vector  (dot > 0.7)
 *   S -> against the aim vector (dot < -0.7)
 *   D -> along screen-right    (dot > 0.7)
 *   A -> against screen-right  (dot < -0.7)
 */
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');

const BASE = process.argv[2] || 'http://127.0.0.1:8800';
const CHROME = process.env.CHROME || 'chromium-browser';
const results = [];

function ok(name, cond, detail) {
  results.push({ name, pass: !!cond });
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + (detail || '')}`);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(url) {
  return new Promise((res, rej) => {
    const mod = url.startsWith('https:') ? require('node:https') : http;
    const req = mod.get(url, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', rej);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
  });
}

(async () => {
  console.log('=== BROWSER DIRECTION TEST ===');
  console.log(`  target: ${BASE}`);

  const port = 9700 + Math.floor(Math.random() * 250);
  const userDir = path.join(os.tmpdir(), `neutralia-dir-${Date.now()}`);
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`, '--no-sandbox', '--disable-gpu-sandbox',
    '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
    'about:blank'
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 60; i++) {
    await sleep(400);
    try { targets = JSON.parse(await get(`http://127.0.0.1:${port}/json`)); break; } catch {}
  }
  if (!targets) { console.error('  chromium did not start'); chrome.kill(); process.exit(1); }

  const page = targets.find(t => t.type === 'page');
  const WebSocket = require('ws');
  const sock = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  let id = 0; const pend = new Map();
  sock.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { res, rej } = pend.get(m.id); pend.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  };
  await new Promise((res, rej) => { sock.onopen = res; sock.onerror = rej; });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej });
    sock.send(JSON.stringify({ id: i, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: BASE + '/' });

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };

  // Wait for the client to boot.
  let booted = false;
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    try { if (await evalJs("!!window.__NEUTRALIA")) { booted = true; break; } } catch {}
  }
  if (!booted) { console.error('  client never booted'); chrome.kill(); process.exit(1); }

  await evalJs("document.getElementById('join').click()");
  await sleep(1500);

  const dot2 = (a, b) => a.x * b.x + a.z * b.z;

  async function trial(key, yaw, want, expectSign, label) {
    await evalJs(`window.__NEUTRALIA.setYaw(${yaw})`);
    await sleep(350);
    const a0 = JSON.parse(await evalJs("JSON.stringify(window.__NEUTRALIA.local)"));
    const basis = JSON.parse(await evalJs("JSON.stringify(window.__NEUTRALIA.cameraBasis)"));
    const aim = JSON.parse(await evalJs("JSON.stringify(window.__NEUTRALIA.aim)"));
    await evalJs(`window.__NEUTRALIA.keys.add('${key}')`);
    await sleep(900);
    await evalJs(`window.__NEUTRALIA.keys.delete('${key}')`);
    await sleep(250);
    const a1 = JSON.parse(await evalJs("JSON.stringify(window.__NEUTRALIA.local)"));
    const mv = { x: a1.x - a0.x, z: a1.z - a0.z };
    const d = Math.hypot(mv.x, mv.z);
    if (d < 0.2) { ok(`${key} moves the player ${want}`, false, `no movement (d=${d.toFixed(3)})`); return; }
    const u = { x: mv.x / d, z: mv.z / d };
    const target = want === 'forward' ? aim : basis.right;
    const dot = dot2(u, target);
    const good = expectSign > 0 ? dot > 0.7 : dot < -0.7;
    ok(`${key} moves the player ${label || want}`, good,
      `dot=${dot.toFixed(3)} moved=(${mv.x.toFixed(2)},${mv.z.toFixed(2)})`);
  }

  console.log('\n=== STRAFE DIRECTION (the inverted-A/D bug) ===');
  await trial('KeyD', 0, 'screen-right', +1, 'to screen-RIGHT');
  await trial('KeyA', 0, 'screen-right', -1, 'to screen-LEFT');
  await trial('KeyD', Math.PI / 2, 'screen-right', +1, 'to screen-RIGHT');
  await trial('KeyA', Math.PI / 2, 'screen-right', -1, 'to screen-LEFT');
  await trial('KeyD', Math.PI, 'screen-right', +1, 'to screen-RIGHT');
  await trial('KeyA', Math.PI, 'screen-right', -1, 'to screen-LEFT');

  console.log('\n=== FORWARD / BACK ===');
  await trial('KeyW', 0, 'forward', +1, 'FORWARD');
  await trial('KeyS', 0, 'forward', -1, 'BACKWARD');
  await trial('KeyW', Math.PI / 2, 'forward', +1, 'FORWARD');
  await trial('KeyS', Math.PI / 2, 'forward', -1, 'BACKWARD');

  console.log('\n=== CAMERA PLACEMENT ===');
  const cam = JSON.parse(await evalJs("JSON.stringify(window.__NEUTRALIA.camera)"));
  const lp = JSON.parse(await evalJs("JSON.stringify(window.__NEUTRALIA.local)"));
  const aim = JSON.parse(await evalJs("JSON.stringify(window.__NEUTRALIA.aim)"));
  const off = { x: cam.x - lp.x, z: cam.z - lp.z };
  const offLen = Math.hypot(off.x, off.z);
  const camDot = offLen > 0.1 ? dot2({ x: off.x / offLen, z: off.z / offLen }, aim) : 0;
  ok('the camera sits BEHIND the player, along the aim axis', camDot < -0.9,
    `camDot=${camDot.toFixed(3)}`);

  chrome.kill('SIGKILL');
  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  console.log(`  ${passed}/${results.length} checks passed`);
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
