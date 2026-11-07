# CLAUDE.md · SledRun 3A 编码入口

> **项目**: SledRun（`https://sledrun.online/`）— 原创 3D 雪橇滑行网页游戏站
> **角色**: Kimi Code 是本工程 `workspace/` 内的唯一编码执行者；默认零项目上下文，一切以本文与指定文档为准。
> **版本**: v1.0 | **日期**: 2026-11-05 | **维护**: 督察书记（Claude Code）
> **路径约定**: 文档路径相对项目根 `projs/sledrun_3d/`；工程内文件相对 `workspace/`。从 `workspace/` 读取文档时前缀 `../`。

---

## 一、项目快照

| 项 | 定案 |
|---|---|
| 品牌/主域 | **SledRun** / **`sledrun.online`**（用户确认持有） |
| 产品 | 原创 3D 雪橇滑行网页游戏站；首页即玩；三页都可玩 |
| 3A 路由 | `/`、`/snow-road`、`/3d-sledding` + 真实 404 |
| 玩法 | 一套引擎 + 三组配置：经典无尽 / 窄道 / 下坡连击 |
| 技术栈 | **Astro SSG + vanilla Three.js**；页面层不得 import 游戏代码 |
| 部署 | **Cloudflare Pages + R2**；Node 22 LTS |
| 存档 | `localStorage` 键 **`sledrun.v1`**；`home` / `snowRoad` / `sledding` 三分支；不用 Cookie |
| 广告 | 3A 无广告系统；首屏广告请求 0 |
| 3A 边界 | 无 3B~3E、榜单、反馈表单、圣诞、账号、公开 UGC、服务端、第三方 iframe |
| 视觉 | **A · Alpine Postcard**（用户已选定）；B/C 不进入实现 |
| 启动流程 | **UI-01 已关闭**：Loading → Start → 按 Play → Playing；不自动开局 |
| 上线窗口 | 2026-11 月下旬；12 月中峰值 |

---

## 二、权威文档与阅读顺序

**冲突裁决（从高到低）**：

1. `prompts/dev_piplines/phase2/rendering_spec_v1.md`（R-01~R-25）
2. `prompts/dev_piplines/phase2/seo_tech_spec.md`（S-01~S-22）
3. `prompts/dev_piplines/phase3/3a_func_extend.md` **v1.1**
4. `prompts/dev_piplines/phase3/3a_copy_final.md` **v1.1**
5. `prompts/dev_piplines/ui_design/uiux/` 八份 Stage 2 文档
6. `prompts/dev_piplines/ui_design/3d_art_direction.md`、`game_ui_spec.md`
7. `prompts/dev_piplines/MASTER_SOP.md`
8. 图形稿（`ui_design/ui_graph/`）只作视觉依据

发现冲突**先停止编码、记录冲突**，按上述顺序裁决并回报；不得静默改写定稿、规范或施工单。

**必读顺序（每次新 session 先做完）**：

1. 本文 `workspace/CLAUDE.md`
2. `rendering_spec_v1.md` + `seo_tech_spec.md`
3. `3a_func_extend.md` v1.1（3a-01~3a-09）
4. `3a_copy_final.md` v1.1（逐字文案、FAQ、内链、Schema）
5. `uiux_design_system.md`、`uiux_game_shell.md`、`uiux_game_states.md`
6. 三页规格：`uiux_page_home.md`、`uiux_page_snow_road.md`、`uiux_page_3d_sledding.md`
7. `uiux_states_404_asset_delivery.md`、`uiux_design_review_checklist.md`

---

## 三、硬规则（违反即任务失败）

1. **先 Plan Mode**：先读文档、出规划，用户批准后才写代码；不得跳过规划直接改文件。
2. **页面层零游戏 import**：`src/pages`、`src/layouts`、`src/components` 不得 import Three.js 或 `src/games/*`；游戏为独立异步 bundle。
3. **逐字定稿**：Title/Meta/H1/H2/FAQ/锚文本/JSON-LD 只取 `3a_copy_final.md` v1.1；不得改写、缩写或"优化"。
4. **3A 不扩范围**：不做 3B~3E、榜单、反馈表单、圣诞皮肤、`/sledding-games`、第二款游戏、账号、公开 UGC、服务端、第三方游戏 iframe。
5. **品牌隔离**：`SledRun` 只允许出现在域名、Header logo/字标、Footer；不得进入 Title/H1/正文游戏名/HUD/游戏世界/状态卡。
6. **Schema 三红线**：无 `aggregateRating`、无 `HowTo`、无 `SearchAction`；无假 LocalBusiness/地址/电话；FAQ 可见文本与 `acceptedAnswer.text` 逐字一致。
7. **合规**：不做 `unblocked` / `6x` / `classroom` 页面或绕过学校/企业网络过滤的指引；不写破解/外挂/作弊；不写 `official/正版/授权`；不造假评分/评论/用户数。
8. **存档键唯一**：`sledrun.v1`；三套记录互不覆盖；读取失败回退默认值，Best 无记录显示 `—`；不得使用旧示例 `sledrun.save.v1`。
9. **部署边界**：Cloudflare Pages + R2；R2 资源 hash/版本化；CORS 仅正式域与批准预览域；**任何 token/密钥不得入库或进入前端 bundle**。
10. **移动/无障碍**：390px 无横滚；画布 `100svh`；`env(safe-area-inset-*)`；主按钮 ≥48px、其他触控 ≥44px；focus 可见；`prefers-reduced-motion` 降级；不用 `backdrop-filter`。
11. **只引用真实资产**：不输出空 OG/logo URL，不伪造尺寸；图标/OG 用 `ui_design/icon/` 与 `ui_graph/og.png` 的真实文件。
12. **汇报与落账**：每任务按 §七模板汇报；不擅自标 MASTER_SOP 的 `[X]`；不 commit/push 除非用户明确要求。

---

## 四、工程结构与命令

**建议结构**：

```text
workspace/
├── src/
│   ├── pages/          index.astro / snow-road.astro / 3d-sledding.astro / 404.astro
│   ├── layouts/        BaseLayout.astro
│   ├── components/     SiteHeader / SiteFooter / SeoHead / JsonLd / FaqList / RelatedGames
│   ├── games/          engine/ ui/ config/ storage.ts（独立 bundle 入口）
│   └── styles/         tokens.css / global.css
├── public/             favicon.svg / favicon.ico / logo-192.png / apple-touch-icon.png /
│                       brand-lockup.svg / logo_mono.svg / og.png / robots.txt / sitemap.xml
├── scripts/            check.mjs
├── docs/               check-report.md / launch-checklist.md
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── wrangler.jsonc（或 Pages 配置）
```

**命令**：

```bash
npm ci
npm run check        # astro check（若启用）
npm run build        # 输出 dist/
npm run dev
node scripts/check.mjs
```

- Node 22 LTS；`.nvmrc` + `engines` 双锁。
- Cloudflare Pages 构建：`npm ci && npm run check && npm run build`；输出 `dist/`。
- 禁止引入未签字的 UI 框架、数据库、服务端或第三方字体 CDN。

---

## 五、3A 任务顺序

| 卡 | 任务 | 依赖 |
|---|---|---|
| 3a-01 | 工程骨架与 Cloudflare Pages/R2 基座 | — |
| 3a-02 | SEO 基座与共享布局 | 3a-01 |
| 3a-03 | 游戏内核与共享状态机/HUD 壳 | 3a-01 |
| 3a-04 | 首页经典无尽玩法 + 页面 | 3a-02、3a-03 |
| 3a-05 | `/snow-road` 窄道玩法 + 页面 | 3a-02、3a-03 |
| 3a-06 | `/3d-sledding` 下坡连击玩法 + 页面 | 3a-02、3a-03 |
| 3a-07 | UI 设计系统落位与响应式/无障碍 | 3a-04~06 |
| 3a-08 | 机检与性能验收 | 3a-07 |
| 3a-09 | 部署与上线验收 | 3a-08 |

3a-04/05/06 可在 3a-03 后并行；三套配置必须共用同一引擎。任务细节以 `3a_func_extend.md` v1.1 为准，本文不复制长表。

---

## 六、验收与机检

**页面/内容**：

- 三页 Title/Meta/H1/H2/FAQ/字数逐字；FAQ 5/4/4。
- canonical = sitemap = `og:url` = `@id` 四处一致；非根路径无尾斜杠；根 `/` 例外。
- 404 返回真实 HTTP 404；带尾斜杠 301；sitemap 只含三页。
- 内链 10 条；正文站外竞品链接 0；页脚两条免责声明逐字。
- Schema 三红线 0；FAQ 与 Schema 同源。

**游戏/UI**：

- Loading/Start/Playing/Paused/GameOver 完整；UI-01 流程正确；重开 ≤1s。
- 三套 HUD 字段正确；数字 10Hz 更新，不每帧写 DOM。
- 键盘/触控/焦点/失焦暂停/`pointercancel` 正确；390px/横屏/768/1440 无横滚。
- 3A 无榜单入口；无广告、无账号、无公开 UGC、无 iframe。
- 首屏可玩 ≤1.5MB；中端 Android ≥30fps；`game-ready` 标记正确。

**性能/部署**：

- LCP ≤2.5s、CLS ≤0.05、INP ≤200ms、TTFB ≤0.8s；应用层 JS ≤30KB gzip；首屏 JS ≤200KB gzip。
- Cloudflare Pages/R2 配置、CORS、缓存、回滚演练；OG/favicon 线上可访问。
- 未实测项写"待测"，不得用预算替代实测。

**复核入口**：`uiux_design_review_checklist.md` + `3a_func_extend.md` §五。

---

## 七、汇报模板（每任务必填）

```markdown
### 任务 3a-XX
- 改动文件：
- 关键实现：
- 执行命令与结果：
- 证据（grep/curl/构建/截图/真机）：
- 与施工单/文案的偏差：无 / 具体列出
- 未决项与风险：
- 是否可进入下一任务：是 / 否（原因）
```

要求：命令可复制、结果可复核；不接受"已完成/没问题"式口头汇报。

---

## 八、当前未闭环（不阻塞 3a-01~03，阻塞最终 UI/上线验收）

| 项 | 状态 | 责任方 |
|---|---|---|
| Q8/F15 尾斜杠 301 | 11-07 骨架期实测 | 工程 |
| Q9/G-5 CWV 性能 | 骨架后第一件事 | 工程 |
| Q11/G-10 平台额度与计费 | 用户签 S3 后核 | 用户 |
| Q12 OG 线上 URL | 生产 1200×630 已交付；线上验收待做 | 工程/督察 |
| UI-02 两长尾移动 390、404 图 | 按 Stage 2 文档扩展/补交付 | 设计/督察 |
| `brand-lockup.svg` / `logo_mono.svg` | 已交付，纳入 3a-02 资产复制 | 工程 |

> `brand-lockup.svg` 用于 Header 字标（保留可访问名称）；`logo_mono.svg` 为 currentColor 单色源；`favicon.svg` 仍为多色，`favicon.ico` 作旧浏览器兜底。不得输出指向不存在文件的 URL。

---

## 九、禁止事项（一票否决）

1. 3B~3E 功能进入 3A。
2. 广告脚本/广告位/首屏广告请求。
3. 账号、公开 UGC、服务端数据库、第三方游戏 iframe。
4. `aggregateRating` / `HowTo` / `SearchAction` / 假 LocalBusiness。
5. `unblocked` / `6x` / `classroom` 页面或绕过网络过滤指引。
6. 竞品角色/雪橇/树/雪人/滚雪球/关卡/贴图/logo/截图/UI。
7. 品牌 `SledRun` 进入 Title/H1/正文游戏名/HUD/游戏世界。
8. 改写 `3a_copy_final.md` 的 Title/Meta/H1/H2/FAQ/锚文本。
9. 页面层 import Three.js；把游戏代码混进页面 bundle。
10. 跳过 Plan Mode、跳过机检、跳过回滚演练；不经用户要求 commit/push。

---

**[全文完]**
