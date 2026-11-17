import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

export interface LoadedAssets {
  scene: THREE.Group;
  prototypes: Map<string, THREE.Object3D>;
  rider?: THREE.Group;
  terrainMesh?: THREE.Mesh;
}

export class Assets {
  constructor(private base: string, private renderer: THREE.WebGLRenderer) { }

  async load(onProgress: (loaded: number, total: number) => void): Promise<LoadedAssets> {
    const manager = new THREE.LoadingManager();
    manager.onProgress = (_url, loaded, total) => onProgress(loaded, total);
    manager.itemStart = (url) => performance.mark(`asset-start-${url.split('/').pop()}`);
    manager.itemEnd = (url) => {
      const name = url.split('/').pop();
      performance.mark(`asset-end-${name}`);
      try { performance.measure(`asset-${name}`, `asset-start-${name}`, `asset-end-${name}`); } catch { }
    };
    const draco = new DRACOLoader(manager).setDecoderPath(`${this.base}/draco/`).setWorkerLimit(2);
    const ktx2 = new KTX2Loader(manager).setTranscoderPath(`${this.base}/basis/`).setWorkerLimit(2).detectSupport(this.renderer);
    const loader = new GLTFLoader(manager).setDRACOLoader(draco).setKTX2Loader(ktx2);
    performance.mark('assets-fetch-start');
    const [worldGltf, riderGltf, terrainGltf] = await Promise.all([
      loader.loadAsync(`${this.base}/assets/world.glb`),
      loader.loadAsync(`${this.base}/assets/sled_rider.glb`),
      loader.loadAsync(`${this.base}/assets/terrain_home.glb`),
    ]);
    performance.mark('assets-loaded');
    performance.measure('assets-load-total', 'assets-fetch-start', 'assets-loaded');
    const prototypes = new Map<string, THREE.Object3D>();
    worldGltf.scene.traverse((object) => {
      if (object.name) prototypes.set(object.name, object);
    });
    riderGltf.scene.traverse((object) => {
      if (object.name === 'sled') prototypes.set('sled', object);
    });
    let terrainMesh: THREE.Mesh | undefined;
    terrainGltf.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && !terrainMesh) terrainMesh = object;
    });
    draco.dispose();
    ktx2.dispose();
    return { scene: worldGltf.scene, prototypes, rider: riderGltf.scene, terrainMesh };
  }
}
