import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Space,
  Popconfirm,
  message,
  Divider,
  Tabs,
  Image,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useSiteStore } from '../../stores';
import { Website, Category, SearchEngine } from '../../types';
import styles from './manage-page.module.less';

const { Option } = Select;
const { TextArea } = Input;

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
    addSearchEngine,
    deleteSearchEngine,
    saveToServer,
    loadFromServer,
  } = useSiteStore();

  // 组件挂载时加载数据
  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  const [websiteForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [searchEngineForm] = Form.useForm();

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

  // 默认Logo选项
  const defaultLogos = [
    'https://img1.tucang.cc/api/image/show/e1306a391e2a2a324370bfee481f497b',
    'https://infinityicon.infinitynewtab.com/user-share-icon/d8b62f4d64bda8800b1c788cd5ba3c68.png',
    'https://img1.tucang.cc/api/image/show/d49b2f40283fd12731be9e18b707d48a',
    'https://img1.tucang.cc/api/image/show/77451257254f3851ce36fc23f98c8c70.png',
  ];

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
      render: (icon: string) => <span className={styles.icon}>{icon}</span>,
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
                      className={`${styles.defaultLogoItem} ${editingWebsiteData.logo === logoUrl ? styles.selected : ''}`}
                      height={32}
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
              onChange={e =>
                setEditingWebsiteData({
                  ...editingWebsiteData,
                  url: e.target.value,
                })
              }
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
          placeholder="选择分类"
          size="small"
          style={{ width: 120 }}
          onChange={value => {
            // 移动网站到其他分类的逻辑
            // 这里暂时显示操作说明
          }}
        >
          {categories.map((cat, idx) => (
            <Option key={idx} value={idx}>
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
                onClick={async () => {
                  // 更新网站信息
                  if (editingWebsiteData && editingWebsite) {
                    updateWebsite(
                      editingWebsite.categoryIndex,
                      editingWebsite.siteIndex,
                      editingWebsiteData
                    );
                    await saveToServer();
                    message.success('保存成功');
                    setEditingWebsite(null);
                    setEditingWebsiteData(null);
                  }
                }}
              >
                保存
              </Button>
              <Button
                type="link"
                onClick={() => {
                  setEditingWebsite(null);
                  setEditingWebsiteData(null);
                }}
              >
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
                  setEditingWebsiteData(record);
                }}
              >
                编辑
              </Button>
              <Popconfirm
                cancelText="取消"
                okText="确定"
                title="确定删除?"
                onConfirm={async () => {
                  if (editingWebsite) {
                    deleteWebsite(
                      editingWebsite.categoryIndex,
                      editingWebsite.siteIndex
                    );
                    await saveToServer();
                    message.success('删除成功');
                  }
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
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                    }}
                  >
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
                    <Form.Item
                      label="网站名称"
                      name="title"
                      rules={[{ required: true, message: '请输入网站名称' }]}
                    >
                      <Input placeholder="请输入网站名称" />
                    </Form.Item>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                    }}
                  >
                    <Form.Item
                      label="网站链接"
                      name="url"
                      rules={[{ required: true, message: '请输入网站链接' }]}
                    >
                      <Input placeholder="https://example.com" />
                    </Form.Item>
                    <Form.Item label="Logo链接" name="logo">
                      <Input placeholder="https://example.com/favicon.ico" />
                    </Form.Item>
                  </div>
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
            label: '分类管理',
            key: '2',
            children: (
              <Card className={styles.card} title="分类管理">
                <Form
                  className={styles.categoryForm}
                  form={categoryForm}
                  layout="inline"
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
                    <Input placeholder="English Name" />
                  </Form.Item>
                  <Form.Item initialValue="linecons-star" name="icon">
                    <Select style={{ width: 140 }}>
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
                <Table
                  columns={categoryColumns}
                  dataSource={categories}
                  pagination={false}
                  rowKey={(_, index) => index?.toString() || '0'}
                  size="small"
                />
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
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 16,
                    }}
                  >
                    <Form.Item
                      label="引擎名称"
                      name="name"
                      rules={[{ required: true, message: '请输入引擎名称' }]}
                    >
                      <Input placeholder="Google, Bing, 百度等" />
                    </Form.Item>
                    <Form.Item
                      label="图标链接"
                      name="icon"
                      rules={[{ required: true, message: '请输入图标链接' }]}
                    >
                      <Input placeholder="https://..." />
                    </Form.Item>
                    <Form.Item
                      label="搜索URL"
                      name="url"
                      rules={[{ required: true, message: '请输入搜索URL' }]}
                    >
                      <Input placeholder="https://www.google.com/search?q={query}" />
                    </Form.Item>
                  </div>

                  {/* 默认Logo选择器 */}
                  <div className={styles.defaultLogos}>
                    <small>选择默认图标：</small>
                    <div className={styles.logoSelector}>
                      {defaultLogos.map((logo, index) => (
                        <Image
                          key={index}
                          className={styles.defaultLogoItem}
                          height={40}
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

                <Table
                  columns={searchEngineColumns}
                  dataSource={searchEngines}
                  pagination={false}
                  rowKey={(_, index) => index?.toString() || '0'}
                  size="small"
                />
              </Card>
            ),
          },
          {
            label: '网站列表',
            key: '4',
            children: (
              <Card className={styles.card} title="网站列表">
                {categories.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h4 style={{ marginBottom: 16 }}>{category.name}</h4>
                    <Table
                      columns={websiteListColumns(categoryIndex)}
                      dataSource={category.web || []}
                      pagination={false}
                      rowKey={(_, index) => `${categoryIndex}-${index}`}
                      size="small"
                    />
                  </div>
                ))}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ManagePage;
