import type { GameConfig, RunStats } from '../config/types';
import type { Input } from './Input';
import type { Track } from './Track';

export class Physics {
  x = 0;
  y = 0;
  stats: RunStats = Physics.emptyStats();
  private vx = 0;
  private vy = 0;
  private grounded = true;
  private elapsed = 0;
  private outTime = 0;

  constructor(private config: GameConfig) { }

  static emptyStats(): RunStats {
    return { distance: 0, score: 0, gifts: 0, section: 1, perfectSections: 0, comboCount: 0, comboMultiplier: 1, bestCombo: 0, airTime: 0, gateScore: 0, airScore: 0 };
  }

  reset(): void {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.grounded = true;
    this.elapsed = 0; this.outTime = 0; this.stats = Physics.emptyStats();
  }

  private speed(): number {
    if (this.config.mode === 'home') return Math.min(34, 14 + 0.0133 * this.stats.distance);
    if (this.config.mode === 'snowRoad') return Math.min(30, 20 + 0.008 * this.stats.distance);
    const slope = Math.min(28, 18 + Math.floor(this.stats.distance / 400) * 2) * Math.PI / 180;
    return Math.min(40, 18 + 9.8 * Math.sin(slope) * this.elapsed);
  }

  private cleanCombo(): void {
    this.stats.comboCount += 1;
    this.stats.comboMultiplier = Math.min(1 + 0.25 * (this.stats.comboCount - 1), 4);
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.stats.comboMultiplier);
  }

  private breakCombo(): void {
    this.stats.comboCount = 0;
    this.stats.comboMultiplier = 1;
  }

  update(dt: number, input: Input, track: Track, onGameOver: () => void, onEvent: (name: string) => void): void {
    this.elapsed += dt;
    const speed = this.speed();
    this.stats.distance += speed * dt;
    const steer = input.steer;

    if (this.config.mode === 'snowRoad') {
      this.vx += steer * this.config.steering * dt;
      this.vx *= Math.exp(-4.2 * dt);
      this.vx = Math.max(-4.5, Math.min(4.5, this.vx));
      this.x += this.vx * dt;
    } else {
      this.vx = steer * this.config.steering;
      this.x += this.vx * dt;
    }

    const roadWidth = track.roadWidthAt(this.stats.distance);
    if (this.config.mode !== 'snowRoad') this.x = Math.max(-roadWidth / 2, Math.min(roadWidth / 2, this.x));

    if (input.consumeJump() && this.grounded) {
      this.vy = this.config.jumpVelocity;
      this.grounded = false;
      onEvent('jump');
    }
    if (!this.grounded) {
      this.y += this.vy * dt;
      this.vy -= this.config.gravity * dt;
      this.stats.airTime += dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.grounded = true;
        if (this.config.mode === 'sledding') {
          if (Math.abs(steer * 20) > 15) {
            this.breakCombo();
            onEvent('break');
          } else {
            this.cleanCombo();
            if (this.stats.airTime > 0.6) this.stats.airScore += 30;
          }
        }
        onEvent('land');
        this.stats.airTime = 0;
      }
    }

    if (this.config.mode === 'snowRoad') {
      if (Math.abs(this.x) > roadWidth / 2 - 0.5) this.outTime += dt;
      else this.outTime = 0;
      if (this.outTime >= 0.15) { onGameOver(); return; }
    }

    for (const item of track.getItems()) {
      if (item.resolved) continue;
      const dz = item.distance - this.stats.distance;
      if (Math.abs(dz) > 0.85) continue;
      const dx = Math.abs(this.x - item.x);
      if (item.type === 'gift') {
        if (dx < 0.85 && this.y < 2.2) {
          item.resolved = true;
          this.stats.gifts += 1;
          onEvent('gift');
        }
        continue;
      }
      if (item.type === 'ramp') {
        if (dx < item.width / 2 && this.grounded) {
          item.resolved = true;
          this.vy = this.config.jumpVelocity + 3;
          this.grounded = false;
          onEvent('jump');
        }
        continue;
      }
      if (item.type === 'gap') {
        if (dx < item.width / 2 && this.y < 0.45) { onGameOver(); return; }
        item.resolved = true;
        continue;
      }
      if (item.type === 'gate') {
        if (dx < 1.25) {
          this.cleanCombo();
          this.stats.gateScore += Math.round(50 * this.stats.comboMultiplier);
          onEvent('gate');
        } else if (dx < 2) { onGameOver(); return; }
        item.resolved = true;
        continue;
      }
      if (dx < (item.width + 0.65) / 2) {
        const clearable = item.type !== 'tree' && this.y > 0.85;
        if (!clearable) { onGameOver(); return; }
      }
    }

    if (this.config.mode === 'home') this.stats.score = Math.floor(this.stats.distance) + this.stats.gifts * 50;
    if (this.config.mode === 'snowRoad') {
      this.stats.section = Math.floor(this.stats.distance / 300) + 1;
      this.stats.perfectSections = Math.floor(this.stats.distance / 300);
      this.stats.score = Math.floor(this.stats.distance) + 25 * this.stats.perfectSections;
    }
    if (this.config.mode === 'sledding') this.stats.score = Math.floor(this.stats.distance) + this.stats.gateScore + this.stats.airScore;
  }
}
