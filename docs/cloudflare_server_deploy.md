# Cloudflare Workers 部署指南

本指南是本项目 Cloudflare Worker 的唯一完整部署说明。请在项目根目录执行下列命令。

> **安全警告：请勿部署到公开、不受信任的环境。** 当前 Worker 的 `POST /api/save` 未鉴权，任何能够访问 Worker 的来源都可写入数据；`npm run cf:set-password` 只设置管理页面密码，**不能**保护该写接口；Worker 默认 CORS 为 `Access-Control-Allow-Origin: *`。在加入服务端访问控制、密码哈希和受限 CORS 前，仅限可信私有环境使用，或自行实现这些安全措施。

## 前提条件

- Node.js `20.19+` 或 `22.12+`，以及 pnpm。
- Cloudflare 账号，且已通过 `wrangler login` 登录。
- 已安装项目依赖：`pnpm install`。

本地前端默认访问 `http://localhost:3000/api`。如需指向已部署的 Worker，在项目根目录的 `.env.local` 中设置：

```env
VITE_API_BASE=https://你的-worker.workers.dev/api
```

`VITE_API_BASE` 是构建时公开给浏览器的变量，不能存放密钥。Worker 的 `[vars]` 同样不应用于密钥；敏感配置应使用 Cloudflare 的 secrets 机制并在 Worker 代码中显式读取。

## 配置 KV 和 Wrangler

创建生产与预览 KV namespace：

```bash
pnpm exec wrangler kv namespace create SITE_DATA
pnpm exec wrangler kv namespace create SITE_DATA --preview
```

复制公开样板并填写上述输出中的两个 namespace ID：

```bash
cp cloudflare/wrangler.example.toml cloudflare/wrangler.toml
```

编辑私有的 `cloudflare/wrangler.toml`，将 `YOUR_PRODUCTION_KV_NAMESPACE_ID` 和 `YOUR_PREVIEW_KV_NAMESPACE_ID` 替换为真实 ID。该文件已被 Git 忽略，绝不应提交。所有 `cf:*` 命令都使用此私有配置；缺失时会提示复制样板并填写 namespace ID。

## 初始化、开发和部署

首次部署前，如需用仓库中的数据初始化**空的**生产 KV，确认目标 namespace 后手动执行：

```bash
pnpm run cf:init
```

`cf:init` 会写入生产 KV 的 `data` 键；日常部署脚本 `./cloudflare/deploy.sh` **不会**自动执行它，以避免覆盖线上数据。需要部署 Worker 时运行：

```bash
./cloudflare/deploy.sh
```

常用命令：

```bash
pnpm run cf:dev       # 本地运行 Worker
pnpm run cf:deploy    # 部署 Worker
pnpm run cf:get       # 读取生产 KV 的 data
pnpm run cf:put       # 将 src/data/data.json 写入生产 KV
pnpm run cf:set-password # 设置管理页面密码，不保护 /api/save
```

部署成功后，将 Worker URL 设为 `VITE_API_BASE`，重新构建并发布前端。

## 数据备份与恢复

部署前和重要修改前都应备份：

```bash
pnpm run cf:backup
```

备份会写入 `src/data/data-backup.json`。恢复时先确认私有 `wrangler.toml` 指向正确的生产 namespace，再将备份文件复制为 `src/data/data.json`，并运行：

```bash
pnpm run cf:put
```

恢复会覆盖生产 KV 中的 `data` 键，执行前请确认备份内容与目标 namespace。
