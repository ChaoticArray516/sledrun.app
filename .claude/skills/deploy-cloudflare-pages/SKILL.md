---
name: deploy-cloudflare-pages
description: |
  将 SledRun（Astro SSG + 独立 Three.js bundle）从 workspace 本地构建并部署到 Cloudflare Pages（Direct Upload），同时同步 R2 游戏资源。包含 Token 读取、R2 bucket/CORS、上传重试、线上 200/301/404 验证。仅用于本项目；不是 OpenNext/Workers 项目。
---

# SledRun · Cloudflare Pages 部署

> 适用：本仓库 `projs/sledrun_3d/workspace`，Astro `output: 'static'`，产物 `dist/`，游戏资源走 R2。
> 不适用：OpenNext/Workers 项目；本项目不需要 WSL，也不需要 `deploy-cloudflare-worker`。

## 固定参数

| 项 | 值 |
|---|---|
| Pages 项目名 | `sledrun` |
| 生产分支 | `main` |
| Pages 生产域 | `https://sledrun.pages.dev` |
| 工程根 | `projs/sledrun_3d/workspace` |
| 输出目录 | `dist/` |
| R2 bucket | `sledrun-game-assets` |
| R2 binding | `SLEDRUN_ASSETS`（`wrangler.jsonc`） |
| 资源前缀 | `public/game/v1/**` → R2 key `v1/**` |
| Node | `22.23.4`（`.nvmrc`；本机隔离路径 `H:\sdkpkg\webArch\ClientSide\npm\node-v22.23.4\node-v22.23.4-win-x64`） |
| 凭证 | `projs/sledrun_3d/deploy/cloudflare/api_token.txt`（**仓库外，绝不提交**） |

## 一条命令

```powershell
cd projs\sledrun_3d\workspace
powershell -ExecutionPolicy Bypass -File scripts\deploy-pages.ps1 -SyncR2 -InsecureTls
```

参数：

| 参数 | 用途 |
|---|---|
| `-SkipBuild` | 跳过 `npm run check/build/check.mjs`，直接部署现有 `dist/` |
| `-SyncR2` | 创建 bucket、设 CORS、上传 `public/game/v1/**` |
| `-InsecureTls` | 仅本机 Windows 遇到 `wrangler fetch failed` 时临时用；CI 禁用 |
| `-MaxRetries` | 部署/上传重试次数，默认 5 |
| `-NodeDir` | Node 22.23.4 路径；默认已指向隔离目录 |

## 执行顺序

1. 解析 token/account（`cfut_...` + `CLOUDFLARE_ACCOUNT_ID`）。
2. 切 Node 22.23.4。
3. `npm run check` → `npm run build` → `node scripts/check.mjs`。
4. 可选：`wrangler r2 bucket create` → `cors set` → 逐文件 `r2 object put --remote`。
5. `wrangler pages deploy dist --project-name sledrun --branch main`。
6. 线上验证：三页 200、`/unknown` 404、带尾斜杠 301、OG/favicon 200、`/game/v1/*` 200。

## 当前部署记录

| 项 | 值 |
|---|---|
| Pages 项目 | `sledrun`（已创建） |
| 生产域 | `https://sledrun.pages.dev` |
| 最新 deployment | `d765866b-114e-4964-8649-4e00a0da3a3b`（2026-11-07T14:27:44Z，脚本验证部署） |
| 首次成功 deployment | `72a21c9d-d77d-4228-8e97-01c37621b3ee` |
| 预览域 | `https://72a21c9d.sledrun.pages.dev` |
| R2 bucket | `sledrun-game-assets`（已创建） |
| R2 CORS | `deploy/r2-cors.json`（rules schema，允许 `sledrun.online` / `www`） |
| R2 对象 | 10 个：3 个 entry + chunk + world.glb + basis 2 + draco 3 |

## 已知坑

- **Direct Upload 与 Git 集成互斥**：先用了 Direct Upload，之后想接 GitHub 自动构建需要**新建 Pages 项目**再绑域。
- **R2 binding 先于 bucket 会导致部署失败**：`R2 bucket 'sledrun-game-assets' not found`。先建 bucket，或部署前临时移除 binding。
- **R2 CORS 格式**：Wrangler 4.157 要求 `{ "rules": [ { "allowed": { "origins": [...], "methods": [...] } } ] }`，不是 S3 的 `AllowedOrigins`。
- **Windows `fetch failed`**：R2 大文件/连续上传偶发；脚本已重试。仅本机可用 `-InsecureTls`，CI 不要用。
- **Node 版本**：系统默认 Node 22.14 低于 `engines` 要求；脚本自动前置隔离 Node 22.23.4。
- **自定义域**：当前账户 zone 列表里没有 `sledrun.online`，不能由本 token 自动绑域；需用户把 zone 加入 Cloudflare 或手动绑定 Custom Domain。

## 安全

- 不把 token 写入仓库、`wrangler.jsonc`、`.env` 或前端。
- 脚本结束会清理 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 环境变量。
- token 文件位于 `projs/sledrun_3d/deploy/cloudflare/api_token.txt`，仓库根应为 `workspace/`，不要提交项目根。
