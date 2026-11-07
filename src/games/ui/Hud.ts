import type { GameMode, RunStats } from '../config/types';

export class Hud {
  constructor(private shell: HTMLElement, private mode: GameMode) { }

  private set(name: string, value: string): void {
    const target = this.shell.querySelector<HTMLElement>(`[data-hud="${name}"]`);
    if (target) target.textContent = value;
  }

  update(stats: RunStats, playerX = 0, roadWidth = 12): void {
    this.set('distance', `${Math.floor(stats.distance).toLocaleString()} m`);
    this.set('score', Math.floor(stats.score).toLocaleString());
    if (this.mode === 'home') this.set('gifts', String(stats.gifts));
    if (this.mode === 'snowRoad') {
      this.set('section', String(stats.section));
      const danger = Math.abs(playerX) > roadWidth / 2 - 0.8;
      this.set('danger', danger ? '⚠ Narrow' : '');
    }
    if (this.mode === 'sledding') {
      this.set('combo', `Combo ×${stats.comboMultiplier.toFixed(2)}`);
      this.set('air', stats.airTime > 0.05 ? `${stats.airTime.toFixed(1)} s air` : '');
    }
  }

  result(stats: RunStats, best: string, newBest: boolean): void {
    for (const [name, value] of Object.entries({ distance: `${Math.floor(stats.distance).toLocaleString()} m`, score: Math.floor(stats.score).toLocaleString(), best })) {
      const target = this.shell.querySelector<HTMLElement>(`[data-result="${name}"]`);
      if (target) target.textContent = value;
    }
    const gifts = this.shell.querySelector<HTMLElement>('[data-result="gifts"]');
    if (gifts) gifts.textContent = String(stats.gifts);
    const combo = this.shell.querySelector<HTMLElement>('[data-result="combo"]');
    if (combo) combo.textContent = stats.bestCombo > 0 ? `×${stats.bestCombo.toFixed(2)}` : '—';
    const badge = this.shell.querySelector<HTMLElement>('[data-new-best]');
    if (badge) badge.hidden = !newBest;
  }
}
