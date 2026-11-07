import * as THREE from 'three';
import type { GameConfig, ObstacleType, TrackItem } from '../config/types';
import { Random } from './Random';

const meshTypes: ObstacleType[] = ['tree', 'rock', 'log', 'gift', 'gate', 'ramp'];
const maxInstances = 128;

export class Track {
  private random: Random;
  private items: TrackItem[] = [];
  private meshes = new Map<ObstacleType, THREE.InstancedMesh>();
  private nextDistance = 42;
  private nextId = 1;
  private matrix = new THREE.Matrix4();
  private position = new THREE.Vector3();
  private rotation = new THREE.Quaternion();
  private scale = new THREE.Vector3(1, 1, 1);

  constructor(scene: THREE.Scene, private config: GameConfig, prototypes: Map<string, THREE.Object3D>, private heightAt: (x: number, z: number) => number) {
    this.random = new Random(config.seed);
    for (const type of meshTypes) {
      const prototype = prototypes.get(type);
      if (!(prototype instanceof THREE.Mesh)) continue;
      const mesh = new THREE.InstancedMesh(prototype.geometry, prototype.material, maxInstances);
      mesh.count = 0;
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes.set(type, mesh);
      scene.add(mesh);
    }
  }

  reset(): void {
    this.random = new Random(this.config.seed);
    this.items = [];
    this.nextDistance = 42;
    this.nextId = 1;
    this.generate(0);
  }

  private add(type: ObstacleType, x: number, distance: number, width: number): void {
    this.items.push({ id: this.nextId++, type, x, distance, width, passed: false, resolved: false });
  }

  private generate(distance: number): void {
    const target = distance + this.config.spawnAhead;
    while (this.nextDistance < target) {
      const d = this.nextDistance;
      if (this.config.mode === 'home') {
        const interval = Math.max(0.55, 1.25 - Math.min(d, 1500) / 1500 * 0.7);
        const speed = Math.min(this.config.maxSpeed, this.config.baseSpeed + 0.0133 * d);
        const roll = this.random.next();
        if (roll < 0.25) this.add('gift', this.random.range(-4.5, 4.5), d, 0.8);
        else this.add(this.random.pick(['tree', 'rock', 'log'] as const), this.random.range(-5, 5), d, 1.1);
        this.nextDistance += speed * interval;
      } else if (this.config.mode === 'snowRoad') {
        const roadWidth = Math.max(2.2, 3.2 - Math.floor(d / 300) * 0.3);
        const interval = Math.max(0.45, 1.05 - d / 2500 * 0.6);
        const speed = Math.min(this.config.maxSpeed, this.config.baseSpeed + 0.008 * d);
        const roll = this.random.next();
        const side = this.random.next() > 0.5 ? 1 : -1;
        if (roll < 0.25) this.add('log', 0, d, Math.min(1.7, roadWidth * 0.65));
        else if (roll < 0.55) this.add('rock', side * roadWidth * 0.22, d, 0.9);
        else this.add('tree', side * roadWidth * 0.34, d, 0.7);
        this.nextDistance += speed * interval;
      } else {
        const roll = this.random.next();
        if (roll < 0.3) this.add('gate', this.random.range(-3.5, 3.5), d, 3);
        else if (roll < 0.47) this.add('ramp', this.random.range(-3.5, 3.5), d, 2.2);
        else if (roll < 0.58) this.add('gap', this.random.range(-2, 2), d, 4);
        else this.add(this.random.pick(['tree', 'rock'] as const), this.random.range(-5.5, 5.5), d, 1.1);
        this.nextDistance += this.random.range(55, 82);
      }
    }
    this.items = this.items.filter((item) => item.distance > distance - 24);
  }

  update(distance: number): void {
    this.generate(distance);
    for (const [type, mesh] of this.meshes) {
      let count = 0;
      for (const item of this.items) {
        if (item.type !== type || item.resolved && type === 'gift') continue;
        const z = -(item.distance - distance);
        if (z > 16 || z < -this.config.spawnAhead) continue;
        this.position.set(item.x, this.heightAt(item.x, z), z);
        const size = type === 'gate' ? item.width / 3 : type === 'ramp' ? item.width / 2.2 : 1;
        this.scale.set(size, size, size);
        this.matrix.compose(this.position, this.rotation, this.scale);
        mesh.setMatrixAt(count++, this.matrix);
        if (count >= maxInstances) break;
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  getItems(): readonly TrackItem[] { return this.items; }
  roadWidthAt(distance: number): number {
    return this.config.mode === 'snowRoad' ? Math.max(2.2, 3.2 - Math.floor(distance / 300) * 0.3) : this.config.roadWidth;
  }
}
