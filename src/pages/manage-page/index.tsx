import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  Button,
  Table,
  Space,
  Popconfirm,
  message,
  Divider,
  Tabs,
  Image,
  Modal,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  StarOutlined,
  DesktopOutlined,
  PlayCircleOutlined,
  BookOutlined,
  BulbOutlined,
  HeartOutlined,
  AppstoreOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { API_BASE } from '@/config/api-base';
import { useIsMobile } from '@/hooks';
import { useSiteStore, useAuthStore } from '../../stores';
import { Website, Category, SearchEngine } from '../../types';
import styles from './manage-page.module.less';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const iconMap: Record<string, React.ReactNode> = {
  'linecons-star': <StarOutlined />,
  'linecons-cog': <DesktopOutlined />,
  'linecons-video': <PlayCircleOutlined />,
  'linecons-doc': <BookOutlined />,
  'linecons-lightbulb': <BulbOutlined />,
  'linecons-heart': <HeartOutlined />,
};

type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

const ManagePage: React.FC = () => {
  const {
    categories,
    searchEngines,
    addWebsite,
    addCategory,
    deleteCategory,
    updateCategory,
    updateWebsite,
    deleteWebsite,
    moveWebsite,
    reorderWebsites,
    addSearchEngine,
    deleteSearchEngine,
    saveToServer,
    loadFromServer,
  } = useSiteStore();
  const { isAuthenticated, verifyPassword } = useAuthStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [websiteForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [searchEngineForm] = Form.useForm();

  const FAVICON_DEBOUNCE_MS = 500;

  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingCategoryData, setEditingCategoryData] =
    useState<Category | null>(null);
  const [editingWebsite, setEditingWebsite] = useState<{
    categoryIndex: number;
    siteIndex: number;
  } | null>(null);
  const [editingWebsiteData, setEditingWebsiteData] = useState<Website | null>(
    null
  );
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const hasLoaded = useRef(false);
  const [mobileWebsiteEditorOpen, setMobileWebsiteEditorOpen] = useState(false);

  const editingWebsiteRef = useRef(editingWebsite);
  const addWebsiteFaviconTimerRef = useRef<TimeoutHandle | null>(null);
  const addWebsiteLastUrlRef = useRef<string>('');
  const editWebsiteFaviconTimerRef = useRef<TimeoutHandle | null>(null);
  const editWebsiteLastRequestRef = useRef<{ key: string; url: string } | null>(
    null
  );

  const openMobileWebsiteEditor = (
    categoryIndex: number,
    siteIndex: number,
    record: Website
  ) => {
    setEditingWebsite({ categoryIndex, siteIndex });
    setEditingWebsiteData({ ...record });
    setMobileWebsiteEditorOpen(true);
  };

  const closeMobileWebsiteEditor = () => {
    setMobileWebsiteEditorOpen(false);
    setEditingWebsite(null);
    setEditingWebsiteData(null);
  };

  const handleSaveEditingWebsite = async () => {
    if (!editingWebsite || !editingWebsiteData) return;

    updateWebsite(
      editingWebsite.categoryIndex,
      editingWebsite.siteIndex,
      editingWebsiteData
    );
    await saveToServer();
    message.success('保存成功');
    closeMobileWebsiteEditor();
  };

  useEffect(() => {
    editingWebsiteRef.current = editingWebsite;
  }, [editingWebsite]);

  useEffect(() => {
    return () => {
      if (addWebsiteFaviconTimerRef.current) {
        globalThis.clearTimeout(addWebsiteFaviconTimerRef.current);
      }
      if (editWebsiteFaviconTimerRef.current) {
        globalThis.clearTimeout(editWebsiteFaviconTimerRef.current);
      }
    };
  }, []);

  const handleVerifyPassword = async () => {
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
    } else {
      message.error('密码错误');
    }
  };

  const handleAuthCancel = () => {
    setPassword('');
    navigate('/');
  };

  // 组件挂载时加载数据
  useEffect(() => {
    if (hasLoaded.current) {
      return;
    }
    if (categories.length === 0) {
      loadFromServer();
    }
    hasLoaded.current = true;
  }, [loadFromServer, categories.length]);

  // 默认Logo选项
  const defaultLogos = [
    'https://img1.tucang.cc/api/image/show/e1306a391e2a2a324370bfee481f497b',
    'https://img1.tucang.cc/api/image/show/d49b2f40283fd12731be9e18b707d48a',
    'https://img1.tucang.cc/api/image/show/77451257254f3851ce36fc23f98c8c70',
    'https://img1.tucang.cc/api/image/show/9dbb66429a737edf0652a1e9000b15b8',
  ];

  // 从URL生成favicon链接（异步检测）
  const getFaviconUrl = async (inputUrl: string): Promise<string> => {
    const normalizeUrl = (raw: string): string | null => {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      try {
        return new URL(trimmed).toString();
      } catch {
        try {
          return new URL(`https://${trimmed}`).toString();
        } catch {
          return null;
        }
      }
    };

    const canLoadImage = (src: string): Promise<boolean> =>
      new Promise(resolve => {
        const img = new globalThis.Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });

    const normalized = normalizeUrl(inputUrl);
    if (!normalized) return '';

    const parsed = new URL(normalized);
    const direct = new URL('/favicon.ico', parsed.origin).toString();
    if (await canLoadImage(direct)) return direct;

    // 后端爬取/代理：避免前端直接依赖第三方服务
    const backend = `${API_BASE}/favicon?url=${encodeURIComponent(normalized)}`;
    if (await canLoadImage(backend)) return backend;

    // 保留原有的 Google 兜底（在后端不可用时仍有机会拿到图标）
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  };

  const scheduleAddWebsiteFaviconUpdate = (rawUrl: string) => {
    const nextUrl = rawUrl.trim();
    addWebsiteLastUrlRef.current = nextUrl;

    if (addWebsiteFaviconTimerRef.current) {
      globalThis.clearTimeout(addWebsiteFaviconTimerRef.current);
    }

    if (!nextUrl) {
      return;
    }

    addWebsiteFaviconTimerRef.current = globalThis.setTimeout(async () => {
      const urlSnapshot = addWebsiteLastUrlRef.current;
      if (!urlSnapshot) return;

      const faviconUrl = await getFaviconUrl(urlSnapshot);
      if (addWebsiteLastUrlRef.current !== urlSnapshot) return;
      if (!faviconUrl) return;

      websiteForm.setFieldsValue({ logo: faviconUrl });
    }, FAVICON_DEBOUNCE_MS);
  };

  const scheduleEditWebsiteFaviconUpdate = (key: string, rawUrl: string) => {
    const nextUrl = rawUrl.trim();
    editWebsiteLastRequestRef.current = { key, url: nextUrl };

    if (editWebsiteFaviconTimerRef.current) {
      globalThis.clearTimeout(editWebsiteFaviconTimerRef.current);
    }

    if (!nextUrl) {
      return;
    }

    editWebsiteFaviconTimerRef.current = globalThis.setTimeout(async () => {
      const requestSnapshot = editWebsiteLastRequestRef.current;
      const currentEditing = editingWebsiteRef.current;
      if (!requestSnapshot || !currentEditing) return;
      if (
        `${currentEditing.categoryIndex}-${currentEditing.siteIndex}` !== key
      ) {
        return;
      }
      if (requestSnapshot.key !== key || requestSnapshot.url !== nextUrl) {
        return;
      }

      const faviconUrl = await getFaviconUrl(requestSnapshot.url);
      const latestRequest = editWebsiteLastRequestRef.current;
      if (!latestRequest) return;
      if (
        latestRequest.key !== key ||
        latestRequest.url !== requestSnapshot.url
      ) {
        return;
      }
      if (!faviconUrl) return;

      setEditingWebsiteData(prev =>
        prev
          ? {
              ...prev,
              logo: faviconUrl,
            }
          : null
      );
    }, FAVICON_DEBOUNCE_MS);
  };

  const handleAddWebsite = async (values: any) => {
    try {
      const { categoryIndex, ...websiteData } = values;
      addWebsite(categoryIndex, {
        ...websiteData,
        logo:
          websiteData.logo ||
          'https://img1.tucang.cc/api/image/show/e1306a391e2a2a324370bfee481f497b',
      });
      await saveToServer();
      message.success('添加成功');
      websiteForm.resetFields();
    } catch {
      message.error('保存失败');
    }
  };

  const handleAddCategory = async (values: {
    name: string;
    en_name: string;
    icon: string;
  }) => {
    try {
      addCategory({
        ...values,
        web: [],
      });
      await saveToServer();
      message.success('分类添加成功');
      categoryForm.resetFields();
    } catch {
      message.error('保存失败');
    }
  };

  const handleDeleteCategory = async (index: number) => {
    if (categories.length <= 1) {
      message.warning('至少保留一个分类');
      return;
    }
    deleteCategory(index);
    await saveToServer();
    message.success('删除成功');
  };

  const handleEditCategory = (index: number) => {
    setEditingCategory(index);
    setEditingCategoryData({ ...categories[index] });
  };

  const handleSaveCategory = async () => {
    if (editingCategory !== null && editingCategoryData) {
      updateCategory(editingCategory, editingCategoryData);
      await saveToServer();
      message.success('保存成功');
      setEditingCategory(null);
      setEditingCategoryData(null);
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryData(null);
  };

  const handleUpdateCategoryField = (field: keyof Category, value: any) => {
    if (editingCategoryData) {
      setEditingCategoryData({
        ...editingCategoryData,
        [field]: value,
      });
    }
  };

  const handleAddSearchEngine = async (values: SearchEngine) => {
    try {
      addSearchEngine({
        ...values,
        icon: values.icon || defaultLogos[0],
      });
      await saveToServer();
      message.success('添加成功');
      searchEngineForm.resetFields();
    } catch {
      message.error('保存失败');
    }
  };

  const handleDeleteSearchEngine = async (index: number) => {
    deleteSearchEngine(index);
    await saveToServer();
    message.success('删除成功');
  };

  const categoryColumns = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon: string) => (
        <span className={styles.icon}>
          {iconMap[icon] || <AppstoreOutlined />}
        </span>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Category, index: number) => {
        if (editingCategory === index && editingCategoryData) {
          return (
            <Input
              size="small"
              value={editingCategoryData.name}
              onChange={e => handleUpdateCategoryField('name', e.target.value)}
            />
          );
        }
        return record.name;
      },
    },
    {
      title: '英文名称',
      dataIndex: 'en_name',
      key: 'en_name',
      render: (_: string, record: Category, index: number) => {
        if (editingCategory === index && editingCategoryData) {
          return (
            <Input
              size="small"
              value={editingCategoryData.en_name}
              onChange={e =>
                handleUpdateCategoryField('en_name', e.target.value)
              }
            />
          );
        }
        return record.en_name;
      },
    },
    {
      title: '网站数量',
      dataIndex: 'web',
      key: 'count',
      render: (web: Website[]) => web?.length || 0,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: string, record: Category, index: number) => (
        <Space>
          {editingCategory === index ? (
            <>
              <Button
                icon={<EditOutlined />}
                type="link"
                onClick={handleSaveCategory}
              >
                保存
              </Button>
              <Button type="link" onClick={handleCancelEditCategory}>
                取消
              </Button>
            </>
          ) : (
            <>
              <Button
                icon={<EditOutlined />}
                type="link"
                onClick={() => handleEditCategory(index)}
              >
                编辑
              </Button>
              <Popconfirm
                cancelText="取消"
                okText="确定"
                title="确定删除?"
                onConfirm={() => handleDeleteCategory(index)}
              >
                <Button
                  danger
                  disabled={categories.length <= 1}
                  icon={<DeleteOutlined />}
                  type="link"
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const searchEngineColumns = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon: string) => (
        <Image
          className={styles.favicon20}
          fallback="https://via.placeholder.com/20"
          height={20}
          src={icon}
          width={20}
        />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: SearchEngine) => name,
    },
    {
      title: '搜索URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string, record: SearchEngine) => url,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: string, record: SearchEngine, index: number) => (
        <Space>
          <Popconfirm
            cancelText="取消"
            okText="确定"
            title="确定删除?"
            onConfirm={() => handleDeleteSearchEngine(index)}
          >
            <Button danger icon={<DeleteOutlined />} type="link">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 网站列表相关列定义
  const websiteListColumns = (categoryIndex: number) => [
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      render: (logo: string, record: Website, siteIndex: number) => {
        if (
          editingWebsite?.categoryIndex === categoryIndex &&
          editingWebsite?.siteIndex === siteIndex &&
          editingWebsiteData
        ) {
          return (
            <>
              <Input
                placeholder="Logo URL"
                size="small"
                value={editingWebsiteData.logo}
                onChange={e =>
                  setEditingWebsiteData({
                    ...editingWebsiteData,
                    logo: e.target.value,
                  })
                }
              />
              <Image
                className={styles.favicon32}
                fallback="https://via.placeholder.com/32"
                height={32}
                src={editingWebsiteData.logo}
                style={{ marginTop: 5 }}
                width={32}
              />
              <div className={styles.defaultLogos}>
                <small>选择默认图标：</small>
                <div className={styles.logoSelector}>
                  {defaultLogos.map((logoUrl, idx) => (
                    <Image
                      key={idx}
                      className={`${styles.favicon32} ${styles.defaultLogoItem} ${editingWebsiteData.logo === logoUrl ? styles.defaultLogoItemSelected : ''} `}
                      height={32}
                      preview={false}
                      src={logoUrl}
                      style={{
                        margin: '5px',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                      }}
                      width={32}
                      onClick={() =>
                        setEditingWebsiteData({
                          ...editingWebsiteData,
                          logo: logoUrl,
                        })
                      }
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#3498db';
                      }}
                      onMouseLeave={e => {
                        if (editingWebsiteData.logo !== logoUrl) {
                          e.currentTarget.style.borderColor = 'transparent';
                        } else {
                          e.currentTarget.style.borderColor = '#3498db';
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          );
        }
        return (
          <Image
            className={styles.favicon32}
            fallback="https://via.placeholder.com/32"
            height={32}
            src={logo}
            width={32}
          />
        );
      },
    },
    {
      title: '网站名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Website, siteIndex: number) => {
        if (
          editingWebsite?.categoryIndex === categoryIndex &&
          editingWebsite?.siteIndex === siteIndex &&
          editingWebsiteData
        ) {
          return (
            <Input
              size="small"
              value={editingWebsiteData.title}
              onChange={e =>
                setEditingWebsiteData({
                  ...editingWebsiteData,
                  title: e.target.value,
                })
              }
            />
          );
        }
        return title;
      },
    },
    {
      title: '链接',
      dataIndex: 'url',
      key: 'url',
      render: (url: string, record: Website, siteIndex: number) => {
        if (
          editingWebsite?.categoryIndex === categoryIndex &&
          editingWebsite?.siteIndex === siteIndex &&
          editingWebsiteData
        ) {
          return (
            <Input
              size="small"
              value={editingWebsiteData.url}
              onChange={async e => {
                const url = e.target.value;
                setEditingWebsiteData({
                  ...editingWebsiteData,
                  url: url,
                });
                // 自动更新 favicon（防抖）
                scheduleEditWebsiteFaviconUpdate(
                  `${categoryIndex}-${siteIndex}`,
                  url
                );
              }}
            />
          );
        }
        return url;
      },
    },
    {
      title: '描述',
      dataIndex: 'desc',
      key: 'desc',
      render: (desc: string, record: Website, siteIndex: number) => {
        if (
          editingWebsite?.categoryIndex === categoryIndex &&
          editingWebsite?.siteIndex === siteIndex &&
          editingWebsiteData
        ) {
          return (
            <Input
              size="small"
              value={editingWebsiteData.desc}
              onChange={e =>
                setEditingWebsiteData({
                  ...editingWebsiteData,
                  desc: e.target.value,
                })
              }
            />
          );
        }
        return desc;
      },
    },
    {
      title: '移动到分类',
      key: 'move',
      render: (_: string, record: Website, siteIndex: number) => (
        <Select
          disabled={categories.length <= 1} // 当只有一个分类时禁用
          placeholder="选择分类"
          size="small"
          style={{ width: 120 }}
          value={categoryIndex}
          onChange={async value => {
            if (value !== categoryIndex) {
              // 防止移动到相同的分类
              moveWebsite(categoryIndex, value, siteIndex);
              await saveToServer();
              message.success('移动成功');
            }
          }}
        >
          {categories.map((cat, idx) => (
            <Option
              key={idx}
              disabled={idx === categoryIndex} // 禁用当前分类选项
              value={idx}
            >
              {cat.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: string, record: Website, siteIndex: number) => (
        <Space>
          {editingWebsite?.categoryIndex === categoryIndex &&
          editingWebsite?.siteIndex === siteIndex ? (
            <>
              <Button
                icon={<EditOutlined />}
                type="link"
                onClick={handleSaveEditingWebsite}
              >
                保存
              </Button>
              <Button type="link" onClick={closeMobileWebsiteEditor}>
                取消
              </Button>
            </>
          ) : (
            <>
              <Button
                icon={<EditOutlined />}
                type="link"
                onClick={() => {
                  setEditingWebsite({ categoryIndex, siteIndex });
                  setEditingWebsiteData({ ...record });
                }}
              >
                编辑
              </Button>
              <Popconfirm
                cancelText="取消"
                okText="确定"
                title="确定删除?"
                onConfirm={async () => {
                  deleteWebsite(categoryIndex, siteIndex);
                  await saveToServer();
                  message.success('删除成功');
                }}
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

  return (
    <>
      {!isAuthenticated && (
        <Modal
          cancelText="取消"
          closable={false}
          confirmLoading={loading}
          maskClosable={false}
          okText="确认"
          open={true}
          title="管理页面鉴权"
          onCancel={handleAuthCancel}
          onOk={handleVerifyPassword}
        >
          <div className={styles.authContainer}>
            <Input.Password
              placeholder="请输入管理密码"
              prefix={<LockOutlined />}
              size="large"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onPressEnter={handleVerifyPassword}
            />
          </div>
        </Modal>
      )}
      <div className={styles.manage}>
        <div className={styles.header}>
          <Link className={styles.backBtn} to="/">
            <ArrowLeftOutlined /> 返回首页
          </Link>
          <h1>网站管理</h1>
        </div>

        <Tabs
          defaultActiveKey="1"
          items={[
            {
              label: '添加网站',
              key: '1',
              children: (
                <Card className={styles.card} title="添加网站">
                  <Form
                    form={websiteForm}
                    initialValues={{ categoryIndex: 0 }}
                    layout="vertical"
                    onFinish={handleAddWebsite}
                  >
                    <Row gutter={16}>
                      <Col sm={12} xs={24}>
                        <Form.Item
                          label="分类"
                          name="categoryIndex"
                          rules={[{ required: true }]}
                        >
                          <Select>
                            {categories.map((cat, idx) => (
                              <Option key={idx} value={idx}>
                                {cat.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col sm={12} xs={24}>
                        <Form.Item
                          label="网站名称"
                          name="title"
                          rules={[
                            { required: true, message: '请输入网站名称' },
                          ]}
                        >
                          <Input placeholder="请输入网站名称" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col sm={12} xs={24}>
                        <Form.Item
                          label="网站链接"
                          name="url"
                          rules={[
                            { required: true, message: '请输入网站链接' },
                          ]}
                        >
                          <Input
                            placeholder="https://example.com"
                            onChange={e => {
                              const url = e.target.value;
                              scheduleAddWebsiteFaviconUpdate(url);
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col sm={12} xs={24}>
                        <Form.Item label="Logo链接" name="logo">
                          <Input placeholder="https://example.com/favicon.ico" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label="描述" name="desc">
                      <TextArea placeholder="网站描述" rows={2} />
                    </Form.Item>
                    <Form.Item>
                      <Button
                        htmlType="submit"
                        icon={<PlusOutlined />}
                        type="primary"
                      >
                        添加网站
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              ),
            },
            {
              label: '网站列表',
              key: '4',
              children: (
                <Card className={styles.card} title="网站列表">
                  {isMobile ? (
                    <div className={styles.websiteListMobile}>
                      {categories.map((category, categoryIndex) => {
                        const websites = category.web || [];
                        return (
                          <div
                            key={categoryIndex}
                            className={styles.websiteCategory}
                          >
                            <div className={styles.websiteCategoryHeader}>
                              <Text strong>{category.name}</Text>
                              <Text type="secondary">{websites.length} 个</Text>
                            </div>

                            {websites.length === 0 ? (
                              <div className={styles.emptyHint}>暂无网站</div>
                            ) : (
                              <div className={styles.websiteCards}>
                                {websites.map((record, siteIndex) => (
                                  <Card
                                    key={`${categoryIndex}-${siteIndex}`}
                                    className={styles.websiteCard}
                                    size="small"
                                    title={
                                      <div className={styles.websiteCardTitle}>
                                        <Image
                                          className={styles.favicon20}
                                          fallback="https://via.placeholder.com/20"
                                          height={20}
                                          preview={false}
                                          src={record.logo}
                                          width={20}
                                        />
                                        <span
                                          className={styles.websiteTitleText}
                                        >
                                          {record.title}
                                        </span>
                                      </div>
                                    }
                                  >
                                    {record.desc ? (
                                      <div className={styles.websiteDesc}>
                                        {record.desc}
                                      </div>
                                    ) : (
                                      <div className={styles.websiteDescMuted}>
                                        暂无描述
                                      </div>
                                    )}

                                    <div className={styles.websiteMeta}>
                                      <Text type="secondary">{record.url}</Text>
                                    </div>

                                    <div className={styles.websiteActions}>
                                      <Select
                                        disabled={categories.length <= 1}
                                        placeholder="移动到分类"
                                        size="small"
                                        style={{ width: '100%' }}
                                        value={categoryIndex}
                                        onChange={async value => {
                                          if (value !== categoryIndex) {
                                            moveWebsite(
                                              categoryIndex,
                                              value,
                                              siteIndex
                                            );
                                            await saveToServer();
                                            message.success('移动成功');
                                          }
                                        }}
                                      >
                                        {categories.map((cat, idx) => (
                                          <Option
                                            key={idx}
                                            disabled={idx === categoryIndex}
                                            value={idx}
                                          >
                                            {cat.name}
                                          </Option>
                                        ))}
                                      </Select>

                                      <Space wrap>
                                        <Button
                                          icon={<EditOutlined />}
                                          size="small"
                                          type="link"
                                          onClick={() =>
                                            openMobileWebsiteEditor(
                                              categoryIndex,
                                              siteIndex,
                                              record
                                            )
                                          }
                                        >
                                          编辑
                                        </Button>
                                        <Popconfirm
                                          cancelText="取消"
                                          okText="确定"
                                          title="确定删除?"
                                          onConfirm={async () => {
                                            deleteWebsite(
                                              categoryIndex,
                                              siteIndex
                                            );
                                            await saveToServer();
                                            message.success('删除成功');
                                          }}
                                        >
                                          <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            size="small"
                                            type="link"
                                          >
                                            删除
                                          </Button>
                                        </Popconfirm>

                                        <Button
                                          disabled={siteIndex === 0}
                                          size="small"
                                          type="link"
                                          onClick={async () => {
                                            if (siteIndex === 0) return;
                                            reorderWebsites(
                                              categoryIndex,
                                              siteIndex,
                                              siteIndex - 1
                                            );
                                            await saveToServer();
                                            message.success('排序已更新');
                                          }}
                                        >
                                          上移
                                        </Button>
                                        <Button
                                          disabled={
                                            siteIndex === websites.length - 1
                                          }
                                          size="small"
                                          type="link"
                                          onClick={async () => {
                                            if (
                                              siteIndex >=
                                              websites.length - 1
                                            )
                                              return;
                                            reorderWebsites(
                                              categoryIndex,
                                              siteIndex,
                                              siteIndex + 1
                                            );
                                            await saveToServer();
                                            message.success('排序已更新');
                                          }}
                                        >
                                          下移
                                        </Button>
                                      </Space>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    categories.map((category, categoryIndex) => (
                      <div key={categoryIndex}>
                        <h4 style={{ marginBottom: 16 }}>{category.name}</h4>
                        <Table
                          columns={websiteListColumns(categoryIndex)}
                          dataSource={category.web || []}
                          pagination={false}
                          rowKey={(_, index) => `${categoryIndex}-${index}`}
                          scroll={{ x: 'max-content' }}
                          size="small"
                          onRow={(record, siteIndex) => {
                            const actualSiteIndex = siteIndex ?? 0;
                            return {
                              draggable: !(
                                editingWebsite &&
                                editingWebsite.categoryIndex ===
                                  categoryIndex &&
                                editingWebsite.siteIndex === actualSiteIndex
                              ),
                              onDragStart: event => {
                                event.dataTransfer.setData(
                                  'text/plain',
                                  `${categoryIndex},${actualSiteIndex}`
                                );
                                event.currentTarget.style.opacity = '0.5';
                              },
                              onDragEnd: event => {
                                event.currentTarget.style.opacity = '1';
                              },
                              onDragOver: event => {
                                event.preventDefault();
                              },
                              onDrop: event => {
                                event.preventDefault();
                                const data =
                                  event.dataTransfer.getData('text/plain');
                                const indices = data.split(',');
                                const sourceCategoryIndex = Number(indices[0]);
                                const sourceSiteIndex = Number(indices[1]);

                                if (
                                  Number.isInteger(sourceCategoryIndex) &&
                                  Number.isInteger(sourceSiteIndex) &&
                                  Number.isInteger(categoryIndex) &&
                                  Number.isInteger(actualSiteIndex) &&
                                  sourceCategoryIndex === categoryIndex &&
                                  sourceSiteIndex !== actualSiteIndex
                                ) {
                                  // 同一分类内重新排序
                                  reorderWebsites(
                                    categoryIndex,
                                    sourceSiteIndex,
                                    actualSiteIndex
                                  );
                                  saveToServer();
                                  message.success('排序已更新');
                                } else if (
                                  Number.isInteger(sourceCategoryIndex) &&
                                  Number.isInteger(categoryIndex) &&
                                  Number.isInteger(sourceSiteIndex) &&
                                  sourceCategoryIndex !== categoryIndex
                                ) {
                                  // 移动到不同分类，使用已有的moveWebsite功能
                                  moveWebsite(
                                    sourceCategoryIndex,
                                    categoryIndex,
                                    sourceSiteIndex
                                  );
                                  saveToServer();
                                  message.success('网站已移动');
                                }
                              },
                            };
                          }}
                        />
                      </div>
                    ))
                  )}
                </Card>
              ),
            },
            {
              label: '分类管理',
              key: '2',
              children: (
                <Card className={styles.card} title="分类管理">
                  <Form
                    className={styles.categoryForm}
                    form={categoryForm}
                    layout={isMobile ? 'vertical' : 'inline'}
                    onFinish={handleAddCategory}
                  >
                    <Form.Item
                      name="name"
                      rules={[{ required: true, message: '请输入分类名称' }]}
                    >
                      <Input placeholder="分类名称" />
                    </Form.Item>
                    <Form.Item
                      name="en_name"
                      rules={[{ required: true, message: '请输入英文名称' }]}
                    >
                      <Input placeholder="英文名称" />
                    </Form.Item>
                    <Form.Item initialValue="linecons-star" name="icon">
                      <Select style={{ width: isMobile ? '100%' : 140 }}>
                        <Option value="linecons-star">Star</Option>
                        <Option value="linecons-cog">Cog</Option>
                        <Option value="linecons-doc">Doc</Option>
                        <Option value="linecons-clock">Clock</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item>
                      <Button
                        htmlType="submit"
                        icon={<PlusOutlined />}
                        type="primary"
                      >
                        添加分类
                      </Button>
                    </Form.Item>
                  </Form>
                  <Divider />
                  {isMobile ? (
                    <div className={styles.mobileCategoryList}>
                      {categories.map((record, index) => {
                        const isEditing =
                          editingCategory === index && !!editingCategoryData;
                        const websiteCount = record.web?.length || 0;

                        return (
                          <Card
                            key={index}
                            className={styles.mobileCategoryCard}
                            size="small"
                            title={
                              <div className={styles.mobileCategoryTitle}>
                                <span className={styles.icon}>
                                  {iconMap[record.icon] || <AppstoreOutlined />}
                                </span>
                                <span
                                  className={styles.mobileCategoryTitleText}
                                >
                                  {record.name}
                                </span>
                                <Text type="secondary">{websiteCount} 个</Text>
                              </div>
                            }
                          >
                            <div className={styles.mobileCategoryBody}>
                              {isEditing ? (
                                <Space
                                  direction="vertical"
                                  style={{ width: '100%' }}
                                >
                                  <Input
                                    placeholder="分类名称"
                                    size="middle"
                                    value={editingCategoryData?.name}
                                    onChange={e =>
                                      handleUpdateCategoryField(
                                        'name',
                                        e.target.value
                                      )
                                    }
                                  />
                                  <Input
                                    placeholder="英文名称"
                                    size="middle"
                                    value={editingCategoryData?.en_name}
                                    onChange={e =>
                                      handleUpdateCategoryField(
                                        'en_name',
                                        e.target.value
                                      )
                                    }
                                  />
                                </Space>
                              ) : (
                                <Space
                                  direction="vertical"
                                  style={{ width: '100%' }}
                                >
                                  <div>
                                    <Text type="secondary">中文：</Text>
                                    <Text>{record.name}</Text>
                                  </div>
                                  <div>
                                    <Text type="secondary">英文：</Text>
                                    <Text>{record.en_name}</Text>
                                  </div>
                                </Space>
                              )}
                            </div>

                            <div className={styles.mobileCategoryActions}>
                              {isEditing ? (
                                <Space>
                                  <Button
                                    icon={<EditOutlined />}
                                    type="primary"
                                    onClick={handleSaveCategory}
                                  >
                                    保存
                                  </Button>
                                  <Button onClick={handleCancelEditCategory}>
                                    取消
                                  </Button>
                                </Space>
                              ) : (
                                <Space wrap>
                                  <Button
                                    icon={<EditOutlined />}
                                    type="default"
                                    onClick={() => handleEditCategory(index)}
                                  >
                                    编辑
                                  </Button>
                                  <Popconfirm
                                    cancelText="取消"
                                    okText="确定"
                                    title="确定删除?"
                                    onConfirm={() =>
                                      handleDeleteCategory(index)
                                    }
                                  >
                                    <Button
                                      danger
                                      disabled={categories.length <= 1}
                                      icon={<DeleteOutlined />}
                                    >
                                      删除
                                    </Button>
                                  </Popconfirm>
                                </Space>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Table
                      columns={categoryColumns}
                      dataSource={categories}
                      pagination={false}
                      rowKey={(_, index) => index?.toString() || '0'}
                      scroll={{ x: 'max-content' }}
                      size="small"
                    />
                  )}
                </Card>
              ),
            },
            {
              label: '搜索引擎管理',
              key: '3',
              children: (
                <Card className={styles.card} title="搜索引擎管理">
                  <Form
                    form={searchEngineForm}
                    layout="vertical"
                    onFinish={handleAddSearchEngine}
                  >
                    <Row gutter={16}>
                      <Col md={8} sm={12} xs={24}>
                        <Form.Item
                          label="引擎名称"
                          name="name"
                          rules={[
                            { required: true, message: '请输入引擎名称' },
                          ]}
                        >
                          <Input placeholder="Google、Bing、百度等" />
                        </Form.Item>
                      </Col>
                      <Col md={8} sm={12} xs={24}>
                        <Form.Item
                          label="图标链接"
                          name="icon"
                          rules={[
                            { required: true, message: '请输入图标链接' },
                          ]}
                        >
                          <Input placeholder="https://..." />
                        </Form.Item>
                      </Col>
                      <Col md={8} sm={12} xs={24}>
                        <Form.Item
                          label="搜索URL"
                          name="url"
                          rules={[{ required: true, message: '请输入搜索URL' }]}
                        >
                          <Input placeholder="https://example.com/search?q={query}" />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* 默认Logo选择器 */}
                    <div className={styles.defaultLogos}>
                      <small>选择默认图标：</small>
                      <div className={styles.logoSelector}>
                        {defaultLogos.map((logo, index) => (
                          <Image
                            key={index}
                            className={styles.defaultLogoItem}
                            height={40}
                            preview={false}
                            src={logo}
                            style={{
                              margin: '5px',
                              cursor: 'pointer',
                              border: '2px solid transparent',
                            }}
                            width={40}
                            onClick={() =>
                              searchEngineForm.setFieldsValue({ icon: logo })
                            }
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = '#3498db';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'transparent';
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <Form.Item>
                      <Button
                        htmlType="submit"
                        icon={<PlusOutlined />}
                        type="primary"
                      >
                        添加搜索引擎
                      </Button>
                    </Form.Item>
                  </Form>

                  <Divider />

                  {isMobile ? (
                    <div className={styles.mobileSearchEngineList}>
                      {searchEngines.map((record, index) => (
                        <Card
                          key={index}
                          className={styles.mobileSearchEngineCard}
                          size="small"
                          title={
                            <div className={styles.mobileSearchEngineTitle}>
                              <Image
                                className={styles.favicon20}
                                fallback="https://via.placeholder.com/20"
                                height={20}
                                preview={false}
                                src={record.icon}
                                width={20}
                              />
                              <span
                                className={styles.mobileSearchEngineTitleText}
                              >
                                {record.name}
                              </span>
                            </div>
                          }
                        >
                          <div className={styles.mobileSearchEngineBody}>
                            <Text type="secondary">{record.url}</Text>
                          </div>
                          <div className={styles.mobileSearchEngineActions}>
                            <Popconfirm
                              cancelText="取消"
                              okText="确定"
                              title="确定删除?"
                              onConfirm={() => handleDeleteSearchEngine(index)}
                            >
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                type="primary"
                              >
                                删除
                              </Button>
                            </Popconfirm>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Table
                      columns={searchEngineColumns}
                      dataSource={searchEngines}
                      pagination={false}
                      rowKey={(_, index) => index?.toString() || '0'}
                      scroll={{ x: 'max-content' }}
                      size="small"
                    />
                  )}
                </Card>
              ),
            },
          ]}
        />

        <Drawer
          destroyOnClose
          className={styles.mobileWebsiteEditorDrawer}
          height="100vh"
          open={isMobile && mobileWebsiteEditorOpen}
          placement="bottom"
          title="编辑网站"
          onClose={closeMobileWebsiteEditor}
        >
          {editingWebsiteData ? (
            <div className={styles.mobileEditorLayout}>
              <div className={styles.mobileEditorScroll}>
                <Form layout="vertical">
                  <Form.Item label="网站名称">
                    <Input
                      placeholder="请输入网站名称"
                      value={editingWebsiteData.title}
                      onChange={e =>
                        setEditingWebsiteData(prev =>
                          prev ? { ...prev, title: e.target.value } : prev
                        )
                      }
                    />
                  </Form.Item>

                  <Form.Item label="网站链接">
                    <Input
                      placeholder="https://example.com"
                      value={editingWebsiteData.url}
                      onChange={e => {
                        const url = e.target.value;
                        setEditingWebsiteData(prev =>
                          prev ? { ...prev, url } : prev
                        );
                        if (editingWebsite) {
                          scheduleEditWebsiteFaviconUpdate(
                            `${editingWebsite.categoryIndex}-${editingWebsite.siteIndex}`,
                            url
                          );
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item label="Logo 链接">
                    <Input
                      placeholder="https://example.com/favicon.ico"
                      value={editingWebsiteData.logo}
                      onChange={e =>
                        setEditingWebsiteData(prev =>
                          prev ? { ...prev, logo: e.target.value } : prev
                        )
                      }
                    />
                    <div style={{ marginTop: 10 }}>
                      <Image
                        className={styles.favicon32}
                        fallback="https://via.placeholder.com/32"
                        height={32}
                        preview={false}
                        src={editingWebsiteData.logo}
                        width={32}
                      />
                    </div>

                    <div className={styles.defaultLogos}>
                      <small>选择默认图标：</small>
                      <div className={styles.logoSelector}>
                        {defaultLogos.map((logoUrl, idx) => (
                          <Image
                            key={idx}
                            className={`${styles.favicon32} ${styles.defaultLogoItem} ${editingWebsiteData.logo === logoUrl ? styles.defaultLogoItemSelected : ''}`}
                            height={32}
                            preview={false}
                            src={logoUrl}
                            style={{ border: '2px solid transparent' }}
                            width={32}
                            onClick={() =>
                              setEditingWebsiteData(prev =>
                                prev ? { ...prev, logo: logoUrl } : prev
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </Form.Item>

                  <Form.Item label="描述">
                    <TextArea
                      placeholder="请输入网站描述"
                      rows={3}
                      value={editingWebsiteData.desc}
                      onChange={e =>
                        setEditingWebsiteData(prev =>
                          prev ? { ...prev, desc: e.target.value } : prev
                        )
                      }
                    />
                  </Form.Item>
                </Form>
              </div>

              <div className={styles.mobileEditorFooter}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    block
                    type="primary"
                    onClick={handleSaveEditingWebsite}
                  >
                    保存
                  </Button>
                  <Button block onClick={closeMobileWebsiteEditor}>
                    取消
                  </Button>
                </Space>
              </div>
            </div>
          ) : (
            <div className={styles.emptyHint}>暂无可编辑内容</div>
          )}
        </Drawer>
      </div>
    </>
  );
};

export default ManagePage;
