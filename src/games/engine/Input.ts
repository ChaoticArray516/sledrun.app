import type { GameState } from '../config/types';

interface PointerTrack { x: number; y: number; zone?: 'left' | 'right'; }

export class Input {
  private keys = new Set<string>();
  private pointers = new Map<number, PointerTrack>();
  private jumpQueued = false;
  private touchLeft = false;
  private touchRight = false;

  constructor(shell: HTMLElement, private getState: () => GameState, private pause: () => void, private restart: () => void) {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onBlur);
    shell.addEventListener('pointerdown', this.onPointerDown);
    shell.addEventListener('pointermove', this.onPointerMove);
    shell.addEventListener('pointerup', this.onPointerUp);
    shell.addEventListener('pointercancel', this.onPointerUp);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const state = this.getState();
    if ((event.key === 'Escape' || event.key.toLowerCase() === 'p') && (state === 'playing' || state === 'paused')) {
      event.preventDefault();
      this.pause();
      return;
    }
    if (event.key.toLowerCase() === 'r' && (state === 'paused' || state === 'gameover')) {
      event.preventDefault();
      this.restart();
      return;
    }
    if (state !== 'playing') return;
    if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D', ' '].includes(event.key)) event.preventDefault();
    if (event.key === ' ' && !event.repeat) this.jumpQueued = true;
    this.keys.add(event.key.toLowerCase());
  };

  private onKeyUp = (event: KeyboardEvent) => { this.keys.delete(event.key.toLowerCase()); };
  private onBlur = () => { this.clear(); if (this.getState() === 'playing') this.pause(); };

  private onPointerDown = (event: PointerEvent) => {
    if (this.getState() !== 'playing' || (event.target as HTMLElement).closest('button,a,summary')) return;
    const zone = (event.target as HTMLElement).closest('[data-touch]')?.getAttribute('data-touch') as 'left' | 'right' | undefined;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, zone });
    if (zone === 'left') this.touchLeft = true;
    if (zone === 'right') this.touchRight = true;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.pointers.has(event.pointerId)) event.preventDefault();
  };

  private onPointerUp = (event: PointerEvent) => {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;
    if (this.getState() === 'playing' && pointer.y - event.clientY >= 24) this.jumpQueued = true;
    this.pointers.delete(event.pointerId);
    this.touchLeft = [...this.pointers.values()].some((item) => item.zone === 'left');
    this.touchRight = [...this.pointers.values()].some((item) => item.zone === 'right');
  };

  get left(): boolean { return this.touchLeft || this.keys.has('arrowleft') || this.keys.has('a'); }
  get right(): boolean { return this.touchRight || this.keys.has('arrowright') || this.keys.has('d'); }
  get steer(): number { return Number(this.right) - Number(this.left); }
  consumeJump(): boolean { const value = this.jumpQueued; this.jumpQueued = false; return value; }
  clear(): void {
    this.keys.clear();
    this.pointers.clear();
    this.touchLeft = false;
    this.touchRight = false;
    this.jumpQueued = false;
  }
}
