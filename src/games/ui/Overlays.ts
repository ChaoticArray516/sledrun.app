import type { GameState } from '../config/types';

export class Overlays {
  constructor(private shell: HTMLElement) {
    shell.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const overlay = shell.querySelector<HTMLElement>('[data-overlay]:not([hidden])');
      if (!overlay) return;
      const buttons = [...overlay.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  show(state: GameState): void {
    this.shell.dataset.state = state;
    const activeOverlay = state === 'loading' || state === 'start' ? 'bootstrap' : state;
    for (const overlay of this.shell.querySelectorAll<HTMLElement>('[data-overlay]')) {
      overlay.hidden = overlay.dataset.overlay !== activeOverlay;
    }
    for (const item of this.shell.querySelectorAll<HTMLElement>('[data-loading-only]')) item.hidden = state !== 'loading';
    for (const item of this.shell.querySelectorAll<HTMLElement>('[data-start-only]')) item.hidden = state !== 'start';
    const hud = this.shell.querySelector<HTMLElement>('.hud');
    if (hud) hud.hidden = state !== 'playing' && state !== 'paused';
    const touch = this.shell.querySelector<HTMLElement>('.touch-controls');
    if (touch) touch.hidden = state !== 'playing' || !matchMedia('(pointer: coarse)').matches;

    if (state === 'playing') {
      this.shell.querySelector<HTMLCanvasElement>('canvas')?.focus({ preventScroll: true });
      return;
    }
    const overlay = this.shell.querySelector<HTMLElement>(`[data-overlay="${activeOverlay}"]`);
    const focusTarget = overlay?.querySelector<HTMLButtonElement>('button.primary, button');
    focusTarget?.focus({ preventScroll: true });
  }

  error(message: string): void {
    const target = this.shell.querySelector<HTMLElement>('[data-error-message]');
    if (target) target.textContent = message;
    this.show('error');
  }
}
