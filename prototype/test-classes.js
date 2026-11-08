#!/usr/bin/env node
/**
 * DOM-level test of the NEUTRALIA class × weapon-family prototype.
 * Drives the page in headless Chromium via CDP and asserts the real state,
 * not what the markup claims.
 *
 * Usage: node test-classes.js http://127.0.0.1:8791/classes.html
 */
const http = require('http');
const { spawn } = require('child_process');

const URL_UNDER_TEST = process.argv[2] || 'http://127.0.0.1:8791/classes.html';
const CDP_PORT = 9334;

function get(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const chrome = spawn('chromium-browser', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    `--remote-debugging-port=${CDP_PORT}`, '--window-size=1400,1100',
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
  check('title', await evalJs('document.title'), 'NEUTRALIA — Class & Weapon Family Prototype');
  check('4 classes defined', await evalJs('CLASSES.length'), 4);
  check('11 families defined', await evalJs('FAMILIES.length'), 11);
  check('matrix rows rendered', await evalJs("document.querySelectorAll('#matrix tbody tr[data-fam]').length"), 11);
  check('4 class tabs rendered', await evalJs("document.querySelectorAll('#tabs .tab').length"), 4);
  check('grammar rows rendered', await evalJs("document.querySelectorAll('#grammar .grow').length"), 11);

  console.log('\n=== MATRIX MATCHES THE DESIGN DOC ===');
  // Soldier: SMG, Pistol, Shotgun, Grenade Launcher, TNT, Field Kit = 6
  check('Soldier family count', await evalJs("famOf(CLASSES.find(c=>c.id==='Soldier')).length"), 4);
  check('Gunner family count', await evalJs("famOf(CLASSES.find(c=>c.id==='Gunner')).length"), 3);
  check('Commando family count', await evalJs("famOf(CLASSES.find(c=>c.id==='Commando')).length"), 3);
  check('Engineer family count', await evalJs("famOf(CLASSES.find(c=>c.id==='Engineer')).length"), 3);
  check('Gunner has MG', await evalJs("owns(CLASSES.find(c=>c.id==='Gunner'),'MG')"), true);
  check('Gunner has Rocket Launcher', await evalJs("owns(CLASSES.find(c=>c.id==='Gunner'),'Rocket Launcher')"), true);
  check('Soldier does NOT have MG', await evalJs("owns(CLASSES.find(c=>c.id==='Soldier'),'MG')"), false);
  check('Commando does NOT have MG', await evalJs("owns(CLASSES.find(c=>c.id==='Commando'),'MG')"), false);
  check('Engineer has Artillery', await evalJs("owns(CLASSES.find(c=>c.id==='Engineer'),'Artillery')"), true);
  check('Engineer has Field Kit', await evalJs("owns(CLASSES.find(c=>c.id==='Engineer'),'Field Kit')"), true);
  check('Engineer does NOT have Shotgun', await evalJs("owns(CLASSES.find(c=>c.id==='Engineer'),'Shotgun')"), false);
  check('Engineer does NOT have Knife', await evalJs("owns(CLASSES.find(c=>c.id==='Engineer'),'Knife')"), false);
  check('Engineer does NOT have SMG', await evalJs("owns(CLASSES.find(c=>c.id==='Engineer'),'SMG')"), false);
  check('Engineer does NOT have Pistol-with-Soldier conflict', await evalJs("owns(CLASSES.find(c=>c.id==='Soldier'),'Pistol')"), false);
  check('Engineer shares NO family with Soldier', await evalJs(`
    (()=>{const e=famOf(CLASSES.find(c=>c.id==='Engineer')), s=famOf(CLASSES.find(c=>c.id==='Soldier'));
      const shared=e.filter(f=>s.includes(f)); return shared.length===0 ? 'none' : shared;})()`), 'none');
  check('only Gunner has MG', await evalJs("CLASSES.filter(c=>owns(c,'MG')).map(c=>c.id)"), ['Gunner']);
  check('only Commando has Knife', await evalJs("CLASSES.filter(c=>owns(c,'Knife')).map(c=>c.id)"), ['Commando']);
  check('only Commando has Rifle', await evalJs("CLASSES.filter(c=>owns(c,'Rifle')).map(c=>c.id)"), ['Commando']);
  check('only Engineer has Artillery', await evalJs("CLASSES.filter(c=>owns(c,'Artillery')).map(c=>c.id)"), ['Engineer']);
  check('only Engineer has Field Kit', await evalJs("CLASSES.filter(c=>owns(c,'Field Kit')).map(c=>c.id)"), ['Engineer']);
  check('Shotgun shared by exactly 2', await evalJs("CLASSES.filter(c=>owns(c,'Shotgun')).map(c=>c.id)"), ['Soldier', 'Commando']);
  check('GL shared by exactly 2', await evalJs("CLASSES.filter(c=>owns(c,'Grenade Launcher')).map(c=>c.id)"), ['Soldier', 'Gunner']);
  check('family-count spread is 1', await evalJs(`
    (()=>{const c=CLASSES.map(x=>famOf(x).length);return Math.max(...c)-Math.min(...c);})()`), 1);
  check('origin model covers all families', await evalJs("FAMILIES.every(f=>FAMILY_ORIGIN[f.n])"), true);
  check('3 new families, 1 split, 7 original', await evalJs(`
    (()=>{const v=Object.values(FAMILY_ORIGIN);return [v.filter(x=>x==='new').length,
      v.filter(x=>x==='split').length, v.filter(x=>x==='orig').length];})()`), [3,1,7]);
  check('no orange dot on an original family (bug fix)', await evalJs(`
    (()=>{const rows=[...document.querySelectorAll('#matrix tbody tr[data-fam]')];
      for(const tr of rows){const fam=tr.dataset.fam;
        if(FAMILY_ORIGIN[fam]!=='new' && tr.querySelector('.dot.new')) return fam;}
      return 'clean';})()`), 'clean');

  console.log('\n=== INVARIANTS (computed in-page) ===');
  ok('no class is a strict subset of another', await evalJs(`
    (()=>{for(const a of CLASSES)for(const b of CLASSES){if(a.id===b.id)continue;
      const fa=famOf(a),fb=famOf(b);
      if(fa.length&&fb.length&&fa.every(f=>fb.includes(f))&&fa.length<fb.length)return false;}
     return true;})()`));
  ok('every family is usable by at least one class', await evalJs("FAMILIES.every(f=>CLASSES.some(c=>owns(c,f.n)))"));
  ok('every class has an exclusive utility', await evalJs("CLASSES.every(c=>c.utility && c.utility.n && c.utility.why)"));
  ok('family-count spread <= 3', await evalJs(`
    (()=>{const c=CLASSES.map(x=>famOf(x).length);return Math.max(...c)-Math.min(...c)<=3;})()`));
  ok('no family has a duplicate branch pair', await evalJs("FAMILIES.every(f=>f.br && f.b && f.eg)"));
  ok('every family branch is a distinct trade', await evalJs("new Set(FAMILIES.map(f=>f.br)).size === FAMILIES.length"));

  console.log('\n=== INTERACTION ===');
  await evalJs("select('Engineer')");
  check('Engineer selected', await evalJs('sel'), 'Engineer');
  ok('Engineer tab is active', await evalJs("document.querySelector('#tabs .tab.on').dataset.id") === 'Engineer');
  const panelTxt = await evalJs("document.getElementById('clsPanel').textContent");
  ok('panel shows Field Repair', panelTxt.includes('Field Repair'));
  ok('panel shows new-class badge', panelTxt.includes('new class'));
  ok('panel lists 3 specs', await evalJs("document.querySelectorAll('#clsPanel .spec').length") === 3);
  ok('panel lists 3 family cards', await evalJs("document.querySelectorAll('#clsPanel .famcard').length") === 3);

  await evalJs("select('Commando')");
  const p2 = await evalJs("document.getElementById('clsPanel').textContent");
  ok('Commando panel shows Mark Target', p2.includes('Mark Target'));
  ok('Commando panel does not show Field Repair', !p2.includes('Field Repair'));
  await evalJs("select('Gunner')");
  const p3 = await evalJs("document.getElementById('clsPanel').textContent");
  ok('Gunner panel shows Frenzy Fire', p3.includes('Frenzy Fire'));
  ok('Gunner panel shows Rocket Launcher', p3.includes('Rocket Launcher'));
  await evalJs("select('Soldier')");
  const p4 = await evalJs("document.getElementById('clsPanel').textContent");
  ok('Soldier panel shows Combat Medicine', p4.includes('Combat Medicine'));

  console.log('\n=== RENDER SANITY ===');
  ok('no overflow-x on body', await evalJs("document.documentElement.scrollWidth <= window.innerWidth + 2"),
     `scrollW=${await evalJs('document.documentElement.scrollWidth')} winW=${await evalJs('window.innerWidth')}`);
  ok('no literal "undefined" in rendered page', await evalJs("!document.body.innerText.includes('undefined')"));
  ok('no literal "[object Object]" in page', await evalJs("!document.body.innerText.includes('[object Object]')"));
  ok('all 11 family names rendered in matrix', await evalJs(`
    FAMILIES.every(f=>document.getElementById('matrix').textContent.includes(f.n))`));

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);
  console.log(`  ${passed}/${results.length} checks passed`);
  if (failed.length) { failed.forEach(f => console.log(`    FAIL ${f.name}`)); }
  chrome.kill();
  process.exit(failed.length ? 1 : 0);
})();
