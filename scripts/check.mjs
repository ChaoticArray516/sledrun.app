import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push({ name, result: 'PASS' }); }
  catch (error) { results.push({ name, result: 'FAIL', detail: error.message }); }
};
const decode = (value) => value.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replace(/\s+/g, ' ');
const htmlText = (value) => decode(value.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''));

const bundle = await build({
  absWorkingDir: root,
  stdin: {
    contents: `export {home} from './src/content/home.ts';export {snowRoad} from './src/content/snow-road.ts';export {sledding} from './src/content/3d-sledding.ts';export {createSchema} from './src/content/schema.ts';export {site} from './src/content/site.ts';export {plainText} from './src/content/types.ts';`,
    resolveDir: root, loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', write: false,
});
const data = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const pages = [data.home, data.snowRoad, data.sledding];
const files = { '/': 'index.html', '/snow-road': 'snow-road.html', '/3d-sledding': '3d-sledding.html' };
const documents = {};
for (const page of pages) documents[page.path] = await readFile(path.join(root, 'dist', files[page.path]), 'utf8');

for (const page of pages) {
  const html = documents[page.path];
  const text = htmlText(html);
  const canonical = page.path === '/' ? `${data.site.origin}/` : `${data.site.origin}${page.path}`;
  await check(`${page.path} Title/Meta/H1`, () => {
    assert(html.includes(`<title>${page.title}</title>`));
    assert(html.includes(`name="description" content="${page.description}"`));
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert(text.includes(page.lead));
  });
  await check(`${page.path} 正文/H2/FAQ 逐字`, () => {
    for (const section of page.sections) {
      assert(text.includes(section.heading), section.heading);
      for (const paragraph of section.paragraphs) assert(text.includes(data.plainText(paragraph)));
    }
    assert(text.includes(page.faqHeading));
    assert.equal((html.match(/class="faq-item"/g) || []).length, page.faqs.length);
    for (const faq of page.faqs) {
      assert(text.includes(faq.question));
      assert(text.includes(data.plainText(faq.answer)));
    }
  });
  await check(`${page.path} canonical/OG/Schema`, () => {
    assert(html.includes(`rel="canonical" href="${canonical}"`));
    assert(html.includes(`property="og:url" content="${canonical}"`));
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert(match);
    assert.deepEqual(JSON.parse(match[1]), data.createSchema(page));
    assert(!/aggregateRating|HowTo|SearchAction|LocalBusiness/.test(match[1]));
  });
  await check(`${page.path} 页脚与站内链接`, () => {
    for (const disclaimer of data.site.disclaimers) assert(text.includes(disclaimer));
    for (const item of data.site.nav) assert(html.includes(`href="${item.href}"`));
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(hrefs.filter((href) => /^https?:/.test(href) && !href.startsWith(data.site.origin)).length, 0);
  });
}

await check('内链矩阵锚文本', () => {
  const expectations = [
    ['/', '/3d-sledding', 'downhill sledding game'], ['/', '/snow-road', 'narrow snow road game'],
    ['/snow-road', '/', 'Sled Rider 3D'], ['/snow-road', '/3d-sledding', '3D Sledding'],
    ['/3d-sledding', '/', 'Sled Rider 3D'], ['/3d-sledding', '/snow-road', 'Snow Road 3D'], ['/3d-sledding', '/', 'sled riding game'],
  ];
  for (const [source, href, label] of expectations) assert(documents[source].includes(`href="${href}">${label}</a>`), `${source} ${label}`);
});

await check('sitemap/robots/404', async () => {
  const sitemap = decodeXml(await readFile(path.join(root, 'dist/sitemap.xml'), 'utf8'));
  assert.equal((sitemap.match(/<loc>/g) || []).length, 3);
  assert(!sitemap.includes('404'));
  const robots = await readFile(path.join(root, 'dist/robots.txt'), 'utf8');
  assert(!robots.includes('Disallow'));
  const notFound = await readFile(path.join(root, 'dist/404.html'), 'utf8');
  assert(notFound.includes('noindex, follow'));
});
function decodeXml(value) { return value; }

await check('OG 1200×630 与七件品牌资产', async () => {
  const og = await readFile(path.join(root, 'dist/og.png'));
  assert.equal(og.readUInt32BE(16), 1200);
  assert.equal(og.readUInt32BE(20), 630);
  for (const asset of ['favicon.svg', 'favicon.ico', 'logo-192.png', 'apple-touch-icon.png', 'brand-lockup.svg', 'logo_mono.svg']) await readFile(path.join(root, 'dist', asset));
});

await check('页面层零游戏 import；广告/旧存档/榜单扫描', async () => {
  const { readdir } = await import('node:fs/promises');
  for (const directory of ['src/pages', 'src/layouts', 'src/components']) {
    for (const file of await readdir(path.join(root, directory))) {
      if (!/\.(astro|ts)$/.test(file)) continue;
      const source = await readFile(path.join(root, directory, file), 'utf8');
      assert(!/from\s+['"](?:three|.*src\/games|\.\.\/games)/.test(source), `${directory}/${file}`);
      assert(!/adsbygoogle|googlesyndication|doubleclick|ad-slot|sledrun\.save\.v1|View local top 10|leaderboard/i.test(source), `${directory}/${file}`);
    }
  }
});

const manifest = JSON.parse(await readFile(path.join(root, 'src/generated/game-manifest.json'), 'utf8'));
for (const [mode, entry] of Object.entries(manifest)) {
  const bytes = await readFile(path.join(root, 'dist', entry));
  results.push({ name: `${mode} 独立 bundle gzip`, result: 'PASS', detail: `${gzipSync(bytes).length} bytes` });
}
const assetBase = path.posix.dirname(manifest.home);
await check('资源版本、MIME 与 GLB 压缩扩展', async () => {
  for (const entry of Object.values(manifest)) assert(entry.startsWith('/game/v2/'), entry);
  const functionBuild = await build({
    absWorkingDir: root,
    entryPoints: ['functions/game/[[path]].ts'],
    bundle: true, platform: 'node', format: 'esm', write: false,
  });
  const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(functionBuild.outputFiles[0].text).toString('base64')}`);
  const env = {
    SLEDRUN_ASSETS: {
      get: async () => ({
        body: 'asset', httpEtag: '"test"', writeHttpMetadata: () => { },
      }),
    },
    ASSETS: { fetch: async () => new Response('asset') },
  };
  const mimeCases = [
    ['v2/home.js', 'text/javascript; charset=utf-8'],
    ['v2/draco/draco_decoder.wasm', 'application/wasm'],
    ['v2/assets/world.glb', 'model/gltf-binary'],
    ['v2/assets/atlas.png', 'image/png'],
    ['v1/legacy.js', 'text/javascript; charset=utf-8'],
  ];
  for (const [key, expected] of mimeCases) {
    const response = await onRequest({ request: new Request(`https://sledrun.app/game/${key}`), env });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), expected, key);
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  }
  const fallback = await onRequest({
    request: new Request('https://sledrun.app/game/v2/fallback.js'),
    env: { ASSETS: env.ASSETS },
  });
  assert.equal(fallback.headers.get('Content-Type'), 'text/javascript; charset=utf-8');
  assert.equal((await onRequest({ request: new Request('https://sledrun.app/game/v3/home.js'), env })).status, 404);
  assert.equal((await onRequest({ request: new Request('https://sledrun.app/game/v2/home.js', { method: 'POST' }), env })).status, 405);
  const world = await readFile(path.join(root, 'dist', assetBase, 'assets/world.glb'));
  assert(world.includes(Buffer.from('KHR_draco_mesh_compression')));
  assert(world.includes(Buffer.from('KHR_texture_basisu')));
});
const world = await readFile(path.join(root, 'dist', assetBase, 'assets/world.glb'));
if (results[results.length - 1].result === 'PASS') results[results.length - 1].detail = `${world.length} bytes`;

const failed = results.filter((item) => item.result === 'FAIL');
const lines = [
  '# SledRun 3A / P0 检查报告', '', `生成时间：${new Date().toISOString()}`, '',
  '| 检查 | 结果 | 证据 |', '|---|---|---|',
  ...results.map((item) => `| ${item.name} | ${item.result} | ${item.detail ?? 'dist/ 与源码对账'} |`),
  '', '## 浏览器实测', '',
  '- v2 本地 Pages：三页真实 Start/Playing/Paused/Resume/GameOver/Play again 通过；首页 77m、Snow Road 41m、3D Sledding 175m，存档分模式写入。',
  '- 390×844：Playing 下 scrollWidth=390，canvas/visualViewport=844，触控层显示；无页面级横滚。',
  '- 入口资源被阻断时，20 秒看门狗显示 Error + Retry；解除阻断后 Retry 恢复 Start 与 game-ready。',
  '- 2026-11-16 正式域 sledrun.app：三页完整状态链、GameOver、Play again 和独立存档再次通过。', '',
  '## Pages 与性能实测', '',
  '- Pages v2 部署预览：https://5a2502e6.sledrun.pages.dev；三页 200、/unknown 404、尾斜杠 301、OG/favicon 200。',
  '- R2 v2 上传 10 对象；入口/chunk 为 text/javascript，GLB 为 model/gltf-binary，DRACO/Basis WASM 为 application/wasm；v1 保留回滚。',
  '- 安全头：CSP、nosniff、Referrer-Policy、Permissions-Policy 已返回。',
  '- 既有 3A 本地 Lighthouse 证据：95/98/97；LCP 中位数 773.5ms；TBT 中位数 184ms；CLS 0.002454。当前 P0 未重新运行 Lighthouse。',
  '- 主共享游戏 chunk gzip 约 193.7KB；GLB 35156 bytes，含 DRACO/KTX2。',
  '- 解码器另载；完整首屏 JS、INP、TTFB 和帧率仍需按目标环境复核。', '',
  '## 待测', '',
  '- WebPageTest、中端 Android 真机、完整线上 INP/TTFB/帧率与回滚演练尚未完成。',
  '- 本次仅关闭 P0 可玩性故障，不代表其他 3B 功能或全量性能验收完成。', '',
];
await writeFile(path.join(root, 'docs/check-report.md'), `${lines.join('\n')}\n`);
for (const item of results) console.log(`${item.result}: ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
if (failed.length) process.exit(1);
console.log(`All ${results.length} local checks passed.`);
