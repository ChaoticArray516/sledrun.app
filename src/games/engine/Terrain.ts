import * as THREE from 'three';
import type { GameConfig } from '../config/types';
import type { VisualConfig } from '../config/visual';
import { Random } from './Random';

function ridgeGeometry(seed: number, snow: boolean): THREE.BufferGeometry {
  const random = new Random(seed);
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= 10; i++) {
    const x = -1 + i / 5;
    const main = Math.exp(-Math.pow(x - 0.15, 2) * 5) * 0.48;
    const side = Math.exp(-Math.pow(x + 0.55, 2) * 12) * 0.28;
    points.push({ x, y: 0.22 + main + side + random.range(-0.07, 0.08) });
  }
  const positions: number[] = [];
  const triangle = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c);
  for (let i = 0; i < 10; i++) {
    const a = points[i], b = points[i + 1];
    if (!snow) {
      const af = [a.x, 0, -0.48], bf = [b.x, 0, -0.48], ab = [a.x, 0, 0.48], bb = [b.x, 0, 0.48];
      const at = [a.x, a.y, 0], bt = [b.x, b.y, 0];
      triangle(af, bf, at); triangle(bf, bt, at); triangle(ab, at, bb); triangle(bb, at, bt);
    } else {
      const lowerA = a.y * (0.72 + random.range(-0.06, 0.06));
      const lowerB = b.y * (0.72 + random.range(-0.06, 0.06));
      triangle([a.x, a.y, 0], [b.x, b.y, 0], [a.x, lowerA, -0.12]);
      triangle([b.x, b.y, 0], [b.x, lowerB, -0.12], [a.x, lowerA, -0.12]);
      triangle([a.x, a.y, 0], [a.x, lowerA, 0.12], [b.x, b.y, 0]);
      triangle([b.x, b.y, 0], [a.x, lowerA, 0.12], [b.x, lowerB, 0.12]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export class Terrain {
  readonly ground: THREE.Mesh;

  heightAt(x: number, worldZ: number): number {
    const edge = THREE.MathUtils.smoothstep(Math.abs(x), this.config.roadWidth * 0.42, this.visual.terrainWidth * 0.46);
    const central = Math.sin(worldZ * 0.1) * 0.055;
    const side = (Math.sin(x * 0.36 + worldZ * 0.045) * 0.42 + Math.cos(worldZ * 0.065) * 0.22) * edge;
    const downhill = this.config.mode === 'sledding' ? worldZ * 0.18 : 0;
    return central + side + downhill;
  }

  constructor(private scene: THREE.Scene, private config: GameConfig, private visual: VisualConfig, prototypes: Map<string, THREE.Object3D>) {
    const geometry = new THREE.PlaneGeometry(visual.terrainWidth, 260, 32, 80);
    const positions = geometry.attributes.position;
    const colors: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const worldZ = -positions.getY(i);
      const height = this.heightAt(x, worldZ);
      positions.setZ(i, height);
      const shade = new THREE.Color(config.snow).lerp(new THREE.Color(0xbfe9f2), Math.min(0.32, Math.abs(x) / visual.terrainWidth * 0.38 + Math.abs(height) * 0.1));
      colors.push(shade.r, shade.g, shade.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    this.ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.94, flatShading: false }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, -0.03, -110);
    scene.add(this.ground);
    this.addMountains();
    this.addPines(prototypes);
    this.addModeAnchors(prototypes);
  }

  private addMountains(): void {
    for (let layer = 0; layer < 3; layer++) {
      const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.config.sky).lerp(new THREE.Color(this.config.snow), 0.28 + layer * 0.2), roughness: 1, flatShading: true });
      const snowMaterial = new THREE.MeshStandardMaterial({ color: this.config.snow, roughness: 1, flatShading: true });
      const bodies = new THREE.InstancedMesh(ridgeGeometry(this.config.seed + 91 + layer, false), material, 3);
      const caps = new THREE.InstancedMesh(ridgeGeometry(this.config.seed + 191 + layer, true), snowMaterial, 3);
      const matrix = new THREE.Matrix4();
      const quaternion = new THREE.Quaternion();
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 82;
        const z = -180 - layer * 85 - i * 12;
        const height = 42 + layer * 9 + i * 5;
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i - 1) * 0.08);
        matrix.compose(new THREE.Vector3(x, this.heightAt(x, z) - 4, z), quaternion, new THREE.Vector3(48, height, 30));
        bodies.setMatrixAt(i, matrix);
        caps.setMatrixAt(i, matrix);
      }
      bodies.instanceMatrix.needsUpdate = true;
      caps.instanceMatrix.needsUpdate = true;
      this.scene.add(bodies, caps);
    }
  }

  private addPines(prototypes: Map<string, THREE.Object3D>): void {
    const random = new Random(this.config.seed + 17);
    const variants = ['tree', 'treeB', 'treeC'].map((name) => prototypes.get(name)).filter((item): item is THREE.Mesh => item instanceof THREE.Mesh);
    if (!variants.length) return;
    const trees = variants.map((prototype) => {
      const mesh = new THREE.InstancedMesh(prototype.geometry, prototype.material, Math.ceil(this.visual.pineCount / variants.length));
      mesh.count = 0;
      this.scene.add(mesh);
      return mesh;
    });
    const counts = Array(variants.length).fill(0);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    for (let i = 0; i < this.visual.pineCount; i++) {
      const side = i % 2 ? 1 : -1;
      const z = -random.range(8, 240);
      const x = side * random.range(this.config.roadWidth / 2 + 3, this.visual.terrainWidth / 2 + 8);
      const scale = random.range(0.75, 1.8);
      quaternion.setFromEuler(new THREE.Euler(random.range(-0.035, 0.035), random.range(0, Math.PI * 2), random.range(-0.055, 0.055)));
      matrix.compose(new THREE.Vector3(x, this.heightAt(x, z), z), quaternion, new THREE.Vector3(scale, scale, scale));
      const variant = i % variants.length;
      trees[variant].setMatrixAt(counts[variant]++, matrix);
    }
    for (const mesh of trees) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  private addModeAnchors(prototypes: Map<string, THREE.Object3D>): void {
    if (this.config.mode === 'home') {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(4, 0.72, 4, 14, Math.PI), new THREE.MeshStandardMaterial({ color: 0x7fc8d8, roughness: 0.72, flatShading: true }));
      arch.position.set(4.5, this.heightAt(4.5, -42), -42);
      this.scene.add(arch);
      const logs = prototypes.get('log');
      if (logs) { const clone = logs.clone(); clone.position.set(6.5, this.heightAt(6.5, -20), -20); clone.scale.setScalar(1.8); this.scene.add(clone); }
      for (const side of [-1, 1]) {
        const tree = prototypes.get('tree');
        if (tree) {
          for (let i = 0; i < 3; i++) {
            const foregroundTree = tree.clone();
            const x = side * (5.5 + i * 1.5), z = -5 - i * 12;
            foregroundTree.position.set(x, this.heightAt(x, z), z);
            foregroundTree.scale.setScalar(1.7 + i * 0.2);
            this.scene.add(foregroundTree);
          }
        }
      }
      const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 1.1, 0.22), new THREE.MeshStandardMaterial({ color: 0x664433, roughness: 1 }), 20);
      const matrix = new THREE.Matrix4();
      for (let i = 0; i < 20; i++) {
        const x = i % 2 ? 6.4 : -6.4, z = -6 - Math.floor(i / 2) * 10;
        matrix.makeTranslation(x, this.heightAt(x, z) + 0.5, z);
        posts.setMatrixAt(i, matrix);
      }
      this.scene.add(posts);
    }
    if (this.config.mode === 'snowRoad') {
      const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x536b68, roughness: 1, flatShading: true });
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x664433, roughness: 1 });
      for (let i = 0; i < 24; i++) {
        const cliff = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6 + i % 2, 0), rockMaterial);
        cliff.position.set(-6.5 - i % 2, 1.8, -12 - i * 14);
        cliff.scale.set(1, 1.5, 1.2);
        this.scene.add(cliff);
        const z = -i * 10;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), woodMaterial);
        post.position.set(2.1, this.heightAt(2.1, z) + 0.5, z);
        this.scene.add(post);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 250), woodMaterial);
      rail.position.set(2.1, 0.85, -120);
      this.scene.add(rail);
      const sunset = new THREE.Mesh(new THREE.CircleGeometry(6, 20), new THREE.MeshBasicMaterial({ color: 0xffd99a }));
      sunset.position.set(34, 25, -175);
      this.scene.add(sunset);
    }
    if (this.config.mode === 'sledding') {
      for (let i = 0; i < 3; i++) {
        const aurora = new THREE.Mesh(new THREE.PlaneGeometry(95, 7), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x7fc8d8 : 0x66b0a0, transparent: true, opacity: 0.1, depthWrite: false }));
        aurora.position.set((i - 1) * 24, 48 + i * 7, -210);
        aurora.rotation.z = -0.15;
        this.scene.add(aurora);
      }
      const sunrise = new THREE.Mesh(new THREE.CircleGeometry(7, 20), new THREE.MeshBasicMaterial({ color: 0xffe0a8 }));
      sunrise.position.set(26, 23, -180);
      this.scene.add(sunrise);
    }
  }

  update(roadWidth: number): void {
    this.ground.scale.x = this.config.mode === 'snowRoad' ? Math.max(0.6, roadWidth / 3.2) : 1;
  }
}
