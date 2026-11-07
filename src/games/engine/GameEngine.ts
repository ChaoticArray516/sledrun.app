import type { GameConfig, GameState } from '../config/types';
import { bestLabel, commitRun, loadSave } from '../storage';
import { GameShell } from '../ui/GameShell';
import { Hud } from '../ui/Hud';
import { Overlays } from '../ui/Overlays';
import { Input } from './Input';
import { Physics } from './Physics';
import { Renderer } from './Renderer';
import { Track } from './Track';

export class GameEngine {
  private state: GameState = 'loading';
  private physics: Physics;
  private input: Input;
  private overlays: Overlays;
  private hud: Hud;
  private track: Track;
  private ui: GameShell;
  private save = loadSave();
  private lastTime = 0;
  private accumulator = 0;
  private hudTime = 0;
  private sampleTime = 0;
  private sampleFrames = 0;
  private tier = 0;

  constructor(private shell: HTMLElement, private config: GameConfig, private view: Renderer) {
    this.physics = new Physics(config);
    this.overlays = new Overlays(shell);
    this.hud = new Hud(shell, config.mode);
    this.track = new Track(view.scene, config, view.prototypes, (x, z) => view.heightAt(x, z));
    this.ui = new GameShell(shell, this.save, {
      play: () => this.play(), pause: () => this.pause(), resume: () => this.resume(),
      restart: () => this.play(), retry: () => window.location.reload(), back: () => this.back(),
    });
    this.input = new Input(shell, () => this.state, () => this.pause(), () => this.play());
    this.track.reset();
    this.track.update(0);
    this.view.update(0, 0, 0, 0, config.roadWidth, 0);
    performance.mark('first-frame-begin');
    performance.mark('shader-compile-start');
    this.view.renderer.compile(this.view.scene, this.view.camera);
    performance.mark('shader-compile-end');
    performance.measure('shader-compile', 'shader-compile-start', 'shader-compile-end');
    performance.mark('first-render-start');
    this.view.render();
    performance.mark('first-frame-rendered');
    performance.measure('first-render', 'first-render-start', 'first-frame-rendered');
    performance.measure('first-frame-after-assets', 'assets-loaded', 'first-frame-rendered');
    performance.mark('first-frame-stats', { detail: { calls: this.view.renderer.info.render.calls, triangles: this.view.renderer.info.render.triangles, geometries: this.view.renderer.info.memory.geometries, textures: this.view.renderer.info.memory.textures } });
    this.overlays.show('start');
    const best = shell.querySelector<HTMLElement>('[data-best]');
    if (best) best.textContent = bestLabel(this.save, config.mode);
    performance.mark('game-ready');
    performance.measure('bootstrap-to-ready', 'game-bootstrap-start', 'game-ready');
    performance.measure('paint-to-ready', 'game-static-painted', 'game-ready');
    this.view.renderer.setAnimationLoop(this.frame);
  }

  static async create(shell: HTMLElement, config: GameConfig): Promise<GameEngine> {
    const base = shell.dataset.assetBase ?? '/game/v1';
    performance.mark('renderer-start');
    const view = new Renderer(shell, config);
    performance.mark('renderer-created');
    performance.measure('renderer-create', 'renderer-start', 'renderer-created');
    try {
      await view.loadAssets(base, (loaded, total) => {
        const progress = shell.querySelector<HTMLProgressElement>('progress');
        if (progress && total > 0) { progress.max = total; progress.value = loaded; }
      });
      return new GameEngine(shell, config, view);
    } catch (error) {
      console.error(error);
      new Overlays(shell).error('The 3D game could not load. Check your connection and try again.');
      shell.querySelector<HTMLButtonElement>('[data-action="retry"]')?.addEventListener('click', () => window.location.reload(), { once: true });
      throw error;
    }
  }

  private play(): void {
    this.physics.reset();
    this.track.reset();
    this.input.clear();
    this.view.resetVfx();
    this.accumulator = 0;
    this.sampleTime = 0;
    this.sampleFrames = 0;
    this.hud.update(this.physics.stats, 0, this.config.roadWidth);
    this.state = 'playing';
    this.overlays.show(this.state);
  }

  private pause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.input.clear();
      this.overlays.show(this.state);
    } else if (this.state === 'paused') this.resume();
  }

  private resume(): void {
    if (this.state !== 'paused') return;
    this.input.clear();
    this.lastTime = performance.now();
    this.state = 'playing';
    this.overlays.show(this.state);
  }

  private back(): void {
    this.input.clear();
    this.physics.reset();
    this.track.reset();
    this.track.update(0);
    this.state = 'start';
    this.overlays.show(this.state);
  }

  private gameOver = (): void => {
    if (this.state !== 'playing') return;
    this.state = 'gameover';
    this.input.clear();
    this.view.vfxEvent('collision');
    const newBest = commitRun(this.save, this.config.mode, this.physics.stats);
    this.hud.result(this.physics.stats, bestLabel(this.save, this.config.mode), newBest);
    this.overlays.show(this.state);
    const best = this.shell.querySelector<HTMLElement>('[data-best]');
    if (best) best.textContent = bestLabel(this.save, this.config.mode);
  };

  private frame = (time: number): void => {
    if (this.state !== 'playing' && Math.floor(time / 100) === Math.floor(this.lastTime / 100)) return;
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 0;
    this.lastTime = time;
    if (this.state === 'playing') {
      this.accumulator += dt;
      while (this.accumulator >= 1 / 60 && this.state === 'playing') {
        this.physics.update(1 / 60, this.input, this.track, this.gameOver, (name) => {
          this.view.vfxEvent(name);
          if (name === 'gift') this.ui.beep(720);
          if (name === 'gate') this.ui.beep(600);
          if (name === 'break') this.ui.beep(180);
        });
        this.accumulator -= 1 / 60;
      }
      this.track.update(this.physics.stats.distance);
      this.hudTime += dt;
      if (this.hudTime >= 0.1) {
        this.hud.update(this.physics.stats, this.physics.x, this.track.roadWidthAt(this.physics.stats.distance));
        this.hudTime = 0;
      }
      this.sampleTime += dt;
      this.sampleFrames += 1;
      if (this.sampleTime >= 1 && this.sampleTime < 1.1 && this.tier === 0) {
        const fps = this.sampleFrames / this.sampleTime;
        this.tier = fps < 28 ? 2 : fps < 45 ? 1 : 0;
        this.view.setPerformanceTier(this.tier);
      }
    }
    this.view.update(this.physics.x, this.physics.y, this.input.steer, this.physics.stats.distance, this.track.roadWidthAt(this.physics.stats.distance), dt);
    this.view.render();
  };
}
