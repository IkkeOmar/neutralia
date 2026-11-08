#!/usr/bin/env node
/**
 * DOM-level test of the NEUTRALIA prototype.
 * Drives the page in headless Chromium via CDP and asserts the real state,
 * not what the markup claims.
 *
 * Usage: node test-prototype.js http://127.0.0.1:8791/index.html
 */
const http = require('http');
const { spawn } = require('child_process');

const URL_UNDER_TEST = process.argv[2] || 'http://127.0.0.1:8791/index.html';
const CDP_PORT = 9333;

function get(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const chrome = spawn('chromium-browser', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    `--remote-debugging-port=${CDP_PORT}`, '--window-size=1400,1000',
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
  await send('Page.enable');
  await send('Runtime.enable');

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + JSON.stringify(r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  };

  await send('Page.navigate', { url: URL_UNDER_TEST });
  await sleep(2500);

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
  check('title', await evalJs('document.title'), 'NEUTRALIA — Weapon Specialisation Prototype');
  check('weapon name rendered', await evalJs("document.getElementById('wName').textContent"), 'StG 44');
  check('4 weapons defined', await evalJs('WEAPONS.length'), 4);
  check('12 doctrines defined', await evalJs('DOCTRINES.length'), 12);

  console.log('\n=== LEVEL / SPEC ===');
  check('starts at level 1', await evalJs('S.lvl'), 1);
  check('starts with 1 hero point', await evalJs('S.hp'), 1);
  for (let i = 0; i < 9; i++) await evalJs("document.getElementById('lvlUp').click()");
  check('level 10 reached', await evalJs('S.lvl'), 10);
  check('hero points = 6 at L10', await evalJs('S.hp'), 6);
  check('class points = 10 at L10', await evalJs('S.cp'), 10);
  ok('spec button enabled at L10', await evalJs("!document.getElementById('specBtn').disabled"));
  await evalJs("document.getElementById('specBtn').click()");
  ok('spec committed', await evalJs('!!S.spec'), 'S.spec=' + await evalJs('S.spec'));
  ok('doctrines unlocked by leveling', await evalJs('S.docs.length') > 0, 'count=' + await evalJs('S.docs.length'));
  check('doctrine slots at L10', await evalJs('docSlots()'), 2);

  console.log('\n=== WEAPON POINTS ARE EARNED BY USE ===');
  check('stg points start at 0', await evalJs('S.pts.stg'), 0);
  check('point cap is 8', await evalJs('WEAPON_POINT_CAP'), 8);
  for (let i = 0; i < 8; i++) await evalJs("document.getElementById('useBtn').click()");
  check('8 points after 8 uses', await evalJs('S.pts.stg'), 8);
  check('cannot exceed cap', await evalJs("(document.getElementById('useBtn').click(), S.pts.stg)"), 8);
  ok('core tree must be finished before signatures', await evalJs('coreDone("stg")') === false,
     'coreDone=' + await evalJs('coreDone("stg")'));

  console.log('\n=== TREE BRANCHING ===');
  await evalJs("document.querySelector('#tree .wp[data-n=\"0\"]').click()");
  check('node 1 bought', await evalJs('S.owned.stg.nodes'), [0]);
  check('points decremented by 1', await evalJs('S.pts.stg'), 7);
  await evalJs("document.querySelector('#tree .wp[data-n=\"1\"]').click()");
  check('branch committed to Marksmanship', await evalJs('S.owned.stg.nodes'), [0, 1]);
  check('points decremented by 2', await evalJs('S.pts.stg'), 5);
  const axesAfter = await evalJs('curAxes("stg")');
  const baseAxes = await evalJs('WEAPONS[0].base');
  ok('range axis increased by branch', axesAfter[1] > baseAxes[1], `base=${baseAxes} now=${axesAfter}`);
  ok('branch b not also taken', await evalJs('S.owned.stg.nodes.includes(2)') === false);
  ok('other branch is now locked', await evalJs("document.querySelector('#tree .wp[data-n=\"2\"]').classList.contains('lock')"));

  console.log('\n=== CORE NODES 4 & 5 ===');
  await evalJs("document.querySelector('#tree .wp[data-n=\"3\"]').click()");
  await evalJs("document.querySelector('#tree .wp[data-n=\"4\"]').click()");
  check('4 core nodes owned', await evalJs('S.owned.stg.nodes.length'), 4);
  check('core complete', await evalJs('coreDone("stg")'), true);
  check('remaining points', await evalJs('S.pts.stg'), 3);

  console.log('\n=== SIGNATURE PICK-ONE-OF-THREE ===');
  ok('3 signature options shown', await evalJs("document.querySelectorAll('#sigs .sig').length") === 3,
     'shown=' + await evalJs("document.querySelectorAll('#sigs .sig').length"));
  await evalJs("document.querySelector('#sigs .sig[data-s=\"0\"]').click()");
  check('signature tier 1 recorded', await evalJs('S.owned.stg.sigs'), ['Executioner']);
  check('points decremented', await evalJs('S.pts.stg'), 2);
  ok('respec button present', await evalJs("!!document.getElementById('rsBtn')"));
  check('respec costs 1500 valor', await evalJs('respecCost()'), 1500);

  console.log('\n=== SIGNATURE RESPEC ===');
  await evalJs("document.getElementById('rsBtn').click()");
  check('signature cleared', await evalJs('S.owned.stg.sigs'), []);
  check('point refunded', await evalJs('S.pts.stg'), 3);

  console.log('\n=== INVARIANT: points come from USE, not level ===');
  const before = await evalJs('S.pts.lee');
  for (let i = 0; i < 5; i++) await evalJs("document.getElementById('lvlUp').click()");
  check('unplayed weapon gains no points', await evalJs('S.pts.lee'), before);
  check('character level did increase', await evalJs('S.lvl'), 15);

  console.log('\n=== DOCTRINE CAPACITY ===');
  await evalJs("document.getElementById('equipBtn').click()");
  const docCount = await evalJs('S.docs.length');
  for (let i = 0; i < 8; i++) {
    await evalJs("document.querySelector('#doctrines .wp:not(.lock)')?.click()");
  }
  ok('doctrine capacity respected', await evalJs('S.equippedDocs.length') <= 5,
     `equipped=${await evalJs('S.equippedDocs.length')} of ${docCount} available`);

  console.log('\n=== NO PAGE ERRORS ===');
  const errs = await evalJs('window.__errs ? window.__errs.length : 0');
  check('no JS errors captured', errs, 0);

  const failed = results.filter(r => !r.pass);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('  FAILURES:');
    failed.forEach(f => console.log(`    - ${f.name}  got=${JSON.stringify(f.actual)} want=${JSON.stringify(f.expected)}`));
  }
  console.log('='.repeat(60));

  ws.close();
  chrome.kill();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
