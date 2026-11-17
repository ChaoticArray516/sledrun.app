import { mkdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(root, '..');
const making = path.join(projectRoot, 'prompts/dev_piplines/extend/3dmake/making');
const inputs = [
  { source: path.join(making, 'character/sled_rider/sled_rider/assets/models/sled_rider.glb'), output: 'sled_rider.glb' },
  { source: path.join(making, 'background/terrain_home/terrain_home/assets/models/terrain_home.glb'), output: 'terrain_home.glb' },
];
const sourceDir = path.join(root, 'assets/source/delivery');
const distDir = path.join(root, 'assets/dist');
await mkdir(sourceDir, { recursive: true });
await mkdir(distDir, { recursive: true });
const cli = path.join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');

for (const input of inputs) {
  const bytes = await readFile(input.source);
  const source = path.join(sourceDir, input.output);
  const dist = path.join(distDir, input.output);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(source, bytes);
  const result = spawnSync(process.execPath, [cli, 'draco', source, dist], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`DRACO failed for ${input.output}`);
  console.log(`${input.output}: ${bytes.length} bytes source, DRACO ready at ${dist}`);
}
