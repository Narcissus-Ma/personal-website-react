# Personal Website React

一个可自行部署的个人网站导航模板。它将常用链接、个人简介与站点展示集中到一个响应式、多语言页面中，并提供内容管理与可选的 Cloudflare Workers + KV 数据持久化方案。

> **重要安全限制：请勿将当前 Cloudflare Worker 部署到不受信任的公开网络。** `POST /api/save` 目前没有鉴权；`pnpm run cf:set-password` 只设置管理页面密码，**不能**保护该写接口；Worker 默认 CORS 允许任意来源（`Access-Control-Allow-Origin: *`）。在自行加入可靠的访问控制、密码哈希和受限 CORS 前，仅应在可信私有环境使用。

## 功能

- 分类展示个人常用网站与链接。
- 中英文内容切换、响应式布局、主题与背景设置。
- 管理页面用于维护分类、链接和站点信息。
- 本地 API 支持数据读取与保存。
- 可选 Cloudflare Workers + KV 部署与数据持久化。

## 技术栈

- React 18、TypeScript、Vite
- Ant Design、React Router、Zustand、Less
- Node.js、pnpm
- 可选：Cloudflare Workers 与 KV

## 快速开始

前置环境：Node.js **20.19+ 或 22.12+**，以及 pnpm。

```bash
pnpm install
cp .env.example .env.development.local
```

随后分别打开两个终端：

```bash
# 终端一：启动本地 API（默认 http://localhost:3000）
pnpm server
```

```bash
# 终端二：启动前端开发服务器（默认 http://localhost:5173）
pnpm dev
```

`.env.example` 是开发环境模板，默认将前端连接到本地 API。生产构建时，请在部署平台配置 `VITE_API_BASE`，或在本地使用仅被 Git 忽略的 `.env.production.local`。不要把开发地址写入根目录 `.env`，因为 Vite 会在所有构建模式加载该文件。仓库中的 `src/data/data.json` 是演示数据；首次部署后请替换为自己的姓名、简介、链接和图片，避免误将示例内容当作真实信息。

## Cloudflare 部署

Cloudflare Workers + KV 的配置、初始化、备份与安全限制，以 [Cloudflare Workers 部署指南](docs/cloudflare_server_deploy.md) 为权威说明。部署前请完整阅读该指南，尤其是其中关于未鉴权 `/api/save`、管理密码不保护写接口，以及任意来源 CORS 的警告。

## 贡献

欢迎提出问题、改进文档或提交代码。开始前请阅读 [贡献指南](CONTRIBUTING.md) 和 [行为准则](CODE_OF_CONDUCT.md)。安全问题请勿公开提交 Issue，具体流程见 [安全策略](SECURITY.md)。

## 许可证

本项目采用 [MIT License](LICENSE)。

---

## English summary

A self-hostable personal website and link-directory template built with React and TypeScript. Use Node.js 20.19+ or 22.12+ with pnpm; run `pnpm server` and `pnpm dev` in separate terminals for local development. See the [Cloudflare Workers deployment guide](docs/cloudflare_server_deploy.md) before deploying.

**Security notice:** the current Worker `POST /api/save` endpoint is unauthenticated, `pnpm run cf:set-password` does not protect it, and CORS allows any origin. Do not deploy it to an untrusted public environment without implementing your own access controls.
