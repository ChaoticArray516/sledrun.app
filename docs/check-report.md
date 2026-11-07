# SledRun 3A 检查报告

生成时间：2026-11-07T12:27:17.989Z

| 检查 | 结果 | 证据 |
|---|---|---|
| / Title/Meta/H1 | PASS | dist/ 与源码对账 |
| / 正文/H2/FAQ 逐字 | PASS | dist/ 与源码对账 |
| / canonical/OG/Schema | PASS | dist/ 与源码对账 |
| / 页脚与站内链接 | PASS | dist/ 与源码对账 |
| /snow-road Title/Meta/H1 | PASS | dist/ 与源码对账 |
| /snow-road 正文/H2/FAQ 逐字 | PASS | dist/ 与源码对账 |
| /snow-road canonical/OG/Schema | PASS | dist/ 与源码对账 |
| /snow-road 页脚与站内链接 | PASS | dist/ 与源码对账 |
| /3d-sledding Title/Meta/H1 | PASS | dist/ 与源码对账 |
| /3d-sledding 正文/H2/FAQ 逐字 | PASS | dist/ 与源码对账 |
| /3d-sledding canonical/OG/Schema | PASS | dist/ 与源码对账 |
| /3d-sledding 页脚与站内链接 | PASS | dist/ 与源码对账 |
| 内链矩阵锚文本 | PASS | dist/ 与源码对账 |
| sitemap/robots/404 | PASS | dist/ 与源码对账 |
| OG 1200×630 与七件品牌资产 | PASS | dist/ 与源码对账 |
| 页面层零游戏 import；广告/旧存档/榜单扫描 | PASS | dist/ 与源码对账 |
| home 独立 bundle gzip | PASS | 229 bytes |
| snow-road 独立 bundle gzip | PASS | 234 bytes |
| sledding 独立 bundle gzip | PASS | 229 bytes |
| GLB 含 DRACO 与 KTX2/Basis 扩展 | PASS | 35156 bytes |

## 浏览器实测

- 首页：真实 Start/Playing/GameOver，77m 记录写入 home。
- Snow Road：真实键盘操作，62m 结算写入 snowRoad。
- 3D Sledding：175m / 224 分结算，奖励事件已触发。
- 390×844：scrollWidth=390，canvas/visualViewport=844，触控层显示。
- 844×390、768×1024、1440×900：无页面级横滚，画布等于可视视口。
- 截图：docs/screenshots/。

## Pages 与性能实测

- Wrangler Pages：三页 200；/unknown 404；/snow-road/ 301 到 /snow-road；OG 200。
- 安全头：CSP、nosniff、Referrer-Policy、Permissions-Policy 已返回。
- LCP trace 修复后三次 Lighthouse：95/98/97；LCP 中位数 773.5ms；TBT 中位数 184ms；CLS 0.002454；总下载中位数 566467 bytes；本地性能闸通过。
- Loading/Start 持续 DOM 与 trace 详见 prompts/dev_piplines/ui_design/uiux/3d_extend/lcp_trace_report.md。
- 主共享游戏 chunk gzip 约 193.7KB；GLB 13648 bytes，含 DRACO/KTX2。
- 视觉复核详见 prompts/dev_piplines/ui_design/uiux/3d_extend/visual_review_report.md。
- 解码器另载；完整首屏 JS、INP、TTFB 和帧率仍需按目标环境复核。

## 待测

- WebPageTest、中端 Android 真机、Cloudflare 线上 301/404/TLS/R2 与回滚尚未实测。
- Q12 需线上 OG URL 验收后才能关闭。

