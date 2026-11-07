import * as THREE from 'three';

export class Vfx {
  private points: THREE.Points;
  private positions = new Float32Array(300 * 3);
  private velocities = new Float32Array(300 * 3);
  private life = new Float32Array(300);
  private cursor = 0;
  private trails: THREE.Line[] = [];
  private history: { x: number; distance: number }[] = [];
  private tier = 0;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(scene: THREE.Scene, private heightAt: (x: number, z: number) => number) {
    this.positions.fill(-1000);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xf6f0e4, size: 0.11, transparent: true, opacity: 0.72, depthWrite: false }));
    this.points.frustumCulled = false;
    scene.add(this.points);
    for (const offset of [-0.43, 0.43]) {
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(120 * 3), 3));
      const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0x8cbac2, transparent: true, opacity: 0.58 }));
      line.userData.offset = offset;
      line.frustumCulled = false;
      scene.add(line);
      this.trails.push(line);
    }
  }

  private spawn(x: number, y: number, z: number, count: number, force: number): void {
    for (let n = 0; n < count; n++) {
      const i = this.cursor++ % 300;
      this.positions[i * 3] = x + (Math.random() - 0.5) * 0.8;
      this.positions[i * 3 + 1] = y + 0.08;
      this.positions[i * 3 + 2] = z + Math.random() * 0.5;
      this.velocities[i * 3] = (Math.random() - 0.5) * force;
      this.velocities[i * 3 + 1] = Math.random() * force * 0.65;
      this.velocities[i * 3 + 2] = Math.random() * force;
      this.life[i] = 0.45 + Math.random() * 0.35;
    }
  }

  event(name: string, x: number, y: number): void {
    const count = name === 'gift' || name === 'gate' ? 18 : name === 'collision' ? 48 : 10;
    this.spawn(x, y, 0.5, this.reduced ? Math.min(4, count) : count, name === 'collision' ? 2.6 : 1.4);
  }

  update(dt: number, x: number, y: number, distance: number, playing: boolean): void {
    if (playing && !this.reduced) this.spawn(x, y, 0.8, this.tier === 0 ? 2 : 1, 0.65);
    for (let i = 0; i < 300; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      this.positions[i * 3] += this.velocities[i * 3] * dt;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
      this.velocities[i * 3 + 1] -= 2.8 * dt;
      if (this.life[i] <= 0) this.positions[i * 3 + 1] = -1000;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    if (playing) {
      this.history.unshift({ x, distance });
      if (this.history.length > 120) this.history.pop();
    }
    for (const line of this.trails) {
      const array = (line.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < 120; i++) {
        const point = this.history[Math.min(i, this.history.length - 1)] ?? { x, distance };
        const z = -(point.distance - distance);
        array[i * 3] = point.x + line.userData.offset;
        array[i * 3 + 1] = this.heightAt(point.x + line.userData.offset, z) + 0.015;
        array[i * 3 + 2] = z;
      }
      line.geometry.attributes.position.needsUpdate = true;
      line.visible = this.history.length > 1;
    }
  }

  setTier(tier: number): void { this.tier = tier; }
  reset(): void { this.history = []; this.life.fill(0); this.positions.fill(-1000); }
}
