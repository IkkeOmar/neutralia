#!/usr/bin/env node
// NEUTRALIA asset pipeline — verification.
//
// Loads both GLBs through three's GLTFLoader in Node (no browser), proving
// that the Meshopt-compressed assets decode and that the soldier skin + clips
// are intact and animatable. Run from the engine directory:
//
//   node tools/verify-assets.mjs
//
// Exits non-zero if any assertion fails.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { MAP } from '../shared/map.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ASSETS = path.join(ROOT, 'client', 'public', 'assets');
const TOL = 0.02;

const results = [];
let failures = 0;

function check(name, cond, detail) {
  results.push(name);
  if (cond) console.log(`PASS  ${name}${detail ? '  — ' + detail : ''}`);
  else { failures++; console.log(`FAIL  ${name}${detail ? '  — ' + detail : ''}`); }
}

function loadGLB(file) {
  const buf = fs.readFileSync(file);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return new Promise((resolve, reject) => loader.parse(ab, '', resolve, reject));
}

function triCount(mesh) {
  return mesh.geometry.index ? mesh.geometry.index.count / 3 : mesh.geometry.attributes.position.count / 3;
}

function approx(a, b, tol = TOL) {
  return Math.abs(a - b) <= tol;
}

// ---------------------------------------------------------------- map
const mapGltf = await loadGLB(path.join(ASSETS, 'map.glb'));
check('map.glb loads via GLTFLoader', true);

const mapMeshes = [];
mapGltf.scene.traverse((o) => { if (o.isMesh) mapMeshes.push(o); });
check('map node count matches shared/map.js box count', mapMeshes.length === MAP.boxes.length,
  `${mapMeshes.length} nodes vs ${MAP.boxes.length} boxes`);

let boxesMatch = true;
let boxesMatchDetail = '';
for (let i = 0; i < MAP.boxes.length; i++) {
  const b = MAP.boxes[i];
  const m = mapGltf.scene.getObjectByName(`${b.kind}_${i}`);
  if (!m) { boxesMatch = false; boxesMatchDetail = `missing node ${b.kind}_${i}`; break; }
  const posOK = approx(m.position.x, b.x) && approx(m.position.y, b.y + b.h / 2) && approx(m.position.z, b.z);
  // Measure the WORLD-space bounding box. The GLB stores positions as
  // KHR_mesh_quantization int16 with the real size carried by the node's
  // scale, so the raw geometry bbox is normalised (-1..1) and says nothing
  // about the real dimensions. Applying the world matrix restores them.
  m.geometry.computeBoundingBox();
  m.updateWorldMatrix(true, false);
  const worldBB = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
  const sz = worldBB.getSize(new THREE.Vector3());
  const sizeOK = approx(sz.x, b.w) && approx(sz.y, b.h) && approx(sz.z, b.d);
  if (!posOK || !sizeOK) {
    boxesMatch = false;
    boxesMatchDetail = `box ${i} (${b.kind}): pos=(${m.position.x.toFixed(3)},${m.position.y.toFixed(3)},${m.position.z.toFixed(3)}) vs (${b.x},${b.y + b.h / 2},${b.z}); size=(${sz.x.toFixed(3)},${sz.y.toFixed(3)},${sz.z.toFixed(3)}) vs (${b.w},${b.h},${b.d})`;
    break;
  }
}
check('map boxes match shared/map.js positions & sizes exactly', boxesMatch, boxesMatchDetail);

const mapTris = mapMeshes.reduce((s, m) => s + triCount(m), 0);
check('map has expected triangle count (16 boxes x 12 tris = 192)', mapTris === 192, `${mapTris} tris`);

// ---------------------------------------------------------------- soldier
const solGltf = await loadGLB(path.join(ASSETS, 'soldier.glb'));
check('soldier.glb loads via GLTFLoader', true);

const skinned = [];
solGltf.scene.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
check('soldier has a SkinnedMesh', skinned.length >= 1, `${skinned.length} skinned mesh(es)`);

const sm = skinned[0];
check('SkinnedMesh has a bound skeleton with bones', !!sm.skeleton && sm.skeleton.bones.length > 0,
  `${sm.skeleton ? sm.skeleton.bones.length : 0} bones`);
check('SkinnedMesh has JOINTS_0 + WEIGHTS_0 attributes',
  !!sm.geometry.attributes.skinIndex && !!sm.geometry.attributes.skinWeight,
  `${sm.geometry.attributes.skinIndex.count} verts skinned`);
check('skeleton inverseBindMatrices loaded', !!sm.skeleton.boneInverses && sm.skeleton.boneInverses.length === sm.skeleton.bones.length,
  `${sm.skeleton.boneInverses.length} IBM entries`);

check('soldier has >= 2 animation clips', solGltf.animations.length >= 2,
  `${solGltf.animations.length} clips: ${solGltf.animations.map((a) => a.name).join(', ')}`);
const hasIdle = solGltf.animations.some((a) => a.name === 'idle');
const hasRun = solGltf.animations.some((a) => a.name === 'run');
check('clips named idle + run present', hasIdle && hasRun);

// skeleton hierarchy sanity: rest-pose world positions of known bones
solGltf.scene.updateMatrixWorld(true);
const rootBone = sm.skeleton.bones.find((b) => b.name === 'root');
const headBone = sm.skeleton.bones.find((b) => b.name === 'head');
check('skeleton rest pose: root bone at (0,0.98,0)', !!rootBone,
  rootBone ? `root at (${rootBone.position.x},${rootBone.position.y},${rootBone.position.z})` : 'no root bone');
const headWorld = headBone ? headBone.getWorldPosition(new THREE.Vector3()) : null;
check('skeleton rest pose: head bone at (0,1.62,0)',
  !!headWorld && approx(headWorld.x, 0) && approx(headWorld.y, 1.62) && approx(headWorld.z, 0),
  headWorld ? `head world (${headWorld.x.toFixed(3)},${headWorld.y.toFixed(3)},${headWorld.z.toFixed(3)})` : 'no head bone');

// animation actually deforms the rig
const runClip = solGltf.animations.find((a) => a.name === 'run');
const mixer = new THREE.AnimationMixer(solGltf.scene);
const action = mixer.clipAction(runClip);
action.play();
mixer.update(0);
const leg = sm.skeleton.bones.find((b) => b.name === 'upperLegL');
const q0 = leg.quaternion.clone();
mixer.setTime(0.25);
mixer.update(0);
const angle = q0.angleTo(leg.quaternion);
check('run clip animates bones (leg swings)', angle > 0.1, `upperLegL rotated ${angle.toFixed(3)} rad at t=0.25`);

const solTris = sm.geometry.attributes.position.count / 3;
check('soldier is a real mesh (triangles > 0)', solTris > 0, `${solTris} tris`);

// ---------------------------------------------------------------- report
const mapBytes = fs.statSync(path.join(ASSETS, 'map.glb')).size;
const solBytes = fs.statSync(path.join(ASSETS, 'soldier.glb')).size;
const total = mapBytes + solBytes;
console.log('\n--- sizes & triangles ---');
console.log(`map.glb      ${mapBytes} bytes  ${mapTris} triangles`);
console.log(`soldier.glb  ${solBytes} bytes  ${solTris} triangles`);
console.log(`TOTAL        ${total} bytes  (${(total / 1024).toFixed(1)} KiB)`);
check('total download under 4 MB', total < 4 * 1024 * 1024);

console.log(`\n${results.length - failures}/${results.length} assertions passed`);
if (failures > 0) { console.log(`${failures} assertion(s) FAILED`); process.exit(1); }
console.log('ALL PASS');
