import { readFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { ktx2 } from 'babylonpress-ktx2-encoder/gltf-transform';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'assets/source');
const distDir = path.join(root, 'assets/dist');
await mkdir(distDir, { recursive: true });
const document = new Document();
const buffer = document.createBuffer('geometry');
const scene = document.createScene('SledRun originals');
const texture = document.createTexture('snow-atlas').setImage(await readFile(path.join(sourceDir, 'atlas.png'))).setMimeType('image/png');
let sledTriangles = 0;
let sledRoot;
const treeTriangles = { tree: 0, treeB: 0, treeC: 0 };

function color(hex) { return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]; }
function geometryData(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = Array.from(g.attributes.position.array);
  const normals = Array.from(g.attributes.normal.array);
  const uvs = g.attributes.uv ? Array.from(g.attributes.uv.array) : Array(positions.length / 3 * 2).fill(0);
  return { positions, normals, uvs, indices: Array.from({ length: positions.length / 3 }, (_, i) => i) };
}
function rounded(w, h, d, radius = 0.035) { return geometryData(new RoundedBoxGeometry(w, h, d, 1, radius)); }
function box(w, h, d) { return geometryData(new THREE.BoxGeometry(w, h, d)); }
function sphere(radius, segments = 10, rings = 6) { return geometryData(new THREE.SphereGeometry(radius, segments, rings)); }
function cone(radius, height, sides = 6) { return geometryData(new THREE.ConeGeometry(radius, height, sides)); }
function transform(data, position = [0, 0, 0], quaternion = new THREE.Quaternion()) {
  const positions = [], normals = [];
  for (let i = 0; i < data.positions.length; i += 3) {
    const p = new THREE.Vector3(...data.positions.slice(i, i + 3)).applyQuaternion(quaternion).add(new THREE.Vector3(...position));
    const n = new THREE.Vector3(...data.normals.slice(i, i + 3)).applyQuaternion(quaternion).normalize();
    positions.push(p.x, p.y, p.z); normals.push(n.x, n.y, n.z);
  }
  return { ...data, positions, normals };
}
function segment(start, end, width, depth = width) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const data = box(width, direction.length(), depth);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return transform(data, a.add(b).multiplyScalar(0.5).toArray(), quaternion);
}
function combine(parts) {
  const out = { positions: [], normals: [], uvs: [], indices: [], colors: [] };
  for (const { data, hex } of parts) {
    const start = out.positions.length / 3;
    out.positions.push(...data.positions); out.normals.push(...data.normals); out.uvs.push(...data.uvs);
    out.indices.push(...data.indices.map((i) => i + start));
    for (let i = 0; i < data.positions.length / 3; i++) out.colors.push(...color(hex));
  }
  return out;
}
function addModel(name, parts, parent = scene) {
  const data = combine(parts);
  const accessor = (type, array) => document.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const material = document.createMaterial(`${name}-material`).setBaseColorFactor([1, 1, 1, 1]).setBaseColorTexture(texture).setRoughnessFactor(.9).setMetallicFactor(0);
  const primitive = document.createPrimitive().setAttribute('POSITION', accessor('VEC3', new Float32Array(data.positions))).setAttribute('NORMAL', accessor('VEC3', new Float32Array(data.normals))).setAttribute('TEXCOORD_0', accessor('VEC2', new Float32Array(data.uvs))).setAttribute('COLOR_0', accessor('VEC3', new Float32Array(data.colors))).setIndices(accessor('SCALAR', new Uint32Array(data.indices))).setMaterial(material);
  parent.addChild(document.createNode(name).setMesh(document.createMesh(name).addPrimitive(primitive)));
  if (sledRoot && parent === sledRoot) sledTriangles += data.indices.length / 3;
  if (name in treeTriangles) treeTriangles[name] = data.indices.length / 3;
}

sledRoot = document.createNode('sled');
scene.addChild(sledRoot);
const deck = [];
for (let i = 0; i < 7; i++) deck.push({ data: transform(box(1.06, .072, .265), [0, .31, -.82 + i * .27]), hex: 0x8a613d });
addModel('sledDeck', deck, sledRoot);
const frame = [];
for (let i = 0; i < 5; i++) frame.push({ data: transform(box(1.1, .07, .08), [0, .22, -.72 + i * .36]), hex: 0x664433 });
addModel('sledFrame', frame, sledRoot);
const runners = [];
for (const side of [-1, 1]) {
  const points = [[side * .48, .1, .95], [side * .48, .1, -.62], [side * .48, .14, -.84], [side * .48, .23, -1.02], [side * .48, .3, -1.1]];
  for (let i = 0; i < points.length - 1; i++) runners.push({ data: segment(points[i], points[i + 1], .075, .095), hex: 0x536b68 });
  for (const z of [-.55, .55]) runners.push({ data: transform(box(.08, .2, .1), [side * .48, .18, z]), hex: 0x536b68 });
}
addModel('sledRunners', runners, sledRoot);
addModel('riderTorso', [
  { data: transform(rounded(.54, .58, .36, .075), [0, .86, .16]), hex: 0x193b3a },
  { data: transform(rounded(.44, .12, .38, .035), [0, .48, .16]), hex: 0x193b3a },
], sledRoot);
addModel('riderHead', [
  { data: transform(sphere(.155, 10, 7), [0, 1.25, .08]), hex: 0xd0b095 },
  { data: transform(cone(.205, .25, 8), [0, 1.44, .08]), hex: 0x193b3a },
  { data: transform(rounded(.43, .075, .38, .025), [0, 1.35, .08]), hex: 0xf6f0e4 },
  { data: transform(rounded(.5, .11, .41, .025), [0, 1.08, .12]), hex: 0xf6f0e4 },
], sledRoot);
for (const side of [-1, 1]) {
  addModel(`riderArm${side < 0 ? 'Left' : 'Right'}`, [
    { data: segment([side * .27, 1.01, .08], [side * .39, .79, -.08], .14), hex: 0x193b3a },
    { data: segment([side * .39, .79, -.08], [side * .42, .61, -.34], .12), hex: 0x193b3a },
    { data: transform(sphere(.065, 8, 5), [side * .42, .61, -.34]), hex: 0xd0b095 },
  ], sledRoot);
  addModel(`riderLeg${side < 0 ? 'Left' : 'Right'}`, [
    { data: segment([side * .16, .46, .08], [side * .19, .35, -.27], .18, .2), hex: 0x193b3a },
    { data: segment([side * .19, .35, -.27], [side * .19, .21, -.55], .15, .17), hex: 0x193b3a },
    { data: transform(rounded(.16, .11, .26, .025), [side * .19, .18, -.62]), hex: 0x273e46 },
  ], sledRoot);
}

const treeParts = [{ data: transform(rounded(.22, .8, .22, .025), [0, .4, 0]), hex: 0x664433 }];
for (let i = 0; i < 3; i++) {
  treeParts.push({ data: transform(cone(.95 - i * .18, 1.7, 7), [0, 1.15 + i * .72, 0]), hex: 0x2d6e5a });
  treeParts.push({ data: transform(cone(.75 - i * .14, .22, 7), [0, 1.8 + i * .72, 0]), hex: 0xf6f0e4 });
}
addModel('tree', treeParts);
const treeBParts = [{ data: transform(box(.18, .75, .18), [0, .38, 0]), hex: 0x664433 }];
for (let i = 0; i < 2; i++) {
  treeBParts.push({ data: transform(cone(.78 - i * .18, 1.65, 6), [0, 1.25 + i * .78, 0]), hex: 0x2d6e5a });
  treeBParts.push({ data: transform(cone(.6 - i * .14, .13, 6), [0, 1.88 + i * .78, 0]), hex: 0xf6f0e4 });
}
addModel('treeB', treeBParts.map((part) => ({ ...part, data: transform(part.data, [0, 0, 0], new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), .07)) })));
const treeCParts = [{ data: transform(box(.16, .9, .16), [0, .45, 0]), hex: 0x664433 }];
for (let i = 0; i < 4; i++) {
  treeCParts.push({ data: transform(cone(.72 - i * .13, 1.45, 7), [0, 1.05 + i * .55, 0]), hex: 0x2d6e5a });
  treeCParts.push({ data: transform(cone(.54 - i * .1, .16 + i * .015, 7), [0, 1.57 + i * .55, 0]), hex: 0xf6f0e4 });
}
addModel('treeC', treeCParts);
addModel('rock', [{ data: transform(cone(.78, .95, 5), [0, .48, 0]), hex: 0x536b68 }, { data: transform(cone(.42, .55, 5), [.36, .3, .2]), hex: 0x687b78 }]);
const logs = [];
for (const [x, y] of [[-.45, .22], [.45, .22], [0, .62]]) logs.push({ data: transform(cone(.22, 1.65, 8), [x, y, 0], new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)), hex: 0x775544 });
addModel('log', logs);
addModel('gift', [{ data: rounded(.8, .84, .8, .04), hex: 0xd98e3a }, { data: rounded(.16, .9, .84, .02), hex: 0xf6f0e4 }, { data: rounded(.84, .9, .16, .02), hex: 0xf6f0e4 }]);
addModel('gate', [{ data: transform(rounded(.12, 2.5, .12, .02), [-1.5, 1.25, 0]), hex: 0x775544 }, { data: transform(rounded(.65, .55, .08, .025), [-1.2, 2.05, 0]), hex: 0xe2604a }, { data: transform(rounded(.12, 2.5, .12, .02), [1.5, 1.25, 0]), hex: 0x775544 }, { data: transform(rounded(.65, .55, .08, .025), [1.8, 2.05, 0]), hex: 0xe2604a }]);
const ramp = { positions: [-1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, 1, -1, .75, -1, 1, .75, -1], normals: [], uvs: [], indices: [0, 2, 1, 1, 2, 3, 0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7, 0, 4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5, 4, 5, 6, 5, 7, 6] };
for (let i = 0; i < 6; i++) { ramp.normals.push(0, 1, 0); ramp.uvs.push(0, 0); }
addModel('ramp', [{ data: ramp, hex: 0x7fc8d8 }]);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const sourcePath = path.join(sourceDir, 'world.glb'), distPath = path.join(distDir, 'world.glb');
async function imageDecoder(bytes) { const image = sharp(bytes); const metadata = await image.metadata(); const raw = await image.ensureAlpha().raw().toBuffer(); return { width: metadata.width, height: metadata.height, data: new Uint8Array(raw) }; }
await document.transform(ktx2({ isUASTC: false, generateMipmap: true, imageDecoder }));
await io.write(sourcePath, document);
const cli = path.join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');
const result = spawnSync(process.execPath, [cli, 'draco', sourcePath, distPath], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`glTF Transform DRACO failed: ${result.status}`);
console.log(`Original DRACO + KTX2 GLB written: ${distPath}`);
console.log(`Sled + rider triangles: ${sledTriangles}`);
console.log(`Tree triangles A/B/C: ${treeTriangles.tree}/${treeTriangles.treeB}/${treeTriangles.treeC}`);
if (sledTriangles > 3000) throw new Error(`Sled/rider exceeds 3000 triangles: ${sledTriangles}`);
for (const [name, triangles] of Object.entries(treeTriangles)) if (triangles > 300) throw new Error(`${name} exceeds 300 triangles: ${triangles}`);
