# SledRun 3A 上线清单

## 本地证据（已完成）

- `npm ci`、`npm run check`、`npm run build` 通过。
- `node scripts/check.mjs` 的 20 项本地检查通过。
- Wrangler Pages：三页 200、`/unknown` 404、`/snow-road/` 301 到 `/snow-road`。
- 首页 Lighthouse 性能 99/100，LCP 2170.5ms、CLS 0。
- 三种玩法已在真实浏览器完成 Playing/GameOver 与独立存档。

## 授权与账号边界

- [ ] 用户明确授权 Pages/R2 发布与回滚操作。
- [ ] 用户核对 Cloudflare 额度/计费（Q11/G-10）。
- [ ] 用户处理域名 DNS、TLS、GSC；代理不操作账号密码或密钥。

## R2 准备（授权后执行）

Bucket 名称按 `wrangler.jsonc`：`sledrun-game-assets`。当前对象键使用 `/game/v2/...` 对应的 `v2/...`；旧 `v1` 保留用于回滚。Pages Function `functions/game/[[path]].ts` 优先读取 R2，缺失时才回退到静态构建资产，并显式校正 MIME。

```bash
npx wrangler r2 bucket create sledrun-game-assets
npx wrangler r2 bucket cors set sledrun-game-assets --file deploy/r2-cors.json
for file in public/game/v2/assets/* public/game/v2/draco/* public/game/v2/basis/* public/game/v2/chunks/* public/game/v2/*.js; do
  key="v2/${file#public/game/v2/}"
  case "$file" in
    *.js) content_type="text/javascript; charset=utf-8" ;;
    *.wasm) content_type="application/wasm" ;;
    *.glb) content_type="model/gltf-binary" ;;
    *.png) content_type="image/png" ;;
  esac
  npx wrangler r2 object put "sledrun-game-assets/$key" --file "$file" --content-type "$content_type" --cache-control "public, max-age=31536000, immutable"
done
```

- [ ] R2 文件逐项上传成功；hash/版本目录保持不覆盖旧版。
- [ ] CORS 只允许 `https://sledrun.app`；批准的预览域另行登记。
- [ ] hash/版本资源返回 `Cache-Control: public, max-age=31536000, immutable`。

## Pages 发布（授权后执行）

```bash
npm ci && npm run check && npm run build
node scripts/check.mjs
npx wrangler pages deploy dist --project-name sledrun
```

- [ ] 记录 deployment ID、时间和构建提交/文件版本。
- [ ] 三页 200；`/unknown` 404；`/snow-road/`、`/3d-sledding/` 301 到无斜杠。
- [ ] TLS、canonical、sitemap、robots、JSON-LD 和 10 条内链线上复核。
- [ ] `https://sledrun.app/og.png` 与 favicon 返回 200，OG 为 1200×630；完成后才可关闭 Q12。
- [ ] 游戏 bundle、GLB、DRACO/KTX2 解码器均从 R2 返回 200，CORS 无错误。
- [ ] 真机验证触控、重开、帧率和首屏可玩资源；未测项保留待测。

## 回滚与监测

- [ ] 在 Pages 选择上一正常 deployment 完成一次回滚演练，记录 ID/时间/结果。
- [ ] 构建失败不覆盖线上；回滚后重新检查三页、404、301 和 OG。
- [ ] 正式域通过后由用户提交 GSC sitemap。

## 2026-11-07 首次部署记录

- Pages 项目 `sledrun` 已创建，生产分支 `main`。
- 最新脚本验证部署：`d765866b-114e-4964-8649-4e00a0da3a3b`（2026-11-07T14:27:44Z），生产 `https://sledrun.pages.dev` 200。
- 线上验证：
  - `/`、`/snow-road`、`/3d-sledding` → 200
  - `/unknown` → 404
  - `/snow-road/`、`/3d-sledding/` → 301 到无斜杠
  - `/og.png`、`/favicon.ico` → 200
  - `/game/v1/home-MPI2L3TH.js`、`world.glb`、`draco_decoder.wasm` → 200，R2 命中
- R2 `sledrun-game-assets` 已创建，10 个对象上传，CORS `rules` 已设置。
- 未完成：自定义域 `sledrun.app`（当前 token 所在账户没有该 zone）、TLS/GSC、回滚演练、真机 INP/TTFB/帧率、WebPageTest。
- 首次部署曾因 `R2 bucket 'sledrun-game-assets' not found` 失败；创建并上传后重试成功。
- 部署脚本：`workspace/scripts/deploy-pages.ps1`；项目内 Skill：`workspace/.claude/skills/deploy-cloudflare-pages/SKILL.md`。

## 2026-11-17 人物/地形 v2 部署（R2 同步 + Pages Direct Upload）

- 命令：`powershell -File scripts/deploy-pages.ps1 -SyncR2 -MaxRetries 6`（未使用 `-InsecureTls`）。
- 本地闸：`npm run check` 0 error；`npm run build` 成功；`node scripts/check.mjs` 20/20 PASS。
- R2：`sledrun-game-assets` 已存在（10004 属预期），CORS 已设；`v2/**` 上传 12 个对象，旧 `v1/**` 保留回滚。
- Pages：deployment `https://32a0168b.sledrun.pages.dev`（2026-11-17），生产分支 `main`；生产域 `https://sledrun.app` 已切换到新部署（首页入口 `home-GB454EVG.js`）。
- 部署脚本 12 项验证全部通过：三页 200、`/unknown` 404、`/snow-road/` 301、`og.png` `image/png`、`favicon.ico` 200、入口/chunk `text/javascript`、GLB `model/gltf-binary`、DRACO/Basis WASM `application/wasm`。
- 生产域复核：三页 200、404 真实 404（`noindex, follow`）、尾斜杠 301、canonical/`og:url`/sitemap/robots 均为 `https://sledrun.app`；新增 `sled_rider.glb`、`terrain_home.glb` 线上 200，hash 资源 `immutable` 一年缓存。
- 未完成：`www.sledrun.app` 仍 522（需在 Pages 绑定 www Custom Domain 或加 301 规则）；回滚演练、WebPageTest、中端 Android 真机 INP/TTFB/帧率、用户最终视觉裁定。

## 2026-11-16 P0 可玩性修复部署

- Pages `main` 部署预览：`https://5a2502e6.sledrun.pages.dev`；正式域 `https://sledrun.app` 已复测。
- R2 新增 `v2/**` 10 个对象，旧 `v1/**` 保留用于回滚；上传时逐文件写入 Content-Type 和 immutable Cache-Control。
- 部署后验证：三页 200、`/unknown` 404、尾斜杠 301、OG/favicon 200；entry/chunk 为 `text/javascript`、GLB 为 `model/gltf-binary`、DRACO/Basis WASM 为 `application/wasm`。
- 本地 Pages 三页完整 Start/Playing/Paused/Resume/GameOver/Play again 与分模式存档通过；首页 390×844 触控布局通过。
- 入口阻断时看门狗显示 Error + Retry；解除阻断后 Retry 恢复 Start 和 `game-ready`。
- 正式域三页再次完成真实 GameOver 与 Play again：首页 77m、Snow Road 41m、3D Sledding 175m / 224 分。
- 本次未使用 `-InsecureTls`；未执行旧资产删除、DNS/GSC 或自动回滚。
- 仍待测：WebPageTest、中端 Android 真机、完整线上 INP/TTFB/帧率与回滚演练。
