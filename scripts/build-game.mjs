import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWatch = process.argv.includes('--watch');
const outdir = path.join(root, 'public/game/v1');
const manifestPath = path.join(root, 'src/generated/game-manifest.json');
const entries = ['home', 'snow-road', 'sledding'];

async function writeManifest(result) {
  const manifest = {};
  for (const [output, details] of Object.entries(result.metafile?.outputs ?? {})) {
    if (!details.entryPoint) continue;
    const name = entries.find((entry) => details.entryPoint.endsWith(`entries/${entry}.ts`) || details.entryPoint.endsWith(`entries\\${entry}.ts`));
    if (name) manifest[name] = `/${output.replaceAll('\\', '/').replace(/^public\//, '')}`;
  }
  for (const name of entries) {
    if (!manifest[name]) throw new Error(`Missing game bundle entry: ${name}`);
  }
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function main() {
  const { build, context } = await import('esbuild');
  const options = {
    absWorkingDir: root,
    entryPoints: Object.fromEntries(entries.map((name) => [name, `src/games/entries/${name}.ts`])),
    outdir,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    splitting: true,
    entryNames: '[name]-[hash]',
    chunkNames: 'chunks/[name]-[hash]',
    minify: true,
    sourcemap: false,
    metafile: true,
    plugins: [{
      name: 'sledrun-manifest',
      setup(buildApi) {
        buildApi.onEnd(async (result) => {
          if (!result.errors.length) await writeManifest(result);
        });
      },
    }],
  };

  if (isWatch) {
    const ctx = await context(options);
    await ctx.watch();
    console.log('Watching independent game bundles…');
    return;
  }

  await rm(outdir, { recursive: true, force: true });
  await build(options);
  await cp(path.join(root, 'assets/dist'), path.join(outdir, 'assets'), { recursive: true });
  await cp(path.join(root, 'node_modules/three/examples/jsm/libs/draco/gltf'), path.join(outdir, 'draco'), { recursive: true });
  await cp(path.join(root, 'node_modules/three/examples/jsm/libs/basis'), path.join(outdir, 'basis'), { recursive: true });
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  console.log(`Game bundles ready: ${Object.values(manifest).join(', ')}`);
}

function shutdown() {
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
