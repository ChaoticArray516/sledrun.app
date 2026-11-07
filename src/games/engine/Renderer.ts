import * as THREE from 'three';
import type { GameConfig } from '../config/types';
import { visuals } from '../config/visual';
import { Assets } from './Assets';
import { SledRig } from './SledRig';
import { Terrain } from './Terrain';
import { Vfx } from './Vfx';

export class Renderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly prototypes = new Map<string, THREE.Object3D>();
  private visual = visuals.home;
  private sled?: THREE.Object3D;
  private rig?: SledRig;
  private terrain?: Terrain;
  private vfx?: Vfx;
  private resizeObserver: ResizeObserver;
  private dpr = 1;

  constructor(private shell: HTMLElement, private config: GameConfig) {
    this.visual = visuals[config.mode];
    const canvas = shell.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) throw new Error('Game canvas is missing');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.visual.exposure;
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 16;
    skyCanvas.height = 256;
    const skyContext = skyCanvas.getContext('2d');
    const gradient = skyContext?.createLinearGradient(0, 0, 0, 256);
    const skyColors = config.mode === 'home' ? ['#65b8cf', '#bfe9f2', '#f6e4c0'] : config.mode === 'snowRoad' ? ['#243c4c', '#536b68', '#e8b47a'] : ['#193b3a', '#8c7866', '#f6c38b'];
    gradient?.addColorStop(0, skyColors[0]);
    gradient?.addColorStop(0.68, skyColors[1]);
    gradient?.addColorStop(1, skyColors[2]);
    if (skyContext && gradient) { skyContext.fillStyle = gradient; skyContext.fillRect(0, 0, 16, 256); }
    this.scene.background = new THREE.CanvasTexture(skyCanvas);
    this.scene.fog = new THREE.Fog(config.fog, this.visual.fogNear, this.visual.fogFar);
    this.scene.add(new THREE.HemisphereLight(config.snow, config.sky, this.visual.hemisphereIntensity));
    const sun = new THREE.DirectionalLight(0xfff1d2, this.visual.sunIntensity);
    sun.position.set(-18, 24, 10);
    this.scene.add(sun);
    this.camera = new THREE.PerspectiveCamera(this.visual.cameraFov, 1, 0.1, 500);
    this.camera.position.set(0, this.visual.cameraHeight, this.visual.cameraDistance);
    this.camera.lookAt(0, 0.9, -this.visual.lookAhead);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(shell);
    window.visualViewport?.addEventListener('resize', this.resize);
    this.resize();
  }

  async loadAssets(base: string, onProgress: (loaded: number, total: number) => void): Promise<void> {
    const assets = await new Assets(base, this.renderer).load(onProgress);
    for (const [name, object] of assets.prototypes) this.prototypes.set(name, object);
    const sledPrototype = this.prototypes.get('sled');
    if (sledPrototype) {
      this.sled = sledPrototype.clone();
      this.sled.scale.setScalar(this.shell.clientWidth >= 1024 ? 1.25 : 1);
      this.rig = new SledRig(this.sled);
      this.scene.add(this.sled);
    }
    this.terrain = new Terrain(this.scene, this.config, this.visual, this.prototypes);
    performance.mark('terrain-created');
    performance.measure('terrain-create', 'assets-loaded', 'terrain-created');
    this.vfx = new Vfx(this.scene, (x, z) => this.heightAt(x, z));
  }

  private resize = (): void => {
    const width = Math.max(1, this.shell.clientWidth);
    const height = Math.max(1, this.shell.clientHeight);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.fov = width < 768 ? Math.max(68, this.visual.cameraFov) : this.visual.cameraFov;
    this.camera.updateProjectionMatrix();
  };

  setPerformanceTier(tier: number): void {
    this.dpr = tier === 0 ? Math.min(devicePixelRatio, 1.5) : tier === 1 ? 1 : 0.75;
    this.renderer.shadowMap.enabled = false;
    this.vfx?.setTier(tier);
    this.resize();
  }

  vfxEvent(name: string): void {
    this.rig?.event(name);
    this.vfx?.event(name, this.sled?.position.x ?? 0, this.sled?.position.y ?? 0);
  }

  resetVfx(): void {
    this.vfx?.reset();
    this.rig?.reset();
  }

  heightAt(x: number, z: number): number {
    return this.terrain?.heightAt(x, z) ?? 0;
  }

  update(x: number, y: number, steer: number, distance: number, roadWidth: number, dt: number): void {
    if (this.sled) this.sled.position.set(x, y + this.heightAt(x, 0), 0);
    this.rig?.update(steer, y > 0.05, dt);
    this.camera.position.x += ((x * 0.28) - this.camera.position.x) * 0.08;
    this.camera.position.y = this.visual.cameraHeight + y * 0.16;
    this.camera.lookAt(x * 0.38, y + 0.9, -this.visual.lookAhead);
    this.terrain?.update(roadWidth);
    this.vfx?.update(dt, x, y, distance, this.shell.dataset.state === 'playing');
  }

  render(): void { this.renderer.render(this.scene, this.camera); }
}
