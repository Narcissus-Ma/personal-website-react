# 开源发布文档与配置实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将个人导航站整理为可 Fork、可在本地或 Cloudflare 上独立部署，并如实披露当前管理接口安全边界的 MIT 开源仓库。

**Architecture:** 根目录 README 负责项目价值、快速启动和导航；`docs/cloudflare_server_deploy.md` 是唯一完整的 Cloudflare 部署操作指南；协作文件与 GitHub 模板负责收集反馈。配置层使用 `.env.example` 和 Vite 环境变量解除作者资源绑定；`cloudflare/wrangler.example.toml` 提供公开样板，私有 `cloudflare/wrangler.toml` 仅存在于部署者本地。当前 Worker 写入接口的安全缺口在文档中显著披露，不把密码脚本描述为 API 访问控制。

**Tech Stack:** React 18、TypeScript、Vite、pnpm、Cloudflare Workers/KV、GitHub Markdown。

---

## 文件结构

- Create: `README.md` — 面向访客的中文主说明及英文摘要。
- Create: `LICENSE` — MIT 许可证。
- Create: `.env.example` — 安全的本地 API 配置示例。
- Create: `CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md` — 协作与安全规范。
- Create: `.github/ISSUE_TEMPLATE/bug-report.md`、`.github/ISSUE_TEMPLATE/feature-request.md`、`.github/pull_request_template.md` — GitHub 反馈模板。
- Create: `docs/open-source-promotion-plan.md` — 四周推广执行手册。
- Modify: `src/config/api-base.ts` — 从 Vite 环境变量读取 API 地址，去除作者域名。
- Modify: `package.json` — 添加明确的本地 API 启动脚本。
- Create: `cloudflare/wrangler.example.toml` — 无资源 ID 的公开 Cloudflare 配置样板。
- Delete: `cloudflare/wrangler.toml` — 删除含作者资源 ID 的已跟踪配置。
- Modify: `cloudflare/wrangler-cli.mjs` — 使用私有配置路径，并在缺失时给出建立方式。
- Modify: `cloudflare/README.md` — 缩减为目录说明及权威指南链接。
- Modify: `docs/cloudflare_server_deploy.md` — 校准到当前脚本、环境变量和安全边界。
- Modify: `.gitignore` — 忽略 Cloudflare 本地私有配置。

### Task 1: 创建可运行的本地配置路径

**Files:**
- Create: `.env.example`
- Modify: `src/config/api-base.ts`
- Modify: `package.json`

- [ ] **Step 1: 记录期望配置行为的验证命令**

Run: `node -e "const fs=require('fs'); const source=fs.readFileSync('src/config/api-base.ts','utf8'); if (!source.includes('import.meta.env.VITE_API_BASE')) process.exit(1);"`

Expected: 失败，因为当前 API 地址被硬编码。

- [ ] **Step 2: 改为环境变量驱动的 API 地址**

在 `src/config/api-base.ts` 导出 `import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'`；创建 `.env.example`，使用同一默认地址；在 `package.json` 添加 `server` 脚本运行 `node server.mjs`。

- [ ] **Step 3: 验证配置路径**

Run: `node -e "const fs=require('fs'); const source=fs.readFileSync('src/config/api-base.ts','utf8'); const env=fs.readFileSync('.env.example','utf8'); const pkg=require('./package.json'); if (!source.includes('import.meta.env.VITE_API_BASE') || !env.includes('VITE_API_BASE=http://localhost:3000/api') || pkg.scripts.server !== 'node server.mjs') process.exit(1);"`

Expected: 退出码 0。

- [ ] **Step 4: 提交**

```bash
git add src/config/api-base.ts package.json .env.example
git commit -m "chore: make local API configuration fork-ready"
```

### Task 2: 脱敏 Cloudflare 配置并统一部署指南

**Files:**
- Create: `cloudflare/wrangler.example.toml`
- Delete: `cloudflare/wrangler.toml`
- Modify: `cloudflare/wrangler-cli.mjs`
- Modify: `cloudflare/README.md`
- Modify: `docs/cloudflare_server_deploy.md`
- Modify: `.gitignore`

- [ ] **Step 1: 记录脱敏与文档权威性的验证命令**

Run: `rg -n '111673701dd54c0cbad09cc7148e8b40|bba4eb36f9a04d128bdac1cf6529937f|website\.liyifei\.dpdns\.org' cloudflare src docs README.md`

Expected: 当前命令能找到作者资源标识。

- [ ] **Step 2: 编写最小脱敏配置与单一部署入口**

新增 `cloudflare/wrangler.example.toml`；删除已跟踪 `cloudflare/wrangler.toml` 并将其加入 `.gitignore`。修改 `wrangler-cli.mjs`，让私有配置缺失时抛出“复制样板并填写 namespace ID”的错误；现有 `cf:*` 脚本继续经由该包装器生效。让 `cloudflare/README.md` 只说明目录作用并链接 `docs/cloudflare_server_deploy.md`；重写该指南中的过时路径和命令，说明 `VITE_API_BASE`、KV 初始化、管理密码设置、数据备份，以及 `/api/save` 未鉴权、密码脚本不能保护该接口、默认 CORS 允许任意来源的限制。

- [ ] **Step 3: 验证无作者资源与内部链接**

Run: `test -f cloudflare/wrangler.example.toml && ! test -f cloudflare/wrangler.toml && rg -q '^cloudflare/wrangler.toml$' .gitignore && rg -q '复制.*wrangler.example.toml' cloudflare/wrangler-cli.mjs && rg -q 'docs/cloudflare_server_deploy.md' cloudflare/README.md && ! rg -n '111673701dd54c0cbad09cc7148e8b40|bba4eb36f9a04d128bdac1cf6529937f|website\.liyifei\.dpdns\.org' src cloudflare README.md CONTRIBUTING.md SECURITY.md docs/cloudflare_server_deploy.md`

Expected: 退出码 0。

- [ ] **Step 4: 提交**

```bash
git add cloudflare/wrangler.example.toml cloudflare/wrangler-cli.mjs cloudflare/README.md docs/cloudflare_server_deploy.md .gitignore
git rm cloudflare/wrangler.toml
git commit -m "docs: make Cloudflare deployment fork-ready"
```

### Task 3: 补齐开源仓库入口与协作规范

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `SECURITY.md`
- Create: `.github/ISSUE_TEMPLATE/bug-report.md`
- Create: `.github/ISSUE_TEMPLATE/feature-request.md`
- Create: `.github/pull_request_template.md`

- [ ] **Step 1: 记录文档资产缺失的验证命令**

Run: `test -f README.md && test -f LICENSE && test -f CONTRIBUTING.md && test -f CODE_OF_CONDUCT.md && test -f SECURITY.md`

Expected: 失败，因为文件尚未齐全。

- [ ] **Step 2: 创建文档与模板**

README 必须覆盖项目价值、功能、技术栈、Node.js 20+ 与 pnpm、双终端本地运行、Cloudflare 指南、示例数据提示、贡献与许可证。许可证使用 `Copyright (c) 2026 Narcissus-Ma`。其余文档使用简洁中文模板，安全策略不得引导公开漏洞细节。README、SECURITY 与 Cloudflare 指南必须显著说明：Worker 的 `/api/save` 目前没有鉴权；`cf:set-password` 不会保护该接口；默认 CORS 允许任意来源。公开不受信任环境的部署应等待后续安全改造或自行添加访问控制。

- [ ] **Step 3: 验证文档资产与链接**

Run: `test -f README.md && test -f LICENSE && test -f CONTRIBUTING.md && test -f CODE_OF_CONDUCT.md && test -f SECURITY.md && test -f .github/ISSUE_TEMPLATE/bug-report.md && test -f .github/ISSUE_TEMPLATE/feature-request.md && test -f .github/pull_request_template.md && rg -q 'docs/cloudflare_server_deploy.md' README.md`

Expected: 退出码 0。

- [ ] **Step 4: 提交**

```bash
git add README.md LICENSE CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md .github
git commit -m "docs: add open source repository guides"
```

### Task 4: 编写推广方案并完成发布验证

**Files:**
- Create: `docs/open-source-promotion-plan.md`

- [ ] **Step 1: 记录推广文档缺失的验证命令**

Run: `test -f docs/open-source-promotion-plan.md`

Expected: 失败，因为推广方案尚未创建。

- [ ] **Step 2: 编写四周推广方案**

覆盖发布前检查、首发内容、部署教程、技术拆解、社区互动、反馈闭环；指定 GitHub、掘金、知乎、Bilibili/小红书等适配场景和可量化指标，不包含购买流量或诱导互动。

- [ ] **Step 3: 运行发布验证**

Run: `pnpm lint && pnpm build && git diff --check && ! rg -n '111673701dd54c0cbad09cc7148e8b40|bba4eb36f9a04d128bdac1cf6529937f|website\.liyifei\.dpdns\.org' -- src cloudflare README.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github package.json .env.example docs/cloudflare_server_deploy.md docs/open-source-promotion-plan.md && node --input-type=module -e "import fs from 'node:fs'; import path from 'node:path'; const files=['README.md','CONTRIBUTING.md','SECURITY.md','CODE_OF_CONDUCT.md','docs/cloudflare_server_deploy.md','docs/open-source-promotion-plan.md','cloudflare/README.md','.github/ISSUE_TEMPLATE/bug-report.md','.github/ISSUE_TEMPLATE/feature-request.md','.github/pull_request_template.md']; const broken=[]; for (const file of files) { const text=fs.readFileSync(file,'utf8'); for (const match of text.matchAll(/\\[[^\\]]+\\]\\(([^)#][^)]*)\\)/g)) { const target=match[1].trim(); if (!target || /^(https?:|mailto:|#)/.test(target)) continue; if (!fs.existsSync(path.resolve(path.dirname(file), target))) broken.push(file+' -> '+target); } } if (broken.length) { console.error(broken.join('\\n')); process.exit(1); }" && if git log --all -p -- . ':!docs/superpowers/specs' ':!docs/superpowers/plans' | rg -n '111673701dd54c0cbad09cc7148e8b40|bba4eb36f9a04d128bdac1cf6529937f|website\.liyifei\.dpdns\.org'; then echo '发现作者资源历史，公开前必须处置。'; exit 1; fi`

Expected: lint、构建和差异检查均成功，当前发布资产无作者资源；最后一段历史审计若发现作者资源，发布者需在首次公开前决定接受已公开历史、使用新仓库无历史导入，或执行经单独授权的历史重写，不能静默忽略。

- [ ] **Step 4: 提交**

```bash
git add docs/open-source-promotion-plan.md
git commit -m "docs: add open source promotion plan"
```
