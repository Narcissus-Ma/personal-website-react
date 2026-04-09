# 首页背景图片功能实施方案

## 目标

为首页增加“仅在日间模式下生效”的背景图片能力，并让首页的侧边栏、顶部栏、内容区域可以透出背景图；管理页与关于页保持现状，不受影响。

## 最终实现原则

1. **背景图只作用于首页主视图**
   - 仅首页路由启用背景图能力。
   - 管理页、关于页、其他页面不显示背景图。

2. **背景列表走服务端站点配置**
   - 背景图片列表属于站点内容配置，和分类、搜索引擎一样统一由服务端保存。
   - 数据统一放在 `site-store`，避免多份状态源造成同步问题。

3. **当前选中的背景走本地持久化**
   - “当前设备选中了哪张首页背景”属于本地显示偏好，不写回服务端。
   - 该偏好存放在 `theme-store` 的 `localStorage` 中。

4. **背景图通过首页激活态 + CSS 变量驱动**
   - 不直接把背景图挂到全站 `body` 做全局背景。
   - 通过给文档节点写入首页激活态和背景图片变量，让布局组件在首页亮色模式下变透明或半透明，从而透出背景图。

## 为什么不采用独立 `background-store`

原方案中将背景列表放进单独的 `background-store`，同时又在 `site-store` 中保存站点数据，这会形成双数据源，容易出现以下问题：

- 管理页改的是一份状态，保存时读的是另一份状态。
- 页面刷新后两份状态互相覆盖。
- 选中背景、背景列表、服务端持久化之间缺乏统一边界。

因此最终方案中：

- `site-store` 负责背景列表的增删改查与服务端持久化。
- `theme-store` 只负责主题模式和当前首页背景偏好。

## 数据结构设计

### 1. 背景图片类型

```ts
export interface BackgroundImage {
  name: string;
  url: string | null;
}
```

说明：

- `name` 用于下拉框和管理页显示。
- `url` 为 `null` 时表示“默认背景”，即不使用图片，只使用当前主题的默认背景色。

### 2. 站点数据结构

`SiteData` 新增 `backgrounds` 字段：

```ts
export interface SiteData {
  categories: Category[];
  searchEngines: SearchEngine[];
  backgrounds: BackgroundImage[];
}
```

### 3. 默认数据要求

无论本地初始数据还是服务端空数据兜底，都必须至少包含一条默认背景：

```json
{
  "name": "默认背景",
  "url": null
}
```

该项用于：

- 作为用户回退选项。
- 保障即使没有图片资源，首页也能正常显示。
- 在删除自定义背景后提供稳定兜底。

## 状态管理方案

### 1. `site-store` 的职责

新增背景列表相关字段与方法：

- `backgrounds`
- `setBackgrounds`
- `addBackground`
- `updateBackground`
- `deleteBackground`

同时：

- `loadFromServer` 需要读取 `backgrounds`
- `saveToServer` 需要提交 `backgrounds`

### 2. `theme-store` 的职责

新增本地偏好字段：

- `selectedHomeBackground: string | null`
- `selectHomeBackground`

新增行为方法：

- 将当前首页背景同步到 `document.documentElement`
- 在首页亮色模式下启用背景
- 在暗色模式或离开首页时清理背景激活态

### 3. 回退策略

如果本地保存的 `selectedHomeBackground` 已不在 `site-store.backgrounds` 中：

- 自动回退到默认背景（`null`）
- 更新本地存储
- 避免页面残留不可用图片地址

## 页面行为设计

### 1. 首页展示规则

首页仅在以下条件同时满足时显示背景图：

- 当前路由为首页
- 当前主题为日间模式
- 当前选中的背景有有效 `url`

否则：

- 清空首页背景图变量
- 恢复默认主题背景表现

### 2. 首页工具栏交互

在语言选择框旁新增背景图片选择下拉框：

- 仅在日间模式显示
- 数据来源于 `site-store.backgrounds`
- 切换选项时调用 `theme-store.selectHomeBackground`

### 3. 首页视觉表现

首页容器新增两层：

- **背景图层**：承载实际背景图
- **浅色遮罩层**：保证文字与卡片可读性

在首页亮色模式下：

- 侧边栏：改为透明或半透明面板
- 顶部栏：改为透明或半透明面板
- 内容容器：去掉实色底，让背景透出
- 卡片、搜索框、页脚等信息载体继续保留面板感，防止内容淹没在背景图中

在暗色模式下：

- 不显示首页背景图
- 保持现有夜间主题表现
- 不影响星空动效等现有夜间视觉元素

## 样式实现方案

### 1. 全局 CSS 变量

新增类似以下变量：

- `--home-bg-image`
- `--home-bg-overlay`
- `--home-surface`
- `--home-surface-border`

用于控制：

- 首页背景图地址
- 首页亮色模式遮罩
- 首页透背景时的半透明面板样式

### 2. 首页激活态

通过 `document.documentElement.dataset` 写入类似状态：

- `data-theme="light" | "dark"`
- `data-home-background="active" | "inactive"`

布局样式根据 `data-home-background="active"` 决定是否透明化。

### 3. 透明化范围

仅在首页背景激活时调整以下布局区域：

- 侧边栏 `.sider`
- 顶部栏 `.header`
- 内容区域 `.content`

其他页面不读取该激活态，保持原样。

## 管理页设计

### 1. 新增“背景图片管理”标签页

在管理页 Tabs 中增加一个新的标签页，用于背景列表维护。

### 2. 支持的操作

- 添加背景图片
- 编辑背景名称
- 编辑背景链接
- 删除背景图片
- 保存到服务端

### 3. 管理约束

- “默认背景”不可删除
- 背景名称必填
- 背景链接可为空；为空表示默认背景
- 添加/编辑成功后统一调用现有 `saveToServer`

### 4. 兼容移动端

管理页已有移动端和桌面端差异布局，新标签页需要保证：

- 表单在移动端可正常换行
- 列表在移动端仍可操作
- 不破坏现有 Tabs 结构

## 服务端改造

### 1. `/api/data` 返回值兜底

当 Cloudflare KV 中没有 `data` 时，返回：

```json
{
  "categories": [],
  "searchEngines": [],
  "backgrounds": [
    {
      "name": "默认背景",
      "url": null
    }
  ]
}
```

### 2. `/api/save` 无需新增接口

现有保存接口已经是整包写入，只需要保证提交内容里包含 `backgrounds` 字段即可。

## 文件改动范围

### 新增文件

- `src/types/background.ts`

### 需要修改的文件

- `docs/background.md`
- `src/types/data.ts`
- `src/types/index.ts`
- `src/stores/site-store.ts`
- `src/stores/theme-store.ts`
- `src/stores/index.ts`
- `src/hooks/use-theme.ts`
- `src/pages/home-page/index.tsx`
- `src/pages/home-page/home-page.module.less`
- `src/pages/manage-page/index.tsx`
- `src/components/layout/layout.module.less`
- `src/assets/styles/global.less`
- `src/data/data.json`
- `cloudflare/worker.mjs`

## 实施顺序

1. 增加 `BackgroundImage` 类型与 `SiteData.backgrounds`
2. 扩展 `site-store` 的背景列表读写能力
3. 修改 Worker 与初始数据，补齐服务端返回结构
4. 扩展 `theme-store`，加入首页背景本地偏好与激活态同步
5. 修改首页，添加背景选择下拉框和背景图层
6. 修改布局样式，实现首页亮色模式下的透明透背景效果
7. 修改管理页，增加背景图片管理标签页
8. 完成 lint/build 验证并手动回归

## 验收标准

### 功能验收

- 首页在日间模式下显示背景图片选择下拉框
- 选择背景后，首页侧边栏、顶部栏、内容区可透出背景
- 切换到夜间模式后，背景图消失
- 进入管理页和关于页后，背景图不生效
- 刷新页面后，当前设备仍记住所选背景
- 删除当前已选背景后，自动回退到默认背景

### 数据验收

- 背景列表可通过管理页新增、编辑、删除
- 背景列表保存后刷新仍存在
- 服务端数据中包含 `backgrounds`

### 工程验收

- `npm run lint` 通过
- `npm run build` 通过
- 不引入新的全局双数据源
- 不破坏现有亮暗主题切换

## 风险与注意事项

1. **图片可读性**
   - 背景图不能直接裸露在内容后方，必须保留遮罩和面板层次。

2. **图片资源稳定性**
   - 建议使用稳定图床或 CDN；若背景图失效，应能自动回退默认背景。

3. **性能控制**
   - 背景图建议使用压缩后的图片资源，避免首页首次渲染过慢。

4. **状态边界**
   - 背景列表和背景选择必须分开存储，前者服务端持久化，后者本地持久化。

5. **样式作用域**
   - 所有透明透背景能力都必须受首页激活态控制，不能污染其他页面。
