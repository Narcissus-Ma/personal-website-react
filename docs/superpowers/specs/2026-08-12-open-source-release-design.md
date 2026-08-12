# 个人导航站开源发布设计

## 目标

将项目整理为适合自行部署的个人网站导航模板：新用户能够快速了解功能、完成本地运行并按需部署到 Cloudflare；潜在贡献者能够按明确规则提交反馈和代码。

## 定位与受众

- **核心受众**：希望自行部署、维护个人导航站点的开发者和个人站长。
- **价值主张**：提供可视化内容管理、多语言、主题与背景选择、响应式布局，以及可选的 Cloudflare Workers + KV 数据持久化能力。
- **开源许可**：MIT，版权归属 `Narcissus-Ma`。

## 发布资产

### 根目录文档

- `README.md`：中文主文档，并提供英文摘要。包含项目定位、功能、技术栈、快速启动、部署入口、目录概览、贡献与许可证链接。快速启动必须列出前端与本地 API 的两个终端命令、默认端口（Vite 5173、API 3000）和 `.env.example` 的本地值。文档不承诺不存在的在线演示地址或功能。
- `LICENSE`：标准 MIT 文本。
- `.env.example`：提供不含真实域名或凭据的前端 API 地址示例，并说明本地 API 与 Cloudflare Worker 两条运行路径。
- `CONTRIBUTING.md`：开发环境、质量检查命令、分支和 PR 提交流程。
- `CODE_OF_CONDUCT.md`：简洁的贡献者行为规范和处理联系方式占位说明。
- `SECURITY.md`：支持范围、漏洞私下报告方式，以及不应在 Issue 中公开密钥或复现细节的规则。

### GitHub 协作配置

- `.github/ISSUE_TEMPLATE/bug-report.md`：收集复现步骤、预期/实际结果、环境与截图。
- `.github/ISSUE_TEMPLATE/feature-request.md`：收集使用场景、方案和替代方案。
- `.github/pull_request_template.md`：约束变更说明、验证结果、截图和关联 Issue。

### 推广文档

- `docs/open-source-promotion-plan.md`：包含预发布检查、4 周发布节奏、可复用内容选题、渠道策略和量化指标。
- 推广内容避免购买流量、诱导点赞或夸大能力；以可部署体验、技术拆解和真实迭代记录获取用户。

## 用户路径

```text
GitHub 首页 → README（价值与截图） → 本地运行 → 个性化数据
                                  └→ Cloudflare 部署指南 → Workers + KV
反馈/贡献 → Issue 或 PR 模板 → 维护者审核 → 发布说明/路线图
```

## Fork 与部署就绪改造

- 将 `src/config/api-base.ts` 改为读取 `VITE_API_BASE`，默认指向本地 API，移除作者专属生产域名。
- 将 `cloudflare/wrangler.toml` 改为无真实 KV namespace ID 的示例配置，并新增可忽略的本地配置约定；提交前不保留任何作者 Cloudflare 资源标识。
- 校准 `docs/cloudflare_server_deploy.md`，使其成为唯一完整的 Cloudflare 部署指南，以当前 `api-base.ts`、npm 脚本和 Wrangler CLI 为准，明确前端 API 地址配置和 KV 初始化步骤。`cloudflare/README.md` 仅保留架构概览、文件说明和该完整指南的链接，避免维护两套操作指引。
- 保留示例站点数据，但 README 明确说明其为演示内容，首次部署后应替换；发布前检查数据、文档、git 历史待提交内容和配置文件中是否含个人域名、密钥、密码、令牌或资源 ID。
- 在 `SECURITY.md` 与部署指南中说明安全边界：部署者必须通过密码管理脚本设置自己的管理密码；默认跨域策略和公开管理入口不适合不受信任环境，部署者应按自身域名和访问控制需求收紧配置。

## 质量基线

- README/CONTRIBUTING 明确 Node.js 和 pnpm 的版本前置条件（以项目的锁文件与 `package.json` 实际兼容性为准）。
- 发布前依次执行敏感信息检查、内部链接检查、`pnpm lint` 和 `pnpm build`，并将实际结果记录在发布 PR 中。
- `.gitignore` 持续忽略本地环境文件、构建产物和用户的 Cloudflare 私有配置。

## 维护边界

- README 仅链接已有的 `docs/cloudflare_server_deploy.md`，不重复 Cloudflare 操作细节。
- 面向 GitHub 的协作文档采用中文，以降低核心受众参与门槛。
- 不创建 GitHub 仓库、不推送代码、不启用 GitHub Actions；这些都需仓库所有者单独授权。

## 验收标准

1. 新访客能在 README 中理解用途、功能、前置环境、启动命令与部署入口，并能使用 `.env.example` 连接自身服务。
2. 作者专属 API 域名、KV ID 与私密配置均不出现在公开运行配置中。
3. 所有新增文档的内部链接指向真实文件，且 Cloudflare 部署指引与当前代码、命令一致。
4. 许可证为 MIT，协作文档具备清晰的行为与安全反馈路径及部署安全边界说明。
5. 推广计划提供按周执行动作与可追踪指标；发布前通过敏感信息检查、lint 与 build。
