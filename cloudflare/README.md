# Cloudflare Workers 部署

本目录包含将后端服务部署到 Cloudflare Workers 所需的所有文件。

## 文件说明

- `worker.mjs` - Cloudflare Worker 主文件，处理 API 请求
- `wrangler.toml` - Cloudflare Workers 配置文件
- `init-kv-data.mjs` - 初始化 KV 数据脚本
- `backup-kv-data.mjs` - 备份 KV 数据脚本
- `README.md` - 本文件

## 快速开始

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 KV 命名空间

```bash
# 创建生产环境 KV 命名空间
wrangler kv namespace create "SITE_DATA"

# 创建预览环境 KV 命名空间
wrangler kv namespace create "SITE_DATA" --preview
```

将输出的 `id` 和 `preview_id` 填入 `wrangler.toml` 文件。

### 4. 初始化 KV 数据

```bash
# 方式 1：使用 npm 脚本（从项目根目录）
npm run cf:init

# 方式 2：直接运行脚本
node cloudflare/init-kv-data.mjs
```

### 5. 部署 Worker

```bash
# 方式 1：使用 npm 脚本（从项目根目录）
npm run cf:deploy

# 方式 2：直接使用 wrangler 命令
cd cloudflare
wrangler deploy
```

### 6. 本地测试

```bash
# 方式 1：使用 npm 脚本（从项目根目录）
npm run cf:dev

# 方式 2：直接使用 wrangler 命令
cd cloudflare
wrangler dev
```

### 7. 配置环境变量（可选）

项目使用环境变量来切换 API 地址：

- **本地开发**：使用 `.env` 文件中的 `VITE_API_BASE`
- **生产环境**：自动使用 Cloudflare Workers URL

`.env` 文件示例：

```env
# 本地开发环境 API 地址
VITE_API_BASE=http://localhost:8787/api

# 生产环境会自动使用：https://personal-website-api.narcissus2ma.workers.dev/api
```

**注意**：`.env` 文件已在 `.gitignore` 中，不会被提交到代码仓库。

## 常用命令

### Worker 相关

```bash
# 本地开发
wrangler dev

# 部署到生产环境
wrangler deploy

# 查看实时日志
wrangler tail

# 查看部署状态
wrangler deployments list
```

### KV 存储相关

```bash
# 查看 KV 中的数据
wrangler kv key get --binding=SITE_DATA "data"

# 更新 KV 中的数据
wrangler kv key put --binding=SITE_DATA "data" --path=../src/data/data.json

# 删除 KV 中的数据
wrangler kv key delete --binding=SITE_DATA "data"

# 列出所有键
wrangler kv key list --binding=SITE_DATA
```

### npm 脚本快捷方式

从项目根目录运行：

```bash
npm run cf:dev       # 本地开发 Worker
npm run cf:deploy    # 部署 Worker
npm run cf:init      # 初始化 KV 数据
npm run cf:backup    # 备份 KV 数据
npm run cf:get       # 获取 KV 数据
npm run cf:put       # 更新 KV 数据
```

## API 端点

部署成功后，Worker 将提供以下 API 端点：

| 方法 | 端点        | 说明         |
| ---- | ----------- | ------------ |
| GET  | `/api/data` | 获取网站数据 |
| POST | `/api/save` | 保存网站数据 |

## 更新前端 API 地址

部署成功后，需要更新前端代码中的 API 地址。

在 `src/stores/site-store.ts` 中更新：

```typescript
// 修改前
const API_BASE = 'http://localhost:3000/api';

// 修改后（替换为你的 Worker URL）
const API_BASE = 'https://personal-website-api.YOUR_SUBDOMAIN.workers.dev/api';
```

## 免费额度

Cloudflare Workers 免费套餐包含：

| 资源         | 免费额度      |
| ------------ | ------------- |
| 每日请求次数 | 100,000 次/天 |
| KV 读取次数  | 100,000 次/天 |
| KV 写入次数  | 1,000 次/天   |
| KV 存储容量  | 1 GB          |
| 每月出站流量 | 10 GB         |

对于个人网站来说，这些额度完全够用。

## 注意事项

1. **数据备份**：定期使用 `npm run cf:backup` 备份 KV 数据
2. **CORS 配置**：Worker 已配置 CORS，允许跨域访问
3. **本地服务器**：原有的 `server.mjs` 仍然可以用于本地开发，不受影响

## 故障排查

### 部署失败

```bash
# 重新登录
wrangler login
```

### KV 命名空间未找到

检查 `wrangler.toml` 中的 KV 命名空间 ID 是否正确。

### CORS 错误

检查 `worker.mjs` 中的 CORS 配置。

### 读取数据返回空

```bash
# 检查 KV 中是否有数据
npm run cf:get

# 如果没有数据，重新初始化
npm run cf:init
```

## 参考文档

详细的部署指南请参考：[docs/cloudflare_server_deploy.md](../docs/cloudflare_server_deploy.md)

## 架构说明

- **本地开发**：使用项目根目录的 `server.mjs`，基于文件系统
- **生产环境**：使用 `cloudflare/worker.mjs`，基于 Cloudflare KV 存储

两者提供相同的 API 端点，可以无缝切换。
