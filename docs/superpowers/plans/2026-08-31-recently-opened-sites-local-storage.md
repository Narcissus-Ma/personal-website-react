# Recently Opened Sites Local Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页“常用站点”上方增加“最近打开”分类，记录用户点击过的网站，并通过 `localStorage` 在刷新、关闭标签页及重新打开网站后恢复记录，全程不修改后端数据。

**Architecture:** 新增独立的 `recent-sites-store`，使用 Zustand `persist` 中间件只持久化最近打开的网站数组，并通过安全存储适配器隔离 `localStorage` 读写异常，避免临时浏览历史进入现有 `site-store` 和后端保存流程。`WebItem` 在卡片点击时上报网站对象，同时隔离记录回调异常以保证原有 `window.open` 必定继续执行；`HomePage` 负责订阅最近记录、构造虚拟分类并在后端分类列表之前渲染。

**Tech Stack:** React 18、TypeScript、Zustand 5、Zustand Persist、Ant Design 6、Vite 7、ESLint、Prettier

---

## 1. 已确认的需求与行为

### 1.1 功能范围

- 记录首页分类区域内通过 `WebItem` 展示的网站卡片点击。
- 顶层分类和 `children` 子分类中的网站都必须被记录。
- “最近打开”分类中的网站再次被点击时也要更新最近顺序。
- “最近打开”位于服务端分类列表之前，因此在当前数据顺序下位于“常用站点”上方。
- 列表为空时不渲染“最近打开”分类；第一次点击后立即显示。
- 使用现有网站卡片布局，不增加新的卡片样式。

### 1.2 排序与去重规则

- 使用网站 `url` 作为唯一标识。
- 新点击的网站插入列表首位。
- 已存在的网站再次被点击时，从原位置移除并移动到首位。
- 重复点击时以本次点击传入的网站对象覆盖旧快照，使标题、图标和描述可以随当前站点数据更新。
- 不设置条数上限；由于来源是有限的网站目录且按 URL 去重，记录规模受站点目录规模约束。
- URL 字符串发生变化时视为一个新网站，不做域名归并或 URL 标准化。

### 1.3 持久化规则

- 使用 `localStorage`，存储键固定为 `personal-website-recent-sites`。
- 存储版本从 `1` 开始，为后续数据结构升级保留迁移入口。
- 仅持久化网站数组，不持久化 Store action 或其他运行时字段。
- 刷新页面、关闭标签页、关闭浏览器后重新访问，记录仍然存在。
- 清除站点数据、浏览器隐私清理或手动删除该存储键后，记录恢复为空。
- 同源标签页共享同一份 `localStorage` 数据，但本期不实现已打开标签页之间的实时 `storage` 事件同步；其他标签页刷新后读取最新记录。
- 持久化数据缺失、结构不合法或版本无法迁移时，安全回退到空数组，不阻断首页渲染。
- `localStorage` 读取、写入或删除因权限、隐私模式、配额等原因失败时，退化为当前页面内存状态；持久化失败不得阻断网站打开。

### 1.4 明确不在本期范围内

- 不记录搜索框打开的搜索结果。
- 不记录顶部 GitHub 按钮、页头标签链接、页脚标签链接或站内导航。
- 不增加“清空最近打开”按钮。
- 不保存点击次数或最后点击时间戳。
- 不做跨设备同步、账号同步或跨标签页实时同步。
- 不修改后端 API、Cloudflare Worker、KV、`server.mjs` 或 `src/data/data.json`。
- 不把“最近打开”作为可管理分类展示在管理页中。
- 不新增测试框架或测试依赖；当前项目没有自动化测试脚本，本期使用静态检查、构建和明确的手动场景验收。

## 2. 文件变更地图

| 文件                                   | 操作 | 单一职责                                                         |
| -------------------------------------- | ---- | ---------------------------------------------------------------- |
| `src/stores/recent-sites-store.ts`     | 新建 | 管理最近打开列表、去重置顶逻辑、数据校验和 `localStorage` 持久化 |
| `src/stores/index.ts`                  | 修改 | 从统一 Store 入口导出 `useRecentSitesStore`                      |
| `src/components/web-item/web-item.tsx` | 修改 | 接收可选点击回调、上报被点击网站、补充最近分类时钟图标           |
| `src/pages/home-page/index.tsx`        | 修改 | 订阅最近列表、构造并渲染虚拟分类、向所有网站列表传递点击回调     |

以下文件预计不需要修改：

- `src/components/web-item/web-item.module.less`：最近分类完全复用现有分类和卡片样式。
- `src/pages/home-page/home-page.module.less`：最近分类插入现有内容流，不增加独立布局。
- `src/stores/site-store.ts`：最近记录不属于服务端站点配置。
- `src/types/category.ts`：复用现有 `Website` 和 `Category` 接口即可。
- `src/data/data.json`：虚拟分类不进入静态或服务端站点数据。
- `package.json`、`pnpm-lock.yaml`：Zustand 已安装，不需要新增依赖。

## 3. 数据流

1. 用户点击任意 `WebItem` 网站卡片。
2. `WebItem` 将完整 `Website` 对象传给可选的 `onWebsiteClick` 回调。
3. `recent-sites-store` 按 URL 删除旧记录，将本次网站快照放到数组首位。
4. Zustand 更新内存状态，`persist` 同步写入 `localStorage`。
5. `WebItem` 继续执行现有 `window.open(url, '_blank')`。
6. `HomePage` 因选择性订阅到列表变化而重新渲染。
7. `HomePage` 将列表包装成虚拟 `Category`，渲染在后端分类之前。
8. 页面重新加载时，Store 从 `localStorage` 恢复并校验列表，首页直接显示最近记录。

## 4. 分任务实施步骤

### Task 1: 建立最近打开 Store 与本地持久化

**Files:**

- Create: `src/stores/recent-sites-store.ts`
- Modify: `src/stores/index.ts`

- [ ] **Step 1: 定义 Store 对外契约**

  在新文件中定义 `RecentSitesState` 接口，至少包含：
  - `recentWebsites: Website[]`：按最近点击顺序排列的网站快照。
  - `addRecentWebsite: (website: Website) => void`：登记或置顶网站。

  使用 `import type` 引入 `Website`，避免产生不必要的运行时依赖。为 Store 和 action 添加中文 TSDoc，明确其数据仅保存在浏览器本地。

- [ ] **Step 2: 提取初始状态与存储常量**

  在 Store 文件顶部定义并集中管理：
  - 空数组初始状态。
  - `personal-website-recent-sites` 存储键。
  - 存储版本 `1`。

  不在组件中重复硬编码存储键或版本号。

- [ ] **Step 3: 实现持久化数据规范化逻辑**

  增加文件内私有规范化函数，用于恢复历史数据时：
  - 确认目标值为数组。
  - 过滤不是对象或缺少有效 `url`、`title`、`logo` 的条目。
  - 将缺失或非字符串的 `desc` 规范化为空字符串。
  - 仅保留合法的可选 `is_hot` 布尔值。
  - 按 URL 去重并保留第一次出现的顺序。
  - 对完全不合法的数据返回空数组。

  该逻辑只处理浏览器缓存边界，不修改全局 `Website` 类型，也不改写服务端数据。

- [ ] **Step 4: 实现安全 Local Storage 适配器**

  在 Store 文件内创建符合 Zustand `StateStorage` 契约的适配器，对原生 `localStorage` 的 `getItem`、`setItem` 和 `removeItem` 分别做异常隔离：
  - 读取失败时返回 `null`，让 Store 使用初始空列表。
  - 写入失败时保留已经更新的内存状态，不继续向调用方抛出异常。
  - 删除失败时不阻断调用方。
  - 使用中文 `console.warn` 记录可定位的降级信息，不输出缓存内容或其他敏感数据。
  - 不使用全局变量替换 `window.localStorage`，只把该适配器交给当前 Store。

  该适配器的目标是保证浏览历史属于增强功能：即使浏览器禁止存储，网站卡片仍然能够正常打开。

- [ ] **Step 5: 实现添加、去重与置顶 action**

  `addRecentWebsite` 每次接收当前点击的网站快照，并按以下不可变更新顺序生成新数组：
  1. 删除所有 URL 与本次网站 URL 相同的旧条目。
  2. 将本次网站对象放到剩余数组首位。
  3. 一次性更新 `recentWebsites`。

  不直接修改已有数组，不修改传入的网站对象。

- [ ] **Step 6: 接入 Zustand Persist**

  使用 Zustand `persist` 和 `createJSONStorage`：
  - 使用 `createJSONStorage` 包装上一步的安全存储适配器。
  - `name` 使用已定义的固定存储键。
  - `version` 使用已定义的版本常量。
  - `partialize` 仅返回 `recentWebsites`。
  - `migrate` 对非当前版本返回空的可持久化状态，不尝试猜测未知结构。
  - `merge` 使用当前代码中的 action，只把经过规范化的 `recentWebsites` 合并进当前状态。
  - `onRehydrateStorage` 捕获 JSON 解析等恢复错误，记录通用降级信息并保留初始空列表。
  - 恢复失败时不向其他 Store 写入数据。

- [ ] **Step 7: 从 Store 统一入口导出**

  修改 `src/stores/index.ts`，按照现有导出方式增加 `useRecentSitesStore`，不改变其他 Store 的导出路径。

- [ ] **Step 8: 做 Store 级静态检查**

  Run: `pnpm exec eslint src/stores/recent-sites-store.ts src/stores/index.ts --report-unused-disable-directives --max-warnings 0`

  Expected: 命令退出码为 `0`，没有 ESLint 或 Prettier 错误。

- [ ] **Step 9: 提交 Store 变更**

  建议提交信息：`feat: persist recently opened sites locally`

  提交范围仅包含 `src/stores/recent-sites-store.ts` 和 `src/stores/index.ts`。

### Task 2: 扩展网站卡片点击契约

**Files:**

- Modify: `src/components/web-item/web-item.tsx`

- [ ] **Step 1: 扩展 `WebItemProps`**

  增加可选的 `onWebsiteClick` 属性，签名接收完整 `Website` 对象并返回 `void`。保持属性可选，确保未传入回调的现有调用方行为不变。

- [ ] **Step 2: 集中卡片点击逻辑**

  在组件内部增加具名点击处理函数，处理顺序固定为：
  1. 在 `try/catch` 中调用可选 `onWebsiteClick(web)`。
  2. 如果记录回调抛错，记录不包含网站或缓存内容的通用错误信息，但不继续抛出。
  3. 无论记录是否成功，都调用现有 `window.open(web.url, '_blank')`。

  两个动作都保持在原始用户点击的同步调用栈内，避免浏览器将打开新标签页识别为非用户触发行为。最近记录属于增强能力，任何记录或持久化异常都不得改变原有网站导航行为。

- [ ] **Step 3: 保持现有渲染兼容性**

  将卡片的内联 `onClick` 替换为新的集中处理函数，同时确认以下行为不变：
  - URL 和 `_blank` 打开方式不变。
  - Logo 失败回退逻辑不变。
  - `Hot` 标签逻辑不变。
  - 分类和网站卡片的现有样式类名不变。
  - 不把回调附加到分类标题或其他非网站元素。

- [ ] **Step 4: 补充最近分类图标映射**

  从 Ant Design Icons 引入时钟图标，并将 `linecons-clock` 映射到该图标。未知图标仍然沿用当前 `AppstoreOutlined` 回退。

- [ ] **Step 5: 做组件级静态检查**

  Run: `pnpm exec eslint src/components/web-item/web-item.tsx --report-unused-disable-directives --max-warnings 0`

  Expected: 命令退出码为 `0`，没有 ESLint 或 Prettier 错误。

- [ ] **Step 6: 提交组件契约变更**

  建议提交信息：`feat: report website card clicks`

  提交范围仅包含 `src/components/web-item/web-item.tsx`。

### Task 3: 在首页组装和展示最近打开分类

**Files:**

- Modify: `src/pages/home-page/index.tsx`

- [ ] **Step 1: 选择性订阅最近打开 Store**

  分别通过 selector 订阅：
  - `recentWebsites`
  - `addRecentWebsite`

  不订阅整个 Store，避免未来增加无关状态时触发首页重渲染。

- [ ] **Step 2: 构造虚拟分类**

  使用 `useMemo` 根据 `recentWebsites` 构造符合 `Category` 接口的展示对象：
  - `name`: `最近打开`
  - `en_name`: `Recently Opened`
  - `icon`: `linecons-clock`
  - `web`: 当前 `recentWebsites`

  该对象只存在于首页渲染阶段，不调用 `setCategories`，不插入 `useSiteStore().categories`。

- [ ] **Step 3: 在后端分类之前条件渲染**

  在 `.content` 容器中、现有 `categories.map` 之前增加最近分类：
  - `recentWebsites.length > 0` 时渲染。
  - 空数组时完全不渲染，不产生空标题或空网格。
  - 使用独立、稳定的 DOM id，例如 `recently-opened`。
  - 不改变原有 `category-${idx}` 锚点编号，避免影响现有分类路由滚动定位。

- [ ] **Step 4: 覆盖所有网站卡片点击入口**

  将 `addRecentWebsite` 作为 `onWebsiteClick` 传给：
  - 最近打开分类的 `WebItem`。
  - 每个顶层分类的 `WebItem`。
  - 每个 `children` 子分类的 `WebItem`。

  确认没有只覆盖顶层分类而遗漏子分类。

- [ ] **Step 5: 校验国际化展示**

  “最近打开”继续使用现有 `transName`：
  - 中文模式显示“最近打开”。
  - 英文模式显示“Recently Opened”。

  本期不新增 i18n 文件，因为项目当前分类名称直接通过 `name`/`en_name` 提供。

- [ ] **Step 6: 做首页级静态检查**

  Run: `pnpm exec eslint src/pages/home-page/index.tsx --report-unused-disable-directives --max-warnings 0`

  Expected: 命令退出码为 `0`，没有 ESLint 或 Prettier 错误。

- [ ] **Step 7: 提交首页集成变更**

  建议提交信息：`feat: show recently opened sites on home page`

  提交范围仅包含 `src/pages/home-page/index.tsx`。

### Task 4: 全量质量检查与手动验收

**Files:**

- Verify: `src/stores/recent-sites-store.ts`
- Verify: `src/stores/index.ts`
- Verify: `src/components/web-item/web-item.tsx`
- Verify: `src/pages/home-page/index.tsx`

- [ ] **Step 1: 检查本次差异范围**

  Run: `git status --short`

  Expected: 除实施者进入任务前已存在的用户文件外，本功能只包含文件变更地图列出的四个文件；不得出现后端、数据文件、样式文件或依赖文件变更。

- [ ] **Step 2: 检查格式**

  Run: `pnpm format:check`

  Expected: 输出包含格式检查通过信息，命令退出码为 `0`。

- [ ] **Step 3: 运行完整 ESLint**

  Run: `pnpm lint`

  Expected: 命令退出码为 `0`，没有 warning 或 error。

- [ ] **Step 4: 验证生产构建**

  Run: `pnpm build`

  Expected: TypeScript 与 Vite 构建成功，生成 `dist`，命令退出码为 `0`。

- [ ] **Step 5: 启动本地服务**

  Run: `pnpm dev`

  Expected: Vite 输出可访问的本地地址，首页加载成功且控制台没有新增错误。

- [ ] **Step 6: 执行功能验收矩阵**

  | 场景         | 操作                                            | 预期结果                                                     |
  | ------------ | ----------------------------------------------- | ------------------------------------------------------------ |
  | 初始状态     | 清除 `personal-website-recent-sites` 后打开首页 | 不显示“最近打开”，其他分类正常                               |
  | 首次点击     | 点击“常用站点”中的一个网站                      | 新标签页正常打开；原页面顶部出现“最近打开”；该网站位于第一位 |
  | 多网站排序   | 依次点击 A、B、C                                | 最近列表顺序为 C、B、A                                       |
  | 重复点击     | 再次点击 A                                      | 列表仍只有三个网站，顺序变为 A、C、B                         |
  | 子分类覆盖   | 点击任意 `children` 子分类中的网站              | 网站加入最近列表首位                                         |
  | 最近列表点击 | 点击最近列表中的 B                              | B 正常打开并移动到最近列表首位                               |
  | 页面刷新     | 刷新首页                                        | 最近列表内容和顺序保持不变                                   |
  | 路由切换     | 进入“关于”或“管理”后返回                        | 最近列表内容和顺序保持不变                                   |
  | 重开页面     | 关闭标签页后重新打开同一站点                    | 最近列表从 `localStorage` 恢复                               |
  | 多语言       | 切换中文和英文                                  | 标题分别为“最近打开”和“Recently Opened”                      |
  | 空列表恢复   | 删除本地存储键并刷新                            | 最近分类消失，首页无报错                                     |
  | 损坏 JSON    | 将存储值改成无法解析的 JSON 后刷新              | 回退为空列表，首页仍可使用，无白屏                           |
  | 错误 State   | 写入合法 JSON，但把 `recentWebsites` 改为非数组 | 规范化为空列表，首页仍可使用，无白屏                         |
  | 版本不匹配   | 将持久化对象的 `version` 改成未知版本后刷新     | 迁移为空列表，不使用未知结构，首页无白屏                     |
  | 写入失败     | 禁止当前站点存储或模拟 `setItem` 抛错后点击网站 | 网站仍正常打开；当前内存列表更新；控制台只有可定位降级提示   |
  | 读取失败     | 刷新前禁止站点存储或模拟 `getItem` 抛错         | 以空列表启动且无白屏；随后点击仍更新内存列表并正常打开网站   |
  | 管理数据隔离 | 进入管理页并触发已有保存流程                    | 保存数据中不包含“最近打开”，本地历史不受影响                 |
  | 标签页边界   | 在标签页 A 点击网站，在已打开的标签页 B 观察    | 不要求 B 实时变化；B 刷新后读取最新记录                      |
  | 移动端       | 使用窄屏浏览并点击多个网站                      | 最近分类沿用现有响应式网格，无横向溢出                       |

- [ ] **Step 7: 检查本地存储内容**

  在浏览器开发者工具 Application/Storage 面板检查：
  - 本功能只新增 `personal-website-recent-sites`，没有新增其他最近记录相关键。
  - 不影响项目现有的 `theme_mode`、`home_background`、`app_language` 等键。
  - 值中只有 Store persist 所需版本信息和 `recentWebsites` 数据。
  - 没有整个 `site-store`、认证信息或其他无关状态副本。
  - 重复点击后不存在相同 URL 的重复条目。

- [ ] **Step 8: 检查最终差异质量**

  Run: `git diff --check`

  Expected: 无尾随空格、冲突标记或空白错误，命令退出码为 `0`。

- [ ] **Step 9: 完成本功能提交**

  如果实施阶段没有采用前述分任务提交，则使用单一提交：`feat: add persistent recently opened sites`

  提交前再次确认没有把既有未跟踪目录（当前工作区中的 `.pnpm-store/`）加入提交。

## 5. 实施约束

- 遵循 React 函数组件和 Hooks 规范，不使用 Class Component。
- 新文件使用 kebab-case：`recent-sites-store.ts`。
- 公共数据结构使用 `interface`，不引入 `any`。
- 类型导入使用 `import type`。
- Store 使用不可变更新，不直接 `splice` 原状态数组。
- 首页使用 selector 选择性订阅 Store。
- 不使用 `eval()`、`with()` 或动态执行字符串。
- 不引入新的全局样式，不修改现有响应式布局。
- 不顺手重构与本功能无关的现有代码。
- 不覆盖或提交实施前已存在的用户改动和未跟踪文件。

## 6. 风险与处理策略

| 风险                               | 影响                         | 处理策略                                                     |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------ |
| 缓存结构被手动修改或历史版本不兼容 | 首页恢复时报错或白屏         | 在持久化边界规范化数据，异常回退空数组，并设置版本号         |
| 重复点击不断产生相同站点           | 列表冗余                     | 每次写入前按完整 URL 去重，再将最新快照置顶                  |
| 最近分类被误写入服务端分类         | 管理页出现临时分类或保存污染 | 使用独立 Store 和首页虚拟 Category，禁止调用 `setCategories` |
| 只给顶层分类传回调                 | 子分类点击无法记录           | 首页集成步骤明确覆盖顶层与 `children` 两条渲染路径           |
| 新增回调破坏打开新标签页           | 网站无法正常打开             | 回调保持可选，并与 `window.open` 同步执行，验收所有入口      |
| `localStorage` 读写抛错            | 点击被中断或首页恢复失败     | 安全存储适配器隔离原生异常；点击处理器再次隔离回调异常       |
| 已删除网站仍留在历史中             | 最近列表保留旧快照           | 这是本地浏览历史的预期行为；用户清除站点数据后消失           |
| 同源多个标签页显示不同步           | 用户观察到短暂差异           | 本期明确不做实时同步；刷新标签页后使用最新本地数据           |
| 本地存储同步写入                   | 极端大数据时阻塞主线程       | 来源集合有限且按 URL 去重，不存储额外点击日志或时间线        |

## 7. 完成定义

只有同时满足以下条件，功能才算完成：

- 文件变更符合“文件变更地图”，未涉及后端和站点数据文件。
- 所有分类网站点击都能被记录，重复点击按 URL 去重并置顶。
- 最近分类只在非空时显示，并位于后端分类列表之前。
- 刷新、路由切换和重新打开站点后记录能够恢复。
- 中文和英文标题正确。
- 非法或过期缓存不会导致白屏。
- `localStorage` 读取或写入失败时，首页不白屏、网站仍能打开，内存状态仍可使用。
- `pnpm format:check`、`pnpm lint`、`pnpm build`、`git diff --check` 全部通过。
- 手动验收矩阵全部通过，浏览器控制台没有新增错误。
