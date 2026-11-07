import * as THREE from 'three';

export class SledRig {
  private torso?: THREE.Object3D;
  private head?: THREE.Object3D;
  private legs: THREE.Object3D[] = [];
  private torsoBaseY = 0;
  private landingTime = 0;
  private impactTime = 0;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private root: THREE.Object3D) {
    this.torso = root.getObjectByName('riderTorso');
    this.head = root.getObjectByName('riderHead');
    this.legs = [root.getObjectByName('riderLegLeft'), root.getObjectByName('riderLegRight')].filter((part): part is THREE.Object3D => Boolean(part));
    this.torsoBaseY = this.torso?.position.y ?? 0;
  }

  event(name: string): void {
    if (this.reduced) return;
    if (name === 'land') this.landingTime = 0.12;
    if (name === 'break' || name === 'collision') this.impactTime = name === 'collision' ? 0.12 : 0.18;
  }

  update(steer: number, airborne: boolean, dt: number): void {
    this.root.rotation.z = -steer * 12 * Math.PI / 180;
    if (this.torso) this.torso.rotation.z = -steer * 8 * Math.PI / 180;
    if (this.head) this.head.rotation.z = steer * 3 * Math.PI / 180;
    for (const leg of this.legs) leg.rotation.x = airborne && !this.reduced ? 12 * Math.PI / 180 : 0;

    this.landingTime = Math.max(0, this.landingTime - dt);
    this.impactTime = Math.max(0, this.impactTime - dt);
    if (this.torso) {
      const compression = this.landingTime > 0 ? Math.sin(this.landingTime / 0.12 * Math.PI) * 0.055 : 0;
      this.torso.position.y = this.torsoBaseY - compression;
      this.torso.rotation.x = this.impactTime > 0 ? -0.24 * Math.min(1, this.impactTime / 0.12) : airborne && !this.reduced ? -0.08 : 0;
    }
  }

  reset(): void {
    this.landingTime = 0;
    this.impactTime = 0;
    this.root.rotation.set(0, 0, 0);
    for (const part of [this.torso, this.head, ...this.legs]) part?.rotation.set(0, 0, 0);
    if (this.torso) this.torso.position.y = this.torsoBaseY;
  }
}
