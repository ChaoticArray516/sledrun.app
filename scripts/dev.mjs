import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const children = [
  spawn(node, ['scripts/build-game.mjs', '--watch'], { cwd: root, stdio: 'inherit' }),
  spawn(node, ['node_modules/astro/bin/astro.mjs', 'dev', ...process.argv.slice(2)], { cwd: root, stdio: 'inherit' }),
];

let closing = false;
function close(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 100).unref();
}
for (const child of children) child.on('exit', (code) => close(code ?? 0));
process.on('SIGINT', () => close(0));
process.on('SIGTERM', () => close(0));
