import { writeSave } from '../storage';
import type { SaveData } from '../config/types';

export interface ShellActions {
  play: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  retry: () => void;
  back: () => void;
}

export class GameShell {
  private audio?: AudioContext;

  constructor(private shell: HTMLElement, private save: SaveData, private actions: ShellActions) {
    shell.addEventListener('click', this.onClick);
    this.updateSoundLabel();
    const fullscreen = shell.querySelector<HTMLButtonElement>('[data-action="fullscreen"]');
    if (fullscreen && !document.fullscreenEnabled) fullscreen.hidden = true;
  }

  private onClick = (event: MouseEvent) => {
    const action = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'play') { this.beep(440); this.actions.play(); }
    if (action === 'pause') this.actions.pause();
    if (action === 'resume') this.actions.resume();
    if (action === 'restart') { this.beep(520); this.actions.restart(); }
    if (action === 'retry') this.actions.retry();
    if (action === 'sound') {
      this.save.soundOn = !this.save.soundOn;
      writeSave(this.save);
      this.updateSoundLabel();
      if (this.save.soundOn) this.beep(440);
    }
    if (action === 'fullscreen') void this.shell.requestFullscreen?.();
    if (action === 'back') {
      this.shell.scrollIntoView({ block: 'start' });
      this.actions.back();
    }
  };

  private updateSoundLabel(): void {
    for (const button of this.shell.querySelectorAll<HTMLButtonElement>('[data-action="sound"]')) {
      button.textContent = this.save.soundOn ? 'Sound on' : 'Sound off';
      button.setAttribute('aria-label', this.save.soundOn ? 'Turn sound off' : 'Turn sound on');
    }
  }

  beep(frequency: number): void {
    if (!this.save.soundOn) return;
    try {
      this.audio ??= new AudioContext();
      const oscillator = this.audio.createOscillator();
      const gain = this.audio.createGain();
      gain.gain.setValueAtTime(0.035, this.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audio.currentTime + 0.08);
      oscillator.frequency.value = frequency;
      oscillator.connect(gain).connect(this.audio.destination);
      oscillator.start();
      oscillator.stop(this.audio.currentTime + 0.08);
    } catch { }
  }
}
