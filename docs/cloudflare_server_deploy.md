# Cloudflare Workers 部署指南

本文档介绍如何将个人网站的后端服务从 Node.js 服务器迁移到 Cloudflare Workers，实现免费的生产环境部署。

## 目录

- [概述](#概述)
- [架构说明](#架构说明)
- [前提条件](#前提条件)
- [部署步骤](#部署步骤)
- [常用命令](#常用命令)
- [免费额度](#免费额度)
- [注意事项](#注意事项)
- [故障排查](#故障排查)

## 概述

Cloudflare Workers 是一个无服务器计算平台，可以在 Cloudflare 的全球边缘网络上运行 JavaScript/TypeScript 代码。相比传统的 Node.js 服务器，它具有以下优势：

- **完全免费**：每天 100,000 次请求
- **全球 CDN**：自动在全球 300+ 个数据中心部署
- **无需维护**：无需管理服务器，自动扩展
- **自动 HTTPS**：内置 SSL 证书
- **边缘计算**：代码在离用户最近的地方执行，响应速度快

## 架构说明

### 原有架构（Node.js 服务器）

```
前端 (React) → Node.js 服务器 → 文件系统 (data.json)
```

### 新架构（Cloudflare Workers）

```
前端 (React) → Cloudflare Workers → KV 存储
```

### 主要变更

1. **cloudflare/worker.mjs** - Cloudflare Workers 版本的服务器文件
2. **数据存储** - 从本地文件系统迁移到 Cloudflare KV（键值存储）
3. **API 端点** - 保持不变，仍然使用 `/api/data` 和 `/api/save`
4. **原有服务器** - 项目根目录的 `server.mjs` 仍然可以用于本地开发，不受影响

## 前提条件

### 1. Cloudflare 账号

- 注册一个免费的 Cloudflare 账号：https://dash.cloudflare.com/sign-up

### 2. 安装 Wrangler CLI

Wrangler 是 Cloudflare Workers 的官方命令行工具。

```bash
pnpm install -g wrangler
```

验证安装：

```bash
wrangler --version
```

### 3. 登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，让你授权 Wrangler 访问你的 Cloudflare 账号。

## 部署步骤

### 步骤 1：创建 KV 命名空间

Cloudflare KV 是一个全球分布的键值存储服务。我们需要创建两个命名空间：

- **生产环境**：用于正式部署
- **预览环境**：用于本地开发和测试

```bash
# 创建生产环境 KV 命名空间
wrangler kv namespace create "SITE_DATA"

# 创建预览环境 KV 命名空间
wrangler kv namespace create "SITE_DATA" --preview
```

命令会输出类似这样的内容：

```
{ binding = "SITE_DATA", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
{ binding = "SITE_DATA", preview_id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

**重要**：请保存这两个 ID，下一步需要用到。

### 步骤 2：更新 wrangler.toml

打开 `cloudflare/wrangler.toml` 文件，将上一步获取的 `id` 和 `preview_id` 填入：

```toml
name = "personal-website-api"
main = "worker.mjs"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SITE_DATA"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 步骤 3：初始化 KV 数据

将现有的 `src/data/data.json` 数据上传到 KV 存储：

```bash
# 方式 1：使用 npm 脚本
npm run cf:init

# 方式 2：直接使用 wrangler 命令
wrangler kv:key put --binding=SITE_DATA "data" --path=./src/data/data.json --config cloudflare/wrangler.toml

# 方式 3：使用快速部署脚本
cd cloudflare && ./deploy.sh
```

### 步骤 4：本地测试（可选）

在部署前，可以先在本地模拟 Cloudflare Workers 环境进行测试：

```bash
npm run cf:dev
```

这会启动一个本地开发服务器，模拟 Cloudflare Workers 环境。

### 步骤 5：部署到 Cloudflare Workers

```bash
# 方式 1：使用 npm 脚本
npm run cf:deploy

# 方式 2：直接使用 wrangler 命令
wrangler deploy --config cloudflare/wrangler.toml

# 方式 3：使用快速部署脚本（包含初始化和部署）
cd cloudflare && ./deploy.sh
```

部署成功后，你会看到类似这样的输出：

```
✨ Built successfully, built in 123ms
✨ Successfully published your Worker to
  https://personal-website-api.YOUR_SUBDOMAIN.workers.dev
```

### 步骤 6：更新前端 API 地址

修改前端代码中的 API 地址，将 `http://localhost:3000` 替换为你的 Worker URL。

在 `src/stores/site-store.ts` 中更新：

```typescript
// 修改前
const API_BASE = 'http://localhost:3000/api';

// 修改后（替换为你的 Worker URL）
const API_BASE = 'https://personal-website-api.YOUR_SUBDOMAIN.workers.dev/api';
```

### 步骤 7：测试 API

使用 curl 或浏览器测试 API 是否正常工作：

```bash
# 测试获取数据
curl https://personal-website-api.YOUR_SUBDOMAIN.workers.dev/api/data

# 测试保存数据
curl -X POST https://personal-website-api.YOUR_SUBDOMAIN.workers.dev/api/save \
  -H "Content-Type: application/json" \
  -d '{"categories":[],"searchEngines":[]}'
```

## 常用命令

### Worker 相关

```bash
# 本地开发（模拟 Cloudflare Workers 环境）
wrangler dev --config cloudflare/wrangler.toml

# 部署到生产环境
wrangler deploy --config cloudflare/wrangler.toml

# 查看实时日志
wrangler tail --config cloudflare/wrangler.toml

# 查看部署状态
wrangler deployments list --config cloudflare/wrangler.toml
```

### KV 存储相关

```bash
# 查看 KV 中的数据
wrangler kv key get --binding=SITE_DATA "data" --config cloudflare/wrangler.toml

# 更新 KV 中的数据
wrangler kv key put --binding=SITE_DATA "data" --path=./src/data/data.json --config cloudflare/wrangler.toml

# 删除 KV 中的数据
wrangler kv key delete --binding=SITE_DATA "data" --config cloudflare/wrangler.toml

# 列出所有键
wrangler kv key list --binding=SITE_DATA --config cloudflare/wrangler.toml
```

### npm 脚本快捷方式

项目已配置以下 npm 脚本：

```bash
npm run cf:dev       # 本地开发 Worker
npm run cf:deploy    # 部署 Worker
npm run cf:init      # 初始化 KV 数据
npm run cf:backup    # 备份 KV 数据
npm run cf:get       # 获取 KV 数据
npm run cf:put      # 更新 KV 数据
```

## 免费额度

Cloudflare Workers 免费套餐包含：

| 资源            | 免费额度       |
| --------------- | -------------- |
| 每日请求次数    | 100,000 次/天  |
| KV 读取次数     | 100,000 次/天  |
| KV 写入次数     | 1,000 次/天    |
| KV 存储容量     | 1 GB           |
| 每月出站流量    | 10 GB          |
| Worker 执行时间 | 10 ms/CPU 时间 |

**对于个人网站来说，这些额度完全够用。**

如果需要更高的额度，可以升级到付费计划：

- Workers Paid：$5/月，1000 万次请求/月
- KV Paid：$0.50/百万次读取，$5.00/百万次写入

## 注意事项

### 1. 数据备份

定期备份 KV 中的数据到本地：

```bash
# 备份 KV 数据到本地文件
wrangler kv:key get --binding=SITE_DATA "data" > backup-$(date +%Y%m%d).json
```

### 2. CORS 配置

Worker 已配置 CORS，允许跨域访问。如果需要限制访问来源，可以修改 `server.mjs` 中的 CORS 头部：

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com', // 替换为你的域名
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};
```

### 3. API 端点

Worker 提供以下 API 端点：

| 方法 | 端点        | 说明         |
| ---- | ----------- | ------------ |
| GET  | `/api/data` | 获取网站数据 |
| POST | `/api/save` | 保存网站数据 |

### 4. 错误处理

Worker 已实现基本的错误处理，返回适当的 HTTP 状态码：

- `200` - 成功
- `404` - 端点不存在
- `500` - 服务器内部错误

### 5. 性能优化

- KV 数据会被缓存在全球边缘节点，读取速度很快
- 首次读取可能需要从主存储获取，后续读取会命中缓存
- KV 写入操作需要几秒钟才能在全球同步

## 故障排查

### 问题 1：部署失败

**错误信息**：

```
Error: No account found
```

**解决方案**：

```bash
wrangler login
```

### 问题 2：KV 命名空间未找到

**错误信息**：

```
Error: KV Namespace with id "xxx" not found
```

**解决方案**：
检查 `wrangler.toml` 中的 KV 命名空间 ID 是否正确。

### 问题 3：CORS 错误

**错误信息**：

```
Access to fetch at 'https://xxx.workers.dev' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**解决方案**：
检查 `server.mjs` 中的 CORS 配置，确保 `Access-Control-Allow-Origin` 设置正确。

### 问题 4：读取数据返回空

**可能原因**：

- KV 中没有数据
- 键名不正确

**解决方案**：

```bash
# 检查 KV 中是否有数据
npm run cf:get

# 如果没有数据，重新初始化
npm run cf:init
```

### 问题 5：写入数据失败

**错误信息**：

```
Error: Failed to write to KV
```

**可能原因**：

- 超出 KV 写入额度（免费版 1,000 次/天）
- 数据过大（最大 1 MB）

**解决方案**：

- 检查 KV 使用情况：`wrangler kv:namespace list --config cloudflare/wrangler.toml`
- 减小数据大小或升级到付费计划

## 进阶配置

### 自定义域名

如果你有自己的域名，可以将 Worker 绑定到自定义域名：

1. 在 Cloudflare Dashboard 中添加你的域名
2. 在 Workers 页面点击 "Add Route"
3. 输入路由规则，例如：`api.yourdomain.com/*`
4. 选择你的 Worker

### 环境变量

可以在 `wrangler.toml` 中配置环境变量：

```toml
[vars]
ENVIRONMENT = "production"
API_KEY = "your-api-key"
```

在 Worker 中访问：

```javascript
const env = env.ENVIRONMENT;
const apiKey = env.API_KEY;
```

### 定时任务

Cloudflare Workers 支持定时任务（Cron Triggers）：

```toml
[triggers]
crons = ["0 * * * *"]  # 每小时执行一次
```

在 Worker 中处理定时任务：

```javascript
export default {
  async scheduled(event, env, ctx) {
    // 定时任务逻辑
    console.log('Scheduled task executed');
  },
  async fetch(request, env, ctx) {
    // HTTP 请求逻辑
  },
};
```

## 参考资源

- [Cloudflare Workers 官方文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [KV 存储文档](https://developers.cloudflare.com/kv/)
- [Workers 免费额度](https://developers.cloudflare.com/workers/platform/pricing/)

## 总结

通过将后端服务迁移到 Cloudflare Workers，你可以：

✅ 节省服务器成本（完全免费）
✅ 获得全球 CDN 加速
✅ 无需维护服务器
✅ 自动扩展，无需担心流量高峰
✅ 享受边缘计算带来的低延迟

对于个人网站来说，Cloudflare Workers 是一个理想的后端解决方案。

如有问题，请参考 [故障排查](#故障排查) 部分或查阅 Cloudflare 官方文档。

---

## 管理页面鉴权功能实施方案

### 需求概述

在管理页面入口处（[home-page/index.tsx#L55-62](file:///Users/mapengfei/personal-website-react/src/pages/home-page/index.tsx#L55-62)）添加弹窗鉴权功能，通过 Cloudflare KV 存储和管理密码，确保只有授权用户才能访问管理页面。

### 技术方案

#### 架构设计

```
前端 (React) → 点击管理入口 → 弹出密码输入框
                                    ↓
                            验证密码（调用 Cloudflare Workers API）
                                    ↓
                            Worker 从 KV 读取密码进行比对
                                    ↓
                            返回验证结果（成功/失败）
                                    ↓
                            成功：跳转到管理页面
                            失败：显示错误提示
```

#### 数据存储设计

在 Cloudflare KV 中新增一个键值对：

| 键名             | 值                     | 说明             |
| ---------------- | ---------------------- | ---------------- |
| `admin_password` | `your_secure_password` | 管理页面访问密码 |

#### API 端点设计

新增 API 端点：

| 方法 | 端点               | 说明         |
| ---- | ------------------ | ------------ |
| POST | `/api/auth/verify` | 验证管理密码 |

请求格式：

```json
{
  "password": "用户输入的密码"
}
```

响应格式（成功）：

```json
{
  "success": true,
  "message": "验证成功"
}
```

响应格式（失败）：

```json
{
  "success": false,
  "message": "密码错误"
}
```

### 实现步骤

#### 步骤 1：更新 Cloudflare Worker

修改 `cloudflare/worker.mjs`，添加密码验证端点：

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 新增：密码验证端点
    if (pathname === '/api/auth/verify' && request.method === 'POST') {
      try {
        const { password } = await request.json();
        const storedPassword = await env.SITE_DATA.get('admin_password');

        if (!storedPassword) {
          return new Response(
            JSON.stringify({ success: false, message: '系统未配置密码' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (password === storedPassword) {
          return new Response(
            JSON.stringify({ success: true, message: '验证成功' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, message: '密码错误' }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (err) {
        console.error(err);
        return new Response(
          JSON.stringify({ success: false, message: '验证失败' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (pathname === '/api/save' && request.method === 'POST') {
      try {
        const data = await request.json();
        await env.SITE_DATA.put('data', JSON.stringify(data, null, 2));
        return new Response(JSON.stringify({ message: '保存成功' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: '保存失败' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (pathname === '/api/data' && request.method === 'GET') {
      try {
        const data = await env.SITE_DATA.get('data');
        if (!data) {
          return new Response(
            JSON.stringify({ categories: [], searchEngines: [] }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        return new Response(data, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: '读取失败' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
```

#### 步骤 2：创建鉴权 Store

创建 `src/stores/auth-store.ts`，用于管理鉴权状态：

```typescript
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  verifyPassword: (password: string) => Promise<boolean>;
}

const API_BASE = 'https://website.liyifei.dpdns.org/api';

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  verifyPassword: async (password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.success) {
        set({ isAuthenticated: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('验证失败:', error);
      return false;
    }
  },
}));
```

#### 步骤 3：创建鉴权弹窗组件

创建 `src/components/auth-modal/index.tsx`：

```typescript
import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores';
import styles from './auth-modal.module.less';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyPassword } = useAuthStore();

  const handleOk = async () => {
    if (!password.trim()) {
      message.warning('请输入密码');
      return;
    }

    setLoading(true);
    const success = await verifyPassword(password);
    setLoading(false);

    if (success) {
      message.success('验证成功');
      setPassword('');
      onClose();
      onSuccess();
    } else {
      message.error('密码错误');
    }
  };

  const handleCancel = () => {
    setPassword('');
    onClose();
  };

  return (
    <Modal
      title="管理页面鉴权"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="确认"
      cancelText="取消"
    >
      <div className={styles.container}>
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入管理密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleOk}
          size="large"
        />
      </div>
    </Modal>
  );
};

export default AuthModal;
```

创建 `src/components/auth-modal/auth-modal.module.less`：

```less
.container {
  padding: 20px 0;
}
```

更新 `src/components/index.ts`：

```typescript
export { default as AuthModal } from './auth-modal';
export { default as WebItem } from './web-item';
export { default as SearchBox } from './search-box';
export { default as Footer } from './footer';
```

#### 步骤 4：修改首页添加鉴权弹窗

修改 `src/pages/home-page/index.tsx`，将管理入口按钮改为点击触发弹窗：

```typescript
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Select, Button, Space, Tooltip } from 'antd';
import { GithubOutlined, SettingOutlined } from '@ant-design/icons';
import AppLayout from '@/components/layout';
import { WebItem, SearchBox, Footer, AuthModal } from '../../components';
import { useLanguage } from '../../hooks';
import styles from './home-page.module.less';
import { useSiteStore, useAuthStore } from '@/stores';

const HomePage: React.FC = () => {
  const { categories } = useSiteStore();
  const { language, setLanguage, transName, languageOptions } = useLanguage();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [authModalVisible, setAuthModalVisible] = useState(false);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname && pathname.startsWith('/category-')) {
      setTimeout(() => {
        const element = document.getElementById(pathname.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  const handleManageClick = () => {
    if (isAuthenticated) {
      navigate('/manage');
    } else {
      setAuthModalVisible(true);
    }
  };

  const handleAuthSuccess = () => {
    navigate('/manage');
  };

  return (
    <AppLayout>
      <div className={styles.home}>
        <div className={styles.toolbar}>
          <div className={styles.left}>
            <Select
              className={styles.languageSelect}
              size="large"
              value={language}
              onChange={value => setLanguage(value as 'zh' | 'en')}
            >
              {languageOptions.map(opt => (
                <Select.Option key={opt.key} value={opt.key}>
                  <Space>
                    <img
                      alt={opt.name}
                      src={opt.flag}
                      style={{ width: 16, height: 16 }}
                    />
                    {opt.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className={styles.right}>
            <Space>
              <Tooltip title="管理入口">
                <Button
                  onClick={handleManageClick}
                  icon={<SettingOutlined />}
                  size="large"
                  type="text"
                />
              </Tooltip>
              <Tooltip title="GitHub">
                <Button
                  href="https://github.com/Narcissus-Ma"
                  icon={<GithubOutlined />}
                  size="large"
                  target="_blank"
                  type="text"
                >
                  GitHub
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>

        <SearchBox />

        <div className={styles.content}>
          {categories.map((item, idx) => (
            <div key={idx}>
              {item.web && (
                <WebItem
                  id={`category-${idx}`}
                  item={item}
                  transName={transName}
                />
              )}
              {item.children?.map((subItem, subIdx) => (
                <WebItem key={subIdx} item={subItem} transName={transName} />
              ))}
            </div>
          ))}
        </div>

        <Footer />

        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </AppLayout>
  );
};

export default HomePage;
```

#### 步骤 5：初始化管理密码

在 Cloudflare KV 中设置管理密码：

```bash
# 方式 1：使用 wrangler 命令
wrangler kv key put --binding=SITE_DATA "admin_password" "your_secure_password" --config cloudflare/wrangler.toml

# 方式 2：使用 npm 脚本（需要在 package.json 中添加）
npm run cf:set-password
```

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "cf:set-password": "wrangler kv:key put --binding=SITE_DATA \"admin_password\" \"your_secure_password\" --config cloudflare/wrangler.toml",
    "cf:get-password": "wrangler kv:key get --binding=SITE_DATA \"admin_password\" --config cloudflare/wrangler.toml"
  }
}
```

#### 步骤 6：部署更新

```bash
# 部署 Worker
npm run cf:deploy

# 重新构建前端
npm run build
```

### 安全建议

1. **密码强度**：使用强密码，建议至少 12 位，包含大小写字母、数字和特殊字符
2. **定期更换**：定期更换管理密码
3. **HTTPS**：确保前端和后端都使用 HTTPS 协议
4. **环境变量**：可以考虑将密码存储在 Cloudflare Workers 的环境变量中，而不是 KV 中

### 测试验证

#### 测试步骤

1. 访问首页，点击管理入口按钮
2. 应该弹出密码输入框
3. 输入错误密码，应该显示"密码错误"提示
4. 输入正确密码，应该显示"验证成功"并跳转到管理页面
5. 再次点击管理入口，应该直接跳转到管理页面（无需重新输入密码）

#### 测试命令

```bash
# 测试验证 API
curl -X POST https://website.liyifei.dpdns.org/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"password": "your_secure_password"}'
```

### 故障排查

#### 问题 1：验证失败但密码正确

**可能原因**：

- KV 中未设置密码
- KV 中的密码与输入不一致

**解决方案**：

```bash
# 检查 KV 中是否有密码
npm run cf:get-password

# 重新设置密码
npm run cf:set-password
```

#### 问题 2：弹窗不显示

**可能原因**：

- 组件未正确导入
- 状态管理有问题

**解决方案**：

- 检查浏览器控制台是否有错误
- 确认 `AuthModal` 组件已正确导入和使用

#### 问题 3：验证成功后不跳转

**可能原因**：

- `navigate` 函数未正确调用
- 路由配置有问题

**解决方案**：

- 检查 `handleAuthSuccess` 函数是否正确调用 `navigate('/manage')`
- 确认路由配置中存在 `/manage` 路径

### 扩展功能（可选）

#### 1. 密码修改功能

可以添加一个修改密码的 API 端点，允许管理员在管理页面中修改密码：

```javascript
// 在 worker.mjs 中添加
if (pathname === '/api/auth/change-password' && request.method === 'POST') {
  try {
    const { oldPassword, newPassword } = await request.json();
    const storedPassword = await env.SITE_DATA.get('admin_password');

    if (oldPassword !== storedPassword) {
      return new Response(
        JSON.stringify({ success: false, message: '原密码错误' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await env.SITE_DATA.put('admin_password', newPassword);
    return new Response(
      JSON.stringify({ success: true, message: '密码修改成功' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, message: '修改失败' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
```

#### 2. 会话过期

可以添加会话过期机制，一段时间后需要重新验证：

```typescript
// 在 auth-store.ts 中添加
interface AuthState {
  isAuthenticated: boolean;
  authTime: number;
  verifyPassword: (password: string) => Promise<boolean>;
  checkAuth: () => boolean;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分钟

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  authTime: 0,
  verifyPassword: async (password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.success) {
        set({ isAuthenticated: true, authTime: Date.now() });
        return true;
      }
      return false;
    } catch (error) {
      console.error('验证失败:', error);
      return false;
    }
  },
  checkAuth: () => {
    const { isAuthenticated, authTime } = get();
    if (!isAuthenticated) return false;
    const now = Date.now();
    if (now - authTime > SESSION_TIMEOUT) {
      set({ isAuthenticated: false, authTime: 0 });
      return false;
    }
    return true;
  },
}));
```

#### 3. 登出功能

在管理页面添加登出按钮：

```typescript
// 在 auth-store.ts 中添加
interface AuthState {
  isAuthenticated: boolean;
  authTime: number;
  verifyPassword: (password: string) => Promise<boolean>;
  checkAuth: () => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // ... 其他代码
  logout: () => {
    set({ isAuthenticated: false, authTime: 0 });
  },
}));
```

### 总结

通过以上实施方案，可以实现以下功能：

✅ 管理页面入口鉴权保护
✅ 使用 Cloudflare KV 存储密码
✅ 弹窗式密码输入体验
✅ 验证成功后自动跳转
✅ 会话状态管理（可选）
✅ 密码修改功能（可选）
✅ 会话过期机制（可选）

该方案完全基于 Cloudflare Workers 和 KV，无需额外服务器，符合项目的无服务器架构理念。
