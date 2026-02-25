import React from 'react';
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
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useSiteStore } from '../../stores';
import { Website, Category } from '../../types';
import styles from './manage-page.module.less';

const { Option } = Select;
const { TextArea } = Input;

const ManagePage: React.FC = () => {
  const { categories, addWebsite, addCategory, deleteCategory, saveToServer } =
    useSiteStore();

  const [websiteForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  const handleAddWebsite = async (values: Website) => {
    try {
      addWebsite(0, {
        ...values,
        logo:
          values.logo ||
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
    },
    {
      title: '英文名称',
      dataIndex: 'en_name',
      key: 'en_name',
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
      render: (_: unknown, record: Category, index: number) => (
        <Space>
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

      <Card className={styles.card} title="添加网站">
        <Form
          form={websiteForm}
          initialValues={{ categoryIndex: 0 }}
          layout="vertical"
          onFinish={handleAddWebsite}
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
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
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
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
            <Button htmlType="submit" icon={<PlusOutlined />} type="primary">
              添加网站
            </Button>
          </Form.Item>
        </Form>
      </Card>

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
          <Form.Item initialValue="HomeOutlined" name="icon">
            <Select style={{ width: 140 }}>
              <Option value="HomeOutlined">HomeOutlined</Option>
              <Option value="AppstoreOutlined">AppstoreOutlined</Option>
              <Option value="SettingOutlined">SettingOutlined</Option>
              <Option value="ToolOutlined">ToolOutlined</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" icon={<PlusOutlined />} type="primary">
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
    </div>
  );
};

export default ManagePage;
