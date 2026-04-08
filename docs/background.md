# 背景图片管理功能实施文档

## 功能需求分析

### 1. 核心功能

- **日间主题背景定制**：允许用户为日间主题选择自定义背景图片
- **背景图片管理**：在管理页面添加背景图片的增删改查功能
- **背景选择下拉框**：在语言选择栏旁边添加背景图片选择下拉框，仅在日间主题时显示
- **数据持久化**：保存用户的背景选择偏好

### 2. 数据结构

- **背景图片数据**：包含两个字段
  - `name`：图片名称（用于显示）
  - `url`：图片链接（用于加载背景）

## 技术实现方案

### 1. 状态管理

- 扩展 `theme-store.ts`，添加背景图片相关状态
- 新增 `background-store.ts` 用于管理背景图片数据

### 2. 组件修改

- 修改 `home-page/index.tsx`，添加背景选择下拉框
- 修改 `manage-page/index.tsx`，添加背景图片管理标签页

### 3. 样式实现

- 使用 CSS 变量和条件样式实现背景图片切换
- 确保下拉框样式与语言选择下拉框一致

### 4. 数据持久化

- 使用 localStorage 存储用户的背景选择
- 管理页面的数据通过现有 API 保存到服务器

## 代码修改步骤

### 服务端实现

#### 步骤 1：修改 Cloudflare Worker 代码

```javascript
// cloudflare/worker.mjs
// 修改 /api/data 端点，确保返回的数据包含 backgrounds 字段

if (pathname === '/api/data' && request.method === 'GET') {
  try {
    const data = await env.SITE_DATA.get('data');
    if (!data) {
      return new Response(
        JSON.stringify({
          categories: [],
          searchEngines: [],
          backgrounds: [
            {
              name: '默认背景',
              url: null,
            },
          ],
        }),
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
```

#### 步骤 2：更新初始数据文件

确保 `src/data/data.json` 文件包含 `backgrounds` 字段：

```json
{
  "categories": [...],
  "searchEngines": [...],
  "backgrounds": [
    {
      "name": "默认背景",
      "url": null
    },
    {
      "name": "简约白色",
      "url": "https://example.com/background1.jpg"
    },
    {
      "name": "渐变蓝色",
      "url": "https://example.com/background2.jpg"
    }
  ]
}
```

#### 步骤 3：重新上传数据

运行初始化脚本，将包含背景图片数据的文件上传到 Cloudflare KV：

```bash
cd /Users/mapengfei/personal-website-react/cloudflare
node init-kv-data.mjs
```

### 客户端实现

#### 步骤 1：创建背景图片类型定义

```typescript
// src/types/background.ts
export interface BackgroundImage {
  name: string;
  url: string;
}
```

#### 步骤 2：创建背景图片存储

```typescript
// src/stores/background-store.ts
import { create } from 'zustand';
import { BackgroundImage } from '../types/background';

interface BackgroundState {
  backgrounds: BackgroundImage[];
  selectedBackground: string | null;
  setBackgrounds: (backgrounds: BackgroundImage[]) => void;
  addBackground: (background: BackgroundImage) => void;
  updateBackground: (index: number, background: BackgroundImage) => void;
  deleteBackground: (index: number) => void;
  selectBackground: (url: string | null) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'background_settings';

export const useBackgroundStore = create<BackgroundState>((set, get) => ({
  backgrounds: [
    {
      name: '默认背景',
      url: null,
    },
    {
      name: '简约白色',
      url: 'https://example.com/background1.jpg',
    },
    {
      name: '渐变蓝色',
      url: 'https://example.com/background2.jpg',
    },
  ],
  selectedBackground: null,

  setBackgrounds: backgrounds => set({ backgrounds }),

  addBackground: background =>
    set(state => ({ backgrounds: [...state.backgrounds, background] })),

  updateBackground: (index, background) =>
    set(state => {
      const newBackgrounds = [...state.backgrounds];
      newBackgrounds[index] = background;
      return { backgrounds: newBackgrounds };
    }),

  deleteBackground: index =>
    set(state => {
      const newBackgrounds = [...state.backgrounds];
      newBackgrounds.splice(index, 1);
      return { backgrounds: newBackgrounds };
    }),

  selectBackground: url => {
    set({ selectedBackground: url });
    get().saveToStorage();
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({ selectedBackground: data.selectedBackground });
      }
    } catch {
      // ignore
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const { selectedBackground } = get();
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedBackground })
      );
    } catch {
      // ignore
    }
  },
}));
```

#### 步骤 3：修改主题存储，集成背景管理

```typescript
// src/stores/theme-store.ts
import { create } from 'zustand';
import { useBackgroundStore } from './background-store';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  applyThemeWithBackground: () => void;
}

const STORAGE_KEY = 'theme_mode';

const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

const applyBackgroundToDocument = (url: string | null) => {
  if (typeof document === 'undefined') return;
  if (url) {
    document.body.style.backgroundImage = `url(${url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
  } else {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';
  }
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  return 'dark';
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  applyThemeToDocument(initialTheme);

  // 加载背景设置
  const backgroundStore = useBackgroundStore.getState();
  backgroundStore.loadFromStorage();

  if (initialTheme === 'light') {
    applyBackgroundToDocument(backgroundStore.selectedBackground);
  }

  return {
    theme: initialTheme,

    setTheme: (theme: ThemeMode) => {
      set({ theme });
      applyThemeToDocument(theme);

      // 应用背景
      if (theme === 'light') {
        applyBackgroundToDocument(backgroundStore.selectedBackground);
      } else {
        applyBackgroundToDocument(null);
      }

      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // ignore
      }
    },

    toggleTheme: () => {
      const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },

    applyThemeWithBackground: () => {
      const { theme } = get();
      applyThemeToDocument(theme);

      if (theme === 'light') {
        applyBackgroundToDocument(backgroundStore.selectedBackground);
      } else {
        applyBackgroundToDocument(null);
      }
    },
  };
});
```

#### 步骤 4：修改主页面，添加背景选择下拉框

```typescript
// src/pages/home-page/index.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Select, Button, Space, Tooltip } from 'antd';
import {
  GithubOutlined,
  SettingOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import AppLayout from '@/components/layout';
import { WebItem, SearchBox, Footer, AuthModal } from '../../components';
import { useLanguage, useTheme } from '../../hooks';
import styles from './home-page.module.less';
import { useSiteStore, useAuthStore, useBackgroundStore } from '@/stores';

const HomePage: React.FC = () => {
  const { categories } = useSiteStore();
  const { language, setLanguage, transName, languageOptions } = useLanguage();
  const { theme, toggleTheme, applyThemeWithBackground } = useTheme();
  const { backgrounds, selectedBackground, selectBackground } = useBackgroundStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [authModalVisible, setAuthModalVisible] = useState(false);

  useEffect(() => {
    // 页面加载时应用主题和背景
    applyThemeWithBackground();
  }, [theme, selectedBackground]);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname && pathname.startsWith('/category-')) {
      setTimeout(() => {
        const element = document.getElementById(pathname.slice(1));
        if (element) {
          // 计算 header 高度，避免滚动时被 header 遮挡
          const header = document.querySelector(
            '.ant-layout-header'
          ) as HTMLElement | null;
          const headerHeight = header ? header.offsetHeight : 64; // 64 是默认高度

          const elementTop = element.getBoundingClientRect().top;
          const scrollY = window.pageYOffset + elementTop - headerHeight - 20; // 20 是额外的间距

          window.scrollTo({
            top: scrollY,
            behavior: 'smooth',
          });
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

            {/* 背景选择下拉框，仅在日间主题时显示 */}
            {theme === 'light' && (
              <Select
                className={styles.languageSelect}
                size="large"
                value={selectedBackground || ''}
                onChange={value => selectBackground(value || null)}
                placeholder="选择背景"
              >
                {backgrounds.map((bg, index) => (
                  <Select.Option key={index} value={bg.url || ''}>
                    {bg.name}
                  </Select.Option>
                ))}
              </Select>
            )}

            <Tooltip
              title={theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
            >
              <Button
                aria-label="切换主题"
                icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                size="large"
                type="text"
                onClick={toggleTheme}
              />
            </Tooltip>
          </div>
          <div className={styles.right}>
            <Space>
              <Tooltip title="管理入口">
                <Button
                  icon={<SettingOutlined />}
                  size="large"
                  type="text"
                  onClick={handleManageClick}
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

#### 步骤 5：修改管理页面，添加背景图片管理标签页

```typescript
// src/pages/manage-page/index.tsx
// 在现有代码的 Tabs 组件中添加新的标签页

// 导入必要的类型和存储
import { BackgroundImage } from '../../types/background';
import { useBackgroundStore } from '../../stores';

// 在组件中添加背景图片相关状态和方法
const { backgrounds, addBackground, updateBackground, deleteBackground } = useBackgroundStore();
const [backgroundForm] = Form.useForm();
const [editingBackground, setEditingBackground] = useState<number | null>(null);
const [editingBackgroundData, setEditingBackgroundData] = useState<BackgroundImage | null>(null);

// 处理添加背景图片
const handleAddBackground = async (values: BackgroundImage) => {
  try {
    addBackground(values);
    await saveToServer();
    message.success('添加成功');
    backgroundForm.resetFields();
  } catch {
    message.error('保存失败');
  }
};

// 处理编辑背景图片
const handleEditBackground = (index: number) => {
  setEditingBackground(index);
  setEditingBackgroundData({ ...backgrounds[index] });
};

const handleSaveBackground = async () => {
  if (editingBackground !== null && editingBackgroundData) {
    updateBackground(editingBackground, editingBackgroundData);
    await saveToServer();
    message.success('保存成功');
    setEditingBackground(null);
    setEditingBackgroundData(null);
  }
};

const handleCancelEditBackground = () => {
  setEditingBackground(null);
  setEditingBackgroundData(null);
};

const handleUpdateBackgroundField = (field: keyof BackgroundImage, value: any) => {
  if (editingBackgroundData) {
    setEditingBackgroundData({
      ...editingBackgroundData,
      [field]: value,
    });
  }
};

const handleDeleteBackground = async (index: number) => {
  deleteBackground(index);
  await saveToServer();
  message.success('删除成功');
};

// 背景图片表格列定义
const backgroundColumns = [
  {
    title: '图片名称',
    dataIndex: 'name',
    key: 'name',
    render: (_: string, record: BackgroundImage, index: number) => {
      if (editingBackground === index && editingBackgroundData) {
        return (
          <Input
            size="small"
            value={editingBackgroundData.name}
            onChange={e => handleUpdateBackgroundField('name', e.target.value)}
          />
        );
      }
      return record.name;
    },
  },
  {
    title: '图片链接',
    dataIndex: 'url',
    key: 'url',
    render: (_: string, record: BackgroundImage, index: number) => {
      if (editingBackground === index && editingBackgroundData) {
        return (
          <Input
            size="small"
            value={editingBackgroundData.url || ''}
            onChange={e => handleUpdateBackgroundField('url', e.target.value)}
          />
        );
      }
      return record.url || '默认背景';
    },
  },
  {
    title: '预览',
    key: 'preview',
    render: (_: string, record: BackgroundImage) => {
      if (record.url) {
        return (
          <Image
            className={styles.favicon32}
            fallback="https://via.placeholder.com/32"
            height={32}
            src={record.url}
            width={32}
          />
        );
      }
      return <span>无</span>;
    },
  },
  {
    title: '操作',
    key: 'action',
    render: (_: string, record: BackgroundImage, index: number) => (
      <Space>
        {editingBackground === index ? (
          <>
            <Button
              icon={<EditOutlined />}
              type="link"
              onClick={handleSaveBackground}
            >
              保存
            </Button>
            <Button type="link" onClick={handleCancelEditBackground}>
              取消
            </Button>
          </>
        ) : (
          <>
            <Button
              icon={<EditOutlined />}
              type="link"
              onClick={() => handleEditBackground(index)}
            >
              编辑
            </Button>
            <Popconfirm
              cancelText="取消"
              okText="确定"
              title="确定删除?"
              onConfirm={() => handleDeleteBackground(index)}
            >
              <Button danger icon={<DeleteOutlined />} type="link">
                删除
              </Button>
            </Popconfirm>
          </>
        )}
      </Space>
    ),
  },
];

// 在 Tabs 组件中添加新的标签页
{
  label: '背景图片管理',
  key: '5',
  children: (
    <Card className={styles.card} title="背景图片管理">
      <Form
        form={backgroundForm}
        layout="vertical"
        onFinish={handleAddBackground}
      >
        <Row gutter={16}>
          <Col sm={12} xs={24}>
            <Form.Item
              label="图片名称"
              name="name"
              rules={[{ required: true, message: '请输入图片名称' }]}
            >
              <Input placeholder="请输入图片名称" />
            </Form.Item>
          </Col>
          <Col sm={12} xs={24}>
            <Form.Item label="图片链接" name="url">
              <Input placeholder="https://example.com/background.jpg" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button
            htmlType="submit"
            icon={<PlusOutlined />}
            type="primary"
          >
            添加背景图片
          </Button>
        </Form.Item>
      </Form>

      <Divider />

      <Table
        columns={backgroundColumns}
        dataSource={backgrounds}
        pagination={false}
        rowKey={(_, index) => `background-${index}`}
        size="small"
      />
    </Card>
  ),
}
```

#### 步骤 6：更新 site-store.ts，添加背景图片数据的保存和加载

```typescript
// src/stores/site-store.ts
import { create } from 'zustand';
import { SiteData, Category, SearchEngine } from '../types';
import { BackgroundImage } from '../types/background';

interface SiteStore extends SiteData {
  backgrounds: BackgroundImage[];
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  // 其他现有方法...
  setBackgrounds: (backgrounds: BackgroundImage[]) => void;
  addBackground: (background: BackgroundImage) => void;
}

const API_BASE = 'http://localhost:3000/api';

export const useSiteStore = create<SiteStore>((set, get) => ({
  categories: [],
  searchEngines: [],
  backgrounds: [
    {
      name: '默认背景',
      url: null,
    },
  ],

  // 其他现有方法...

  setBackgrounds: backgrounds => set({ backgrounds }),

  addBackground: background =>
    set(state => ({ backgrounds: [...state.backgrounds, background] })),

  saveToServer: async () => {
    const { categories, searchEngines, backgrounds } = get();
    const response = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories, searchEngines, backgrounds }),
    });
    if (!response.ok) {
      throw new Error('Failed to save data');
    }
  },

  loadFromServer: async () => {
    try {
      const response = await fetch(`${API_BASE}/data`);
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
      const data = await response.json();
      set({
        categories: data.categories || [],
        searchEngines: data.searchEngines || [],
        backgrounds: data.backgrounds || [
          {
            name: '默认背景',
            url: null,
          },
        ],
      });

      // 同步到 background-store
      const { setBackgrounds } = useBackgroundStore.getState();
      setBackgrounds(
        data.backgrounds || [
          {
            name: '默认背景',
            url: null,
          },
        ]
      );
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  },
}));
```

#### 步骤 7：更新类型定义

```typescript
// src/types/data.ts
import { Category } from './category';
import { SearchEngine } from './search-engine';
import { BackgroundImage } from './background';

export interface SiteData {
  categories: Category[];
  searchEngines: SearchEngine[];
  backgrounds: BackgroundImage[];
}
```

## 测试方案

### 1. 功能测试

- **背景选择功能**：
  - 切换到日间主题，确认背景选择下拉框显示
  - 选择不同背景图片，确认背景变化
  - 切换到夜间主题，确认背景恢复为默认状态
  - 刷新页面，确认背景选择保持

- **背景管理功能**：
  - 登录管理页面，进入背景图片管理标签页
  - 添加新的背景图片，确认显示在列表中
  - 编辑现有背景图片，确认修改生效
  - 删除背景图片，确认从列表中移除
  - 保存更改，刷新页面，确认数据持久化

### 2. 兼容性测试

- 测试不同浏览器下的显示效果
- 测试响应式布局，确保在移动设备上正常显示
- 测试背景图片加载失败的处理

### 3. 性能测试

- 测试背景图片切换的流畅度
- 测试管理页面加载大量背景图片时的性能

## 注意事项

1. **图片资源**：确保背景图片链接有效，建议使用 CDN 或可靠的图片托管服务
2. **性能优化**：对于较大的背景图片，考虑使用适当的压缩和缓存策略
3. **用户体验**：提供默认背景选项，确保即使没有网络连接也能正常显示
4. **安全考虑**：验证用户输入的图片链接，防止恶意URL

## 总结

通过以上步骤，我们实现了以下功能：

1. **日间主题背景定制**：用户可以为日间主题选择自定义背景图片
2. **背景图片管理**：在管理页面添加、编辑、删除背景图片
3. **智能显示**：背景选择下拉框仅在日间主题时显示
4. **数据持久化**：用户的背景选择会被保存，刷新页面后保持不变
5. **样式一致性**：背景选择下拉框的样式与语言选择下拉框保持一致

这些功能将为用户提供更加个性化的体验，使网站在保持简洁的同时，增加了一定的定制性。
