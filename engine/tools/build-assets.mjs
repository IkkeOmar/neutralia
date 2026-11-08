#!/usr/bin/env node
// NEUTRALIA asset pipeline — build script.
//
// Generates two Meshopt-compressed glTF 2.0 (GLB) assets from the shared map
// definition and a procedural soldier rig:
//
//   assets/map.glb     grey-box map, one mesh node per box in shared/map.js
//   assets/soldier.glb skinned low-poly soldier (bones + 2 animation clips)
//
// The glTF JSON + binary buffer are authored directly (no GLTFExporter), which
// gives us full, deterministic control over skinning (JOINTS_0/WEIGHTS_0,
// inverseBindMatrices) and animation channels. Compression is applied by the
// gltf-transform CLI (EXT_meshopt_compression), which also compresses the
// animation tracks — the reason we avoid Draco here.
//
// Run from the engine directory:  node tools/build-assets.mjs
//
// Deterministic: floats are rounded to 6 decimals, all loops are ordered, and
// the meshopt step is a fixed library version, so re-running yields identical
// bytes.

import * as THREE from 'three';
import { MAP } from '../shared/map.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// The assets live in client/public/assets/ because that is what Vite copies
// into the build output. Writing them anywhere else means the client 404s
// on them at runtime - which is exactly the bug this directory choice fixes.
const ASSETS = path.join(ROOT, 'client', 'public', 'assets');
const CLI = path.join(ROOT, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');

// ---------------------------------------------------------------- palette
const KIND_COLOR = { wall: 0x39406b, cover: 0x4a4270, ramp: 0x3c5a63, tower: 0x5a4a78 };

// ---------------------------------------------------------------- helpers
const r6 = (v) => { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? 0 : r; };
const f32 = (arr) => { const out = new Float32Array(arr.length); for (let i = 0; i < arr.length; i++) out[i] = r6(arr[i]); return out; };
const hexRgb = (hex) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255].map(r6);

// binary buffer writer (aligned, deterministic)
class Bin {
  constructor() { this.parts = []; this.len = 0; }
  align(n) { const pad = (n - (this.len % n)) % n; if (pad) { this.parts.push(new Uint8Array(pad)); this.len += pad; } }
  put(u8) { this.parts.push(u8); this.len += u8.byteLength; return this.len - u8.byteLength; }
  concat() { const out = new Uint8Array(this.len); let o = 0; for (const p of this.parts) { out.set(p, o); o += p.byteLength; } return out; }
}

// glTF document builder: tracks accessors + bufferViews against one buffer
class GLTFDoc {
  constructor() {
    this.accessors = [];
    this.bufferViews = [];
    this.bin = new Bin();
  }
  writeAccessor({ type, componentType, data, min, max, name }) {
    this.bin.align(4);
    let bytes;
    if (componentType === 5126) bytes = new Uint8Array(f32(data).buffer);          // FLOAT
    else if (componentType === 5123) bytes = new Uint8Array(new Uint16Array(data).buffer); // UNSIGNED_SHORT
    else if (componentType === 5121) bytes = new Uint8Array(data);                  // UNSIGNED_BYTE
    else throw new Error('unsupported componentType ' + componentType);
    const byteOffset = this.bin.put(bytes);
    const bvIndex = this.bufferViews.length;
    this.bufferViews.push({ buffer: 0, byteOffset, byteLength: bytes.byteLength });
    const acc = { bufferView: bvIndex, componentType, count: data.length / ({ SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }[type]), type };
    if (min) acc.min = min;
    if (max) acc.max = max;
    if (name) acc.name = name;
    this.accessors.push(acc);
    return this.accessors.length - 1;
  }
}

// ---------------------------------------------------------------- GLB packing
function packGLB(jsonObj, binU8) {
  const jsonStr = JSON.stringify(jsonObj);
  const jsonU8 = new Uint8Array(Buffer.from(jsonStr, 'utf8'));
  const jsonPad = (4 - (jsonU8.length % 4)) % 4;
  const binPad = (4 - (binU8.length % 4)) % 4;
  const jsonChunkLen = jsonU8.length + jsonPad;
  const binChunkLen = binU8.length + binPad;
  const total = 12 + 8 + jsonChunkLen + 8 + binChunkLen;
  const out = Buffer.alloc(total);
  let o = 0;
  out.write('glTF', o, 'ascii'); o += 4;
  out.writeUInt32LE(2, o); o += 4;
  out.writeUInt32LE(total, o); o += 4;
  out.writeUInt32LE(jsonChunkLen, o); o += 4;
  out.writeUInt32LE(0x4e4f534a, o); o += 4; // 'JSON'
  out.set(Buffer.from(jsonU8), o); o += jsonU8.length;
  for (let i = 0; i < jsonPad; i++) out[o++] = 0x20;
  out.writeUInt32LE(binChunkLen, o); o += 4;
  out.writeUInt32LE(0x004e4942, o); o += 4; // 'BIN\0'
  out.set(Buffer.from(binU8), o); o += binU8.length;
  for (let i = 0; i < binPad; i++) out[o++] = 0;
  return out;
}

// ---------------------------------------------------------------- map
function buildMap() {
  const doc = new GLTFDoc();
  const nodes = [];
  const meshes = [];
  MAP.boxes.forEach((b, i) => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const pos = Array.from(geo.attributes.position.array).map(r6);
    const nrm = Array.from(geo.attributes.normal.array).map(r6);
    const idx = Array.from(geo.index.array);
    const [cr, cg, cb] = hexRgb(KIND_COLOR[b.kind] ?? 0x44507a);
    const col = [];
    for (let v = 0; v < geo.attributes.position.count; v++) col.push(cr, cg, cb);

    const posAcc = doc.writeAccessor({
      type: 'VEC3', componentType: 5126, data: pos,
      min: [-b.w / 2, -b.h / 2, -b.d / 2].map(r6), max: [b.w / 2, b.h / 2, b.d / 2].map(r6)
    });
    const nrmAcc = doc.writeAccessor({ type: 'VEC3', componentType: 5126, data: nrm });
    const colAcc = doc.writeAccessor({ type: 'VEC3', componentType: 5126, data: col });
    const idxAcc = doc.writeAccessor({ type: 'SCALAR', componentType: 5123, data: idx });

    meshes.push({
      name: `${b.kind}_${i}`,
      primitives: [{ attributes: { POSITION: posAcc, NORMAL: nrmAcc, COLOR_0: colAcc }, indices: idxAcc, material: 0, mode: 4 }]
    });
    nodes.push({ name: `${b.kind}_${i}`, mesh: i, translation: [r6(b.x), r6(b.y + b.h / 2), r6(b.z)] });
  });

  return [{
    asset: { version: '2.0', generator: 'neutralia-build' },
    scene: 0,
    scenes: [{ name: 'map', nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials: [{ name: 'greybox', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0.05, roughnessFactor: 0.85 } }],
    accessors: doc.accessors,
    bufferViews: doc.bufferViews,
    buffers: [{ byteLength: doc.bin.len }]
  }, doc.bin.concat()];
}

// ---------------------------------------------------------------- soldier
const BONES = [
  { name: 'root',      parent: -1, pos: [0, 0.98, 0] },
  { name: 'spine',     parent: 0,  pos: [0, 0.18, 0] },
  { name: 'chest',     parent: 1,  pos: [0, 0.16, 0] },
  { name: 'neck',      parent: 2,  pos: [0, 0.16, 0] },
  { name: 'head',      parent: 3,  pos: [0, 0.14, 0] },
  { name: 'shoulderL', parent: 2,  pos: [0.14, 0.04, 0] },
  { name: 'upperArmL', parent: 5,  pos: [0.08, -0.02, 0] },
  { name: 'lowerArmL', parent: 6,  pos: [0, -0.26, 0] },
  { name: 'handL',     parent: 7,  pos: [0, -0.22, 0] },
  { name: 'shoulderR', parent: 2,  pos: [-0.14, 0.04, 0] },
  { name: 'upperArmR', parent: 9,  pos: [-0.08, -0.02, 0] },
  { name: 'lowerArmR', parent: 10, pos: [0, -0.26, 0] },
  { name: 'handR',     parent: 11, pos: [0, -0.22, 0] },
  { name: 'upperLegL', parent: 0,  pos: [0.09, 0, 0] },
  { name: 'lowerLegL', parent: 13, pos: [0, -0.48, 0] },
  { name: 'footL',     parent: 14, pos: [0, -0.4, 0] },
  { name: 'upperLegR', parent: 0,  pos: [-0.09, 0, 0] },
  { name: 'lowerLegR', parent: 16, pos: [0, -0.48, 0] },
  { name: 'footR',     parent: 17, pos: [0, -0.4, 0] },
];
const BI = Object.fromEntries(BONES.map((b, i) => [b.name, i]));

// body part: [center x/y/z, size w/h/d (or sphere radius), bone name, colour]
const BOX = (cx, cy, cz, w, h, d, bone, color) => ({ kind: 'box', cx, cy, cz, w, h, d, bone, color });
const SPHERE = (cx, cy, cz, r, bone, color) => ({ kind: 'sphere', cx, cy, cz, r, bone, color });

const PARTS = [
  BOX(0, 0.98, 0, 0.34, 0.24, 0.24, 'root', 0x39406b),       // pelvis
  BOX(0, 1.24, 0, 0.38, 0.16, 0.26, 'spine', 0x7c5cfc),      // abdomen
  BOX(0, 1.41, 0, 0.44, 0.22, 0.30, 'chest', 0x7c5cfc),      // chest
  BOX(0, 1.55, 0, 0.12, 0.10, 0.12, 'neck', 0xe8eaf2),       // neck
  SPHERE(0, 1.68, 0, 0.22, 'head', 0xe8eaf2),                // head
  BOX(0, 1.68, 0.20, 0.30, 0.10, 0.06, 'head', 0x38bdf8),    // visor
  BOX(0.22, 1.21, 0, 0.14, 0.26, 0.14, 'upperArmL', 0x7c5cfc),
  BOX(0.22, 0.97, 0, 0.11, 0.22, 0.11, 'lowerArmL', 0x7c5cfc),
  BOX(0.22, 0.86, 0, 0.09, 0.10, 0.09, 'handL', 0xe8eaf2),
  BOX(-0.22, 1.21, 0, 0.14, 0.26, 0.14, 'upperArmR', 0x7c5cfc),
  BOX(-0.22, 0.97, 0, 0.11, 0.22, 0.11, 'lowerArmR', 0x7c5cfc),
  BOX(-0.22, 0.86, 0, 0.09, 0.10, 0.09, 'handR', 0xe8eaf2),
  BOX(0.09, 0.74, 0, 0.18, 0.48, 0.18, 'upperLegL', 0x39406b),
  BOX(0.09, 0.30, 0, 0.14, 0.40, 0.14, 'lowerLegL', 0x39406b),
  BOX(0.09, 0.07, 0.10, 0.12, 0.14, 0.24, 'footL', 0x22252f),
  BOX(-0.09, 0.74, 0, 0.18, 0.48, 0.18, 'upperLegR', 0x39406b),
  BOX(-0.09, 0.30, 0, 0.14, 0.40, 0.14, 'lowerLegR', 0x39406b),
  BOX(-0.09, 0.07, 0.10, 0.12, 0.14, 0.24, 'footR', 0x22252f),
  BOX(-0.24, 1.02, 0.32, 0.07, 0.13, 0.80, 'handR', 0x22252f), // weapon
];

function triangulate(geo) {
  const idx = geo.index.array;
  const tris = [];
  for (let i = 0; i < idx.length; i += 3) tris.push([idx[i], idx[i + 1], idx[i + 2]]);
  return tris;
}

function mergeParts() {
  const pos = [], nrm = [], col = [], joints = [], weights = [];
  for (const p of PARTS) {
    const geo = p.kind === 'sphere' ? new THREE.SphereGeometry(p.r, 16, 12) : new THREE.BoxGeometry(p.w, p.h, p.d);
    const pa = geo.attributes.position.array;
    const na = geo.attributes.normal.array;
    const [cr, cg, cb] = hexRgb(p.color);
    const bone = BI[p.bone];
    for (const tri of triangulate(geo)) {
      for (const vi of tri) {
        pos.push(pa[vi * 3] + p.cx, pa[vi * 3 + 1] + p.cy, pa[vi * 3 + 2] + p.cz);
        nrm.push(na[vi * 3], na[vi * 3 + 1], na[vi * 3 + 2]);
        col.push(cr, cg, cb);
        joints.push(bone, 0, 0, 0);
        weights.push(1, 0, 0, 0);
      }
    }
  }
  return { pos, nrm, col, joints, weights };
}

// ---- animation
function quat(rx, ry, rz) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ'));
  return [r6(q.x), r6(q.y), r6(q.z), r6(q.w)];
}

const RUN = { period: 0.8, keys: 9 };
function runPose(t) {
  const ph = (t / RUN.period) * Math.PI * 2;
  const legAmp = 0.85, armAmp = 0.7, kneeAmp = 1.1, elbow = 0.4, lean = 0.18;
  const L = legAmp * Math.sin(ph), R = legAmp * Math.sin(ph + Math.PI);
  return {
    root: { tx: 0, ty: 0.98 + 0.06 * Math.sin(2 * ph), tz: 0 },
    spine: { rx: lean + 0.05 * Math.sin(ph) },
    chest: { rx: lean * 0.5 },
    head: { rx: -0.08 },
    upperArmL: { rx: armAmp * Math.sin(ph + Math.PI) }, lowerArmL: { rx: -elbow },
    upperArmR: { rx: armAmp * Math.sin(ph) }, lowerArmR: { rx: -elbow },
    upperLegL: { rx: L }, lowerLegL: { rx: kneeAmp * Math.max(0, Math.sin(ph)) },
    upperLegR: { rx: R }, lowerLegR: { rx: kneeAmp * Math.max(0, Math.sin(ph + Math.PI)) }
  };
}

const IDLE = { period: 2.5, keys: 9 };
function idlePose(t) {
  const ph = (t / IDLE.period) * Math.PI * 2;
  const breathe = 0.04 * Math.sin(ph);
  return {
    root: { tx: 0, ty: 0.98 + 0.012 * Math.sin(ph), tz: 0 },
    spine: { rx: breathe * 0.5 },
    chest: { rx: breathe },
    head: { rx: -breathe * 0.4, ry: 0.04 * Math.sin(ph * 0.5) },
    upperArmL: { rx: 0.06, rz: 0.05 * Math.sin(ph) },
    upperArmR: { rx: 0.06, rz: -0.05 * Math.sin(ph) }
  };
}

function buildClip(doc, name, def, poseFn) {
  const times = [];
  for (let k = 0; k < def.keys; k++) times.push(r6((def.period * k) / (def.keys - 1)));
  const timeAcc = doc.writeAccessor({
    type: 'SCALAR', componentType: 5126, data: times, min: [times[0]], max: [times[times.length - 1]]
  });
  const rot = new Map(); // boneIndex -> flat [x,y,z,w] * keys
  const tra = new Map();
  for (let k = 0; k < def.keys; k++) {
    const pose = poseFn(times[k]);
    for (const [boneName, t] of Object.entries(pose)) {
      const bi = BI[boneName];
      if (t.rx !== undefined || t.ry !== undefined || t.rz !== undefined) {
        if (!rot.has(bi)) rot.set(bi, []);
        rot.get(bi).push(...quat(t.rx || 0, t.ry || 0, t.rz || 0));
      }
      if (t.tx !== undefined || t.ty !== undefined || t.tz !== undefined) {
        if (!tra.has(bi)) tra.set(bi, []);
        tra.get(bi).push(r6(t.tx || 0), r6(t.ty || 0), r6(t.tz || 0));
      }
    }
  }
  const channelsDef = [];
  for (const bi of [...rot.keys()].sort((a, b) => a - b)) channelsDef.push({ node: bi, path: 'rotation', values: rot.get(bi) });
  for (const bi of [...tra.keys()].sort((a, b) => a - b)) channelsDef.push({ node: bi, path: 'translation', values: tra.get(bi) });

  const samplers = [];
  const channels = [];
  for (const cd of channelsDef) {
    const type = cd.path === 'rotation' ? 'VEC4' : 'VEC3';
    const outAcc = doc.writeAccessor({ type, componentType: 5126, data: cd.values });
    samplers.push({ input: timeAcc, output: outAcc, interpolation: 'LINEAR' });
    channels.push({ sampler: samplers.length - 1, target: { node: cd.node, path: cd.path } });
  }
  return { name, samplers, channels };
}

function buildSoldier() {
  const doc = new GLTFDoc();
  const merged = mergeParts();

  // rest world positions + inverse bind matrices
  const worldPos = new Array(BONES.length);
  for (let i = 0; i < BONES.length; i++) {
    worldPos[i] = BONES[i].parent < 0
      ? BONES[i].pos.slice()
      : BONES[i].pos.map((p, k) => p + worldPos[BONES[i].parent][k]);
  }
  const ibm = [];
  for (let i = 0; i < BONES.length; i++) {
    const m = new THREE.Matrix4().makeTranslation(-worldPos[i][0], -worldPos[i][1], -worldPos[i][2]);
    for (const e of m.elements) ibm.push(r6(e));
  }
  const ibmAcc = doc.writeAccessor({ type: 'MAT4', componentType: 5126, data: ibm });

  // nodes: bones then the skinned mesh node
  const nodes = [];
  BONES.forEach((b) => {
    const n = { name: b.name, translation: b.pos.map(r6) };
    const children = [];
    BONES.forEach((c, ci) => { if (c.parent === BONES.indexOf(b)) children.push(ci); });
    if (children.length) n.children = children;
    nodes.push(n);
  });
  const MESH_NODE = nodes.length;
  nodes.push({ name: 'soldier', mesh: 0, skin: 0 });

  // geometry accessors
  const posAcc = doc.writeAccessor({ type: 'VEC3', componentType: 5126, data: merged.pos, min: minMax3(merged.pos, true), max: minMax3(merged.pos, false) });
  const nrmAcc = doc.writeAccessor({ type: 'VEC3', componentType: 5126, data: merged.nrm });
  const colAcc = doc.writeAccessor({ type: 'VEC3', componentType: 5126, data: merged.col });
  const jointAcc = doc.writeAccessor({ type: 'VEC4', componentType: 5121, data: merged.joints });
  const weightAcc = doc.writeAccessor({ type: 'VEC4', componentType: 5126, data: merged.weights });

  const meshes = [{
    name: 'soldier',
    primitives: [{
      attributes: { POSITION: posAcc, NORMAL: nrmAcc, COLOR_0: colAcc, JOINTS_0: jointAcc, WEIGHTS_0: weightAcc },
      material: 0, mode: 4
    }]
  }];

  const skins = [{ name: 'soldier-skin', inverseBindMatrices: ibmAcc, joints: BONES.map((_, i) => i), skeleton: 0 }];

  const animations = [
    buildClip(doc, 'idle', IDLE, idlePose),
    buildClip(doc, 'run', RUN, runPose)
  ];

  return [{
    asset: { version: '2.0', generator: 'neutralia-build' },
    scene: 0,
    scenes: [{ name: 'soldier', nodes: [0, MESH_NODE] }],
    nodes, meshes, skins, animations,
    materials: [{ name: 'soldier', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.6 } }],
    accessors: doc.accessors,
    bufferViews: doc.bufferViews,
    buffers: [{ byteLength: doc.bin.len }]
  }, doc.bin.concat()];
}

function minMax3(flat, isMin) {
  const out = new Array(3);
  for (let c = 0; c < 3; c++) {
    let v = flat[c];
    for (let i = c; i < flat.length; i += 3) v = isMin ? Math.min(v, flat[i]) : Math.max(v, flat[i]);
    out[c] = r6(v);
  }
  return out;
}

// ---------------------------------------------------------------- meshopt
function compress(inFile, outFile) {
  const res = spawnSync(process.execPath, [CLI, 'meshopt', inFile, outFile, '--level', 'high'], {
    cwd: ROOT, encoding: 'utf8'
  });
  if (res.status !== 0) {
    throw new Error(`gltf-transform meshopt failed:\n${res.stderr || res.stdout}`);
  }
}

// ---------------------------------------------------------------- main
function main() {
  fs.mkdirSync(ASSETS, { recursive: true });
  const tmp = os.tmpdir();

  const [mapJson, mapBin] = buildMap();
  const mapRaw = path.join(tmp, 'neutralia-map.raw.glb');
  fs.writeFileSync(mapRaw, packGLB(mapJson, mapBin));
  compress(mapRaw, path.join(ASSETS, 'map.glb'));

  const [solJson, solBin] = buildSoldier();
  const solRaw = path.join(tmp, 'neutralia-soldier.raw.glb');
  fs.writeFileSync(solRaw, packGLB(solJson, solBin));
  compress(solRaw, path.join(ASSETS, 'soldier.glb'));

  fs.rmSync(mapRaw, { force: true });
  fs.rmSync(solRaw, { force: true });

  for (const f of ['map.glb', 'soldier.glb']) {
    const p = path.join(ASSETS, f);
    console.log(`${f}  ${fs.statSync(p).size} bytes`);
  }
}

main();
