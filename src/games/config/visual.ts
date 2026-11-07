import type { GameMode } from './types';

export interface VisualConfig {
  cameraFov: number;
  cameraHeight: number;
  cameraDistance: number;
  lookAhead: number;
  terrainWidth: number;
  fogNear: number;
  fogFar: number;
  exposure: number;
  sunIntensity: number;
  hemisphereIntensity: number;
  pineCount: number;
}

export const visuals: Record<GameMode, VisualConfig> = {
  home: { cameraFov: 65, cameraHeight: 4.6, cameraDistance: 8.5, lookAhead: 12, terrainWidth: 34, fogNear: 70, fogFar: 260, exposure: 0.9, sunIntensity: 2.1, hemisphereIntensity: 1.7, pineCount: 86 },
  snowRoad: { cameraFov: 65, cameraHeight: 4.1, cameraDistance: 7.6, lookAhead: 11, terrainWidth: 18, fogNear: 55, fogFar: 220, exposure: 0.78, sunIntensity: 1.8, hemisphereIntensity: 1.35, pineCount: 62 },
  sledding: { cameraFov: 68, cameraHeight: 5.2, cameraDistance: 8.8, lookAhead: 14, terrainWidth: 32, fogNear: 70, fogFar: 270, exposure: 0.88, sunIntensity: 2.2, hemisphereIntensity: 1.55, pineCount: 72 },
};
