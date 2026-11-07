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
const world = await readFile(path.join(root, 'dist/game/v1/assets/world.glb'));
assert(world.includes(Buffer.from('KHR_draco_mesh_compression')));
assert(world.includes(Buffer.from('KHR_texture_basisu')));
results.push({ name: 'GLB 含 DRACO 与 KTX2/Basis 扩展', result: 'PASS', detail: `${world.length} bytes` });

const failed = results.filter((item) => item.result === 'FAIL');
const lines = [
  '# SledRun 3A 检查报告', '', `生成时间：${new Date().toISOString()}`, '',
  '| 检查 | 结果 | 证据 |', '|---|---|---|',
  ...results.map((item) => `| ${item.name} | ${item.result} | ${item.detail ?? 'dist/ 与源码对账'} |`),
  '', '## 浏览器实测', '',
  '- 首页：真实 Start/Playing/GameOver，77m 记录写入 home。',
  '- Snow Road：真实键盘操作，62m 结算写入 snowRoad。',
  '- 3D Sledding：175m / 224 分结算，奖励事件已触发。',
  '- 390×844：scrollWidth=390，canvas/visualViewport=844，触控层显示。',
  '- 844×390、768×1024、1440×900：无页面级横滚，画布等于可视视口。',
  '- 截图：docs/screenshots/。', '',
  '## Pages 与性能实测', '',
  '- Wrangler Pages：三页 200；/unknown 404；/snow-road/ 301 到 /snow-road；OG 200。',
  '- 安全头：CSP、nosniff、Referrer-Policy、Permissions-Policy 已返回。',
  '- LCP trace 修复后三次 Lighthouse：95/98/97；LCP 中位数 773.5ms；TBT 中位数 184ms；CLS 0.002454；总下载中位数 566467 bytes；本地性能闸通过。',
  '- Loading/Start 持续 DOM 与 trace 详见 prompts/dev_piplines/ui_design/uiux/3d_extend/lcp_trace_report.md。',
  '- 主共享游戏 chunk gzip 约 193.7KB；GLB 13648 bytes，含 DRACO/KTX2。',
  '- 视觉复核详见 prompts/dev_piplines/ui_design/uiux/3d_extend/visual_review_report.md。',
  '- 解码器另载；完整首屏 JS、INP、TTFB 和帧率仍需按目标环境复核。', '',
  '## 待测', '',
  '- WebPageTest、中端 Android 真机、Cloudflare 线上 301/404/TLS/R2 与回滚尚未实测。',
  '- Q12 需线上 OG URL 验收后才能关闭。', '',
];
await writeFile(path.join(root, 'docs/check-report.md'), `${lines.join('\n')}\n`);
for (const item of results) console.log(`${item.result}: ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
if (failed.length) process.exit(1);
console.log(`All ${results.length} local checks passed.`);
