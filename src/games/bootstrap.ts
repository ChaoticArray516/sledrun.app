import type { GameConfig } from './config/types';
import { GameEngine } from './engine/GameEngine';

export function bootstrap(config: GameConfig): void {
  const shell = document.querySelector<HTMLElement>(`[data-game-shell][data-mode="${config.mode}"]`);
  if (!shell) return;
  performance.mark('game-bootstrap-start');
  requestAnimationFrame(() => {
    performance.mark('game-static-painted');
    void GameEngine.create(shell, config).catch(() => { });
  });
}
