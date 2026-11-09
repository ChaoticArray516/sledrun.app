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

Bucket 名称按 `wrangler.jsonc`：`sledrun-game-assets`。对象键使用 `/game/v1/...` 对应的 `v1/...`；Pages Function `functions/game/[[path]].ts` 优先读取 R2，缺失时才回退到静态构建资产。

```bash
npx wrangler r2 bucket create sledrun-game-assets
npx wrangler r2 bucket cors set sledrun-game-assets --file deploy/r2-cors.json
for file in public/game/v1/assets/* public/game/v1/draco/* public/game/v1/basis/* public/game/v1/chunks/* public/game/v1/*.js; do
  key="v1/${file#public/game/v1/}"
  npx wrangler r2 object put "sledrun-game-assets/$key" --file "$file"
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
