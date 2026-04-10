# Header / Footer 标签链接功能实施计划与落地方案

## 1. 背景与目标

当前站点导航入口主要在左侧菜单，`关于我`在侧边栏与独立页面可访问。计划新增一套“标签链接（Tag Link）”能力：

- Header：用于放**站内功能标签**（先把“关于我”放到顶部标签）
- Footer：用于放**友情链接标签**（站外链接）
- 统一使用 Ant Design `Tag` 组件承载交互
- 支持主题切换（亮色/暗色）并与现有背景模式兼容
- 支持管理页可视化维护、排序、启用/停用，并可持久化到后端

## 2. 需求范围与边界

### 2.1 本期范围（MVP）

1. 新增数据结构：`headerTagLinks`、`footerTagLinks`
2. Header 和 Footer 渲染标签链接
3. 支持站内路由（如 `/about`）与站外链接（如 GitHub）
4. 管理页新增“标签链接管理”Tab，支持增删改、上下排序、启用状态
5. 本地 `server.mjs` 与 Cloudflare Worker 同步支持新字段读写
6. 主题切换时标签视觉联动（颜色、边框、hover、focus）

### 2.2 非本期范围（后续迭代）

1. 标签分组/二级标签
2. 权限粒度控制（仅管理员可见某些标签）
3. 点击埋点统计与热度推荐
4. 多语言自动翻译（本期仅维护中英双字段）

## 3. 现状评估（基于当前代码）

- 布局入口：`src/components/layout/layout.tsx`（Header 已存在 trigger 区）
- Footer：`src/components/footer/footer.tsx`（当前仅固定 GitHub 链接）
- 数据源：`src/types/data.ts` + `src/data/data.json`
- 状态管理：`src/stores/site-store.ts`（加载/保存整站数据）
- 后端：
  - 本地 Node 服务：`server.mjs`
  - 生产 Cloudflare：`cloudflare/worker.mjs`

结论：当前架构适合扩展“配置化标签链接”，但需补齐类型、store、管理页、后端字段兼容与主题样式层。

## 4. 数据模型设计

## 4.1 新增类型定义

建议新增文件：`src/types/tag-link.ts`

```ts
export type TagLinkPosition = 'header' | 'footer';
export type TagLinkTarget = '_self' | '_blank';

export interface TagLinkItem {
  id: string; // 例如: "about", "friend-github"
  name: string; // 中文名
  en_name: string; // 英文名
  url: string; // /about 或 https://example.com
  isExternal: boolean; // 是否站外
  position: TagLinkPosition; // header / footer
  target?: TagLinkTarget; // 默认规则：站外 _blank，站内 _self
  order: number; // 排序
  enabled: boolean; // 启用状态
}
```

并在 `src/types/data.ts` 扩展：

```ts
export interface SiteData {
  categories: Category[];
  searchEngines: SearchEngine[];
  backgrounds: BackgroundImage[];
  headerTagLinks: TagLinkItem[];
  footerTagLinks: TagLinkItem[];
}
```

## 4.2 初始化数据建议

在 `src/data/data.json` 增加：

- `headerTagLinks` 默认包含“关于我”
- `footerTagLinks` 默认包含 1~2 个友情链接示例

示例：

```json
{
  "headerTagLinks": [
    {
      "id": "about",
      "name": "关于我",
      "en_name": "About",
      "url": "/about",
      "isExternal": false,
      "position": "header",
      "target": "_self",
      "order": 1,
      "enabled": true
    }
  ],
  "footerTagLinks": [
    {
      "id": "friend-github",
      "name": "GitHub",
      "en_name": "GitHub",
      "url": "https://github.com/Narcissus-Ma",
      "isExternal": true,
      "position": "footer",
      "target": "_blank",
      "order": 1,
      "enabled": true
    }
  ]
}
```

## 5. 前端实施方案

## 5.1 组件拆分（单一职责）

新增组件：`src/components/tag-link-list/tag-link-list.tsx`

职责：

- 只负责渲染标签列表与点击跳转
- 不负责数据编辑、持久化
- 接收 `position` + `items` + `theme` + `language` 等 props

建议 props：

```ts
interface TagLinkListProps {
  items: TagLinkItem[];
  language: 'zh' | 'en';
  location: 'header' | 'footer';
  onTagClick?: (item: TagLinkItem) => void;
}
```

样式文件：`src/components/tag-link-list/tag-link-list.module.less`

## 5.2 Header 接入

修改 `src/components/layout/layout.tsx`：

- Header 左侧保留菜单 trigger
- Header 右侧新增标签区（flex 布局）
- 读取 `headerTagLinks`，按 `enabled + order` 渲染
- 将“关于我”从“侧边栏唯一入口”升级为“侧边栏 + 顶部快捷标签”并存（避免行为回归）

移动端策略：

- Header 标签支持 `wrap`
- 超出时使用横向滚动容器，避免挤压 trigger

## 5.3 Footer 接入

修改 `src/components/footer/footer.tsx`：

- 保留版权信息
- 右侧链接区域改为 Tag 列表（可复用 `TagLinkList`）
- 外链统一 `rel="noopener noreferrer"`

## 5.4 管理页改造

修改 `src/pages/manage-page/index.tsx`：

新增“标签链接管理”Tab，拆成两块：

1. Header 标签管理
2. Footer 标签管理

每块支持：

- 新增（名称、英文名、URL、是否站外、是否启用）
- 编辑
- 删除
- 上移/下移排序（减少引入拖拽复杂度）
- 保存后调用 `saveToServer`

建议复用 Antd：`Table + Form + Drawer/Modal + Switch + Button`。

## 5.5 状态管理与 API 调用

修改 `src/stores/site-store.ts`：

新增 state 与 action：

- `headerTagLinks`, `footerTagLinks`
- `setHeaderTagLinks`, `setFooterTagLinks`
- `addTagLink`, `updateTagLink`, `deleteTagLink`, `reorderTagLinks`

并在 `loadFromServer` 做字段兼容（老数据无新字段时给默认空数组），在 `saveToServer` 一并提交。

## 5.6 主题切换适配

目标：Tag 在 light/dark 下视觉一致且可读，且与 `data-home-background='active'` 场景兼容。

建议在 `src/assets/styles/global.less` 或 `src/assets/styles/variables.less` 增加变量：

- `--tag-link-bg`
- `--tag-link-text`
- `--tag-link-border`
- `--tag-link-hover-bg`
- `--tag-link-active-bg`

并在 `tag-link-list.module.less` 使用变量覆盖 Antd Tag 样式：

- 默认态：背景 + 边框 + 文本
- hover/focus：明显对比
- active（当前路由）：加强高亮
- 过渡：`transition` 与现有主题切换节奏一致

## 6. 后端实施方案（本地 + Cloudflare）

## 6.1 本地服务 `server.mjs`

当前 `/api/save` 直接落盘，建议增加轻量校验与回填：

1. 校验 `headerTagLinks/footerTagLinks` 是否数组
2. 过滤非法项（缺失 `id/name/url/position`）
3. 为旧数据自动补 `enabled/order/target`
4. `/api/data` 响应缺失字段时补默认值

> 说明：本项目后端是“整包保存 JSON”模式，不需要新增独立路由即可完成本功能。

## 6.2 Cloudflare Worker `cloudflare/worker.mjs`

与本地保持同构逻辑：

- `/api/save` 入参规范化后写 KV
- `/api/data` 读取 KV 后补齐默认字段
- 维持向后兼容，避免旧 KV 数据导致前端报错

## 6.3 API 统一拦截器（建议纳入本次）

为满足“API 请求统一拦截错误和认证信息”的规范，建议新增：

- `src/services/api-client.ts`

能力：

- 请求前：统一拼接 `API_BASE`、注入认证头（后续可扩展 token）
- 响应后：统一处理非 2xx 错误，标准化错误对象
- `site-store.ts` 与 `auth-store.ts` 逐步改为通过该 client 发请求

这样标签链接模块后续的接口扩展不会再分散写 `fetch`。

## 7. 文件级改造清单（建议）

新增：

- `src/types/tag-link.ts`
- `src/components/tag-link-list/tag-link-list.tsx`
- `src/components/tag-link-list/tag-link-list.module.less`
- `src/components/tag-link-list/index.ts`
- `src/services/api-client.ts`（建议）

修改：

- `src/types/data.ts`
- `src/types/index.ts`
- `src/stores/site-store.ts`
- `src/components/layout/layout.tsx`
- `src/components/layout/layout.module.less`
- `src/components/footer/footer.tsx`
- `src/components/footer/footer.module.less`
- `src/pages/manage-page/index.tsx`
- `src/pages/manage-page/manage-page.module.less`
- `src/data/data.json`
- `server.mjs`
- `cloudflare/worker.mjs`

## 8. 实施里程碑（可直接执行）

### Milestone 1：数据层与类型（0.5 天）

1. 新增 `TagLinkItem` 类型
2. 扩展 `SiteData`
3. 更新初始 `data.json`
4. `site-store` 支持新字段读取/写入

验收：首页不报错，数据可加载并保存。

### Milestone 2：展示层（0.5 天）

1. 新建 `TagLinkList` 组件
2. Header 渲染站内标签（含“关于我”）
3. Footer 渲染友情链接标签
4. 移动端布局适配

验收：标签可点击、路由/外链行为正确。

### Milestone 3：管理页（1 天）

1. 新增标签管理 Tab
2. 完成增删改、排序、启停
3. 保存后前台实时生效（刷新后仍存在）

验收：管理闭环可用。

### Milestone 4：后端与主题联动（0.5 天）

1. 本地与 Cloudflare 数据兼容补齐
2. 主题变量 + Tag 样式适配
3. 完成亮/暗/浅色背景三类场景验收

验收：主题切换无可读性问题。

### Milestone 5：质量门禁（0.5 天）

1. 执行 `npm run lint`
2. 执行 `npm run build`
3. 核对关键交互清单

验收：构建通过、无 ESLint 错误、核心功能通过人工回归。

## 9. 测试与验收清单

功能验收：

1. Header 显示站内标签，默认包含“关于我”
2. Footer 显示友情链接标签，外链新开窗口
3. 管理页新增标签后，首页/页脚立即可见
4. 删除或禁用标签后不再展示
5. 排序后展示顺序正确

主题验收：

1. 日间模式下标签文本与边框清晰
2. 夜间模式下对比度达标
3. 带背景图时标签仍清晰可点
4. hover / focus / active 态均可辨识

兼容性验收：

1. 老数据（无 tag links 字段）可正常加载
2. 本地服务与 Cloudflare 返回结构一致

## 10. 风险与应对

1. **老数据兼容风险**：缺字段导致渲染异常  
   - 应对：前后端统一 `normalizeSiteData`。
2. **移动端 Header 拥挤**：标签过多挤压菜单按钮  
   - 应对：限制默认展示数量 + 横向滚动。
3. **主题对比不足**：亮背景图下可读性下降  
   - 应对：增加半透明底、边框增强、active 态描边。
4. **管理页复杂度上升**：单文件继续膨胀  
   - 应对：拆分标签管理子组件（如 `tag-link-manager.tsx`）。

## 11. 推荐落地顺序（建议按此执行）

1. 先改 `types + store + data.json`，打通数据闭环
2. 再做 `TagLinkList + Header/Footer`，快速看到效果
3. 然后补 `manage-page` 管理能力
4. 最后补后端校验、主题细节和质量门禁

---

如按此方案推进，本功能可以在 **2~3 天**内完成首版上线（含前后端与主题联动），并保留良好的后续扩展空间。
