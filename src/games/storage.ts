import type { GameMode, ModeRecords, RunStats, SaveData } from './config/types';

const key = 'sledrun.v1';
const emptyRecord = (): ModeRecords => ({ bestDistance: 0, bestScore: 0 });
const defaults = (): SaveData => ({
  v: 1,
  soundOn: true,
  lastMode: 'home',
  home: { ...emptyRecord(), giftsTotal: 0 },
  snowRoad: { ...emptyRecord(), bestPerfectSections: 0 },
  sledding: { ...emptyRecord(), bestCombo: 0 },
});

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function loadSave(): SaveData {
  const fallback = defaults();
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!parsed || parsed.v !== 1) return fallback;
    for (const mode of ['home', 'snowRoad', 'sledding'] as const) {
      const source = parsed[mode] ?? {};
      fallback[mode].bestDistance = numberOrZero(source.bestDistance);
      fallback[mode].bestScore = numberOrZero(source.bestScore);
      if (mode === 'home') fallback.home.giftsTotal = numberOrZero(source.giftsTotal);
      if (mode === 'snowRoad') fallback.snowRoad.bestPerfectSections = numberOrZero(source.bestPerfectSections);
      if (mode === 'sledding') fallback.sledding.bestCombo = numberOrZero(source.bestCombo);
    }
    fallback.soundOn = typeof parsed.soundOn === 'boolean' ? parsed.soundOn : true;
    if (['home', 'snowRoad', 'sledding'].includes(parsed.lastMode)) fallback.lastMode = parsed.lastMode;
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeSave(save: SaveData): void {
  try { localStorage.setItem(key, JSON.stringify(save)); } catch { }
}

export function bestLabel(save: SaveData, mode: GameMode): string {
  const best = save[mode].bestDistance;
  return best > 0 ? `${Math.floor(best).toLocaleString()} m` : '—';
}

export function commitRun(save: SaveData, mode: GameMode, stats: RunStats): boolean {
  const record = save[mode];
  const newBest = stats.distance > record.bestDistance || stats.score > record.bestScore;
  record.bestDistance = Math.max(record.bestDistance, Math.floor(stats.distance));
  record.bestScore = Math.max(record.bestScore, Math.floor(stats.score));
  if (mode === 'home') save.home.giftsTotal = numberOrZero(save.home.giftsTotal) + stats.gifts;
  if (mode === 'snowRoad') save.snowRoad.bestPerfectSections = Math.max(numberOrZero(save.snowRoad.bestPerfectSections), stats.perfectSections);
  if (mode === 'sledding') save.sledding.bestCombo = Math.max(numberOrZero(save.sledding.bestCombo), stats.bestCombo);
  save.lastMode = mode;
  writeSave(save);
  return newBest;
}
