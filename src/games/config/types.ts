export type GameMode = 'home' | 'snowRoad' | 'sledding';
export type GameState = 'loading' | 'start' | 'playing' | 'paused' | 'gameover' | 'error';
export type ObstacleType = 'tree' | 'rock' | 'log' | 'gift' | 'gate' | 'ramp' | 'gap';

export interface GameConfig {
  mode: GameMode;
  gameName: string;
  seed: number;
  roadWidth: number;
  baseSpeed: number;
  maxSpeed: number;
  steering: number;
  gravity: number;
  jumpVelocity: number;
  spawnAhead: number;
  sky: number;
  fog: number;
  snow: number;
  accent: number;
}

export interface TrackItem {
  id: number;
  type: ObstacleType;
  x: number;
  distance: number;
  width: number;
  passed: boolean;
  resolved: boolean;
}

export interface RunStats {
  distance: number;
  score: number;
  gifts: number;
  section: number;
  perfectSections: number;
  comboCount: number;
  comboMultiplier: number;
  bestCombo: number;
  airTime: number;
  gateScore: number;
  airScore: number;
}

export interface ModeRecords {
  bestDistance: number;
  bestScore: number;
  giftsTotal?: number;
  bestPerfectSections?: number;
  bestCombo?: number;
}

export interface SaveData {
  v: 1;
  soundOn: boolean;
  lastMode: GameMode;
  home: ModeRecords;
  snowRoad: ModeRecords;
  sledding: ModeRecords;
}
