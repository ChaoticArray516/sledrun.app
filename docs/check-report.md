# SledRun 3A / P0 检查报告

生成时间：2026-11-17T08:47:17.839Z

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
| home 独立 bundle gzip | PASS | 228 bytes |
| snow-road 独立 bundle gzip | PASS | 234 bytes |
| sledding 独立 bundle gzip | PASS | 229 bytes |
| 资源版本、MIME 与 GLB 压缩扩展 | PASS | 35156 bytes |

## 浏览器实测

- v2 本地 Pages：三页真实 Start/Playing/Paused/Resume/GameOver/Play again 通过；首页 77m、Snow Road 41m、3D Sledding 175m，存档分模式写入。
- 390×844：Playing 下 scrollWidth=390，canvas/visualViewport=844，触控层显示；无页面级横滚。
- 入口资源被阻断时，20 秒看门狗显示 Error + Retry；解除阻断后 Retry 恢复 Start 与 game-ready。
- 2026-11-16 正式域 sledrun.app：三页完整状态链、GameOver、Play again 和独立存档再次通过。

## Pages 与性能实测

- Pages v2 部署预览：https://5a2502e6.sledrun.pages.dev；三页 200、/unknown 404、尾斜杠 301、OG/favicon 200。
- R2 v2 上传 10 对象；入口/chunk 为 text/javascript，GLB 为 model/gltf-binary，DRACO/Basis WASM 为 application/wasm；v1 保留回滚。
- 安全头：CSP、nosniff、Referrer-Policy、Permissions-Policy 已返回。
- 既有 3A 本地 Lighthouse 证据：95/98/97；LCP 中位数 773.5ms；TBT 中位数 184ms；CLS 0.002454。当前 P0 未重新运行 Lighthouse。
- 主共享游戏 chunk gzip 约 193.7KB；GLB 35156 bytes，含 DRACO/KTX2。
- 解码器另载；完整首屏 JS、INP、TTFB 和帧率仍需按目标环境复核。

## 待测

- WebPageTest、中端 Android 真机、完整线上 INP/TTFB/帧率与回滚演练尚未完成。
- 本次仅关闭 P0 可玩性故障，不代表其他 3B 功能或全量性能验收完成。

