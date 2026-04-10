import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Popconfirm,
  Row,
  Space,
  Switch,
  Table,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useSiteStore } from '@/stores';
import type { TagLinkItem, TagLinkPosition } from '@/types';

interface TagLinkFormValues {
  name: string;
  en_name: string;
  url: string;
  isExternal: boolean;
  enabled: boolean;
}

const getDefaultFormValues = (): TagLinkFormValues => ({
  name: '',
  en_name: '',
  url: '',
  isExternal: false,
  enabled: true,
});

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, '')
    .replace(/-+/g, '-');

const positionTitleMap: Record<TagLinkPosition, string> = {
  header: '顶部标签链接',
  footer: '友情链接标签',
};

const TagLinkManage: React.FC = () => {
  const {
    headerTagLinks,
    footerTagLinks,
    addTagLink,
    updateTagLink,
    deleteTagLink,
    reorderTagLinks,
    saveToServer,
  } = useSiteStore();
  const [headerForm] = Form.useForm<TagLinkFormValues>();
  const [footerForm] = Form.useForm<TagLinkFormValues>();
  const [editingItemMap, setEditingItemMap] = useState<
    Partial<Record<TagLinkPosition, TagLinkItem | null>>
  >({});
  const formMap = {
    header: headerForm,
    footer: footerForm,
  };

  const linksByPosition = useMemo(
    () => ({
      header: [...headerTagLinks]
        .sort((a, b) => a.order - b.order)
        .map((item, index) => ({ ...item, order: index + 1 })),
      footer: [...footerTagLinks]
        .sort((a, b) => a.order - b.order)
        .map((item, index) => ({ ...item, order: index + 1 })),
    }),
    [headerTagLinks, footerTagLinks]
  );

  const persist = async (tip: string) => {
    await saveToServer();
    message.success(tip);
  };

  const handleAdd = async (
    position: TagLinkPosition,
    values: TagLinkFormValues
  ) => {
    const list = linksByPosition[position];
    const fallbackId = `${position}-${Date.now()}`;
    const id = slugify(values.en_name || values.name) || fallbackId;

    addTagLink(position, {
      id,
      name: values.name.trim(),
      en_name: values.en_name.trim() || values.name.trim(),
      url: values.url.trim(),
      isExternal: values.isExternal,
      position,
      target: values.isExternal ? '_blank' : '_self',
      order: list.length + 1,
      enabled: values.enabled,
    });

    await persist('标签链接已添加');
    formMap[position].resetFields();
    formMap[position].setFieldsValue(getDefaultFormValues());
  };

  const handleUpdateField = async (
    position: TagLinkPosition,
    item: TagLinkItem,
    patch: Partial<TagLinkItem>,
    tip: string
  ) => {
    updateTagLink(position, item.id, patch);
    await persist(tip);
  };

  const handleDelete = async (position: TagLinkPosition, id: string) => {
    deleteTagLink(position, id);
    await persist('标签链接已删除');
  };

  const handleMove = async (
    position: TagLinkPosition,
    oldIndex: number,
    newIndex: number
  ) => {
    reorderTagLinks(position, oldIndex, newIndex);
    await persist('排序已更新');
  };

  const renderPositionPanel = (position: TagLinkPosition) => {
    const list = linksByPosition[position];
    const editingItem = editingItemMap[position];

    const columns = [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        render: (_: string, record: TagLinkItem) =>
          editingItem?.id === record.id ? (
            <Input
              value={editingItem.name}
              onChange={event =>
                setEditingItemMap(prev => ({
                  ...prev,
                  [position]: {
                    ...editingItem,
                    name: event.target.value,
                  } as TagLinkItem,
                }))
              }
            />
          ) : (
            record.name
          ),
      },
      {
        title: '英文名',
        dataIndex: 'en_name',
        key: 'en_name',
        render: (_: string, record: TagLinkItem) =>
          editingItem?.id === record.id ? (
            <Input
              value={editingItem.en_name}
              onChange={event =>
                setEditingItemMap(prev => ({
                  ...prev,
                  [position]: {
                    ...editingItem,
                    en_name: event.target.value,
                  } as TagLinkItem,
                }))
              }
            />
          ) : (
            record.en_name
          ),
      },
      {
        title: '链接',
        dataIndex: 'url',
        key: 'url',
        render: (_: string, record: TagLinkItem) =>
          editingItem?.id === record.id ? (
            <Input
              value={editingItem.url}
              onChange={event =>
                setEditingItemMap(prev => ({
                  ...prev,
                  [position]: {
                    ...editingItem,
                    url: event.target.value,
                  } as TagLinkItem,
                }))
              }
            />
          ) : (
            record.url
          ),
      },
      {
        title: '站外',
        key: 'isExternal',
        render: (_: string, record: TagLinkItem) => (
          <Switch
            checked={record.isExternal}
            disabled={editingItem?.id === record.id}
            onChange={checked =>
              handleUpdateField(
                position,
                record,
                {
                  isExternal: checked,
                  target: checked ? '_blank' : '_self',
                },
                '链接类型已更新'
              )
            }
          />
        ),
      },
      {
        title: '启用',
        key: 'enabled',
        render: (_: string, record: TagLinkItem) => (
          <Switch
            checked={record.enabled}
            disabled={editingItem?.id === record.id}
            onChange={checked =>
              handleUpdateField(
                position,
                record,
                { enabled: checked },
                '状态已更新'
              )
            }
          />
        ),
      },
      {
        title: '操作',
        key: 'action',
        render: (_: string, record: TagLinkItem, index: number) => {
          const isEditing = editingItem?.id === record.id;

          return (
            <Space wrap>
              {isEditing ? (
                <>
                  <Button
                    size="small"
                    type="primary"
                    onClick={async () => {
                      if (!editingItem.name.trim() || !editingItem.url.trim()) {
                        message.warning('名称和链接不能为空');
                        return;
                      }
                      await handleUpdateField(
                        position,
                        record,
                        {
                          name: editingItem.name.trim(),
                          en_name:
                            editingItem.en_name.trim() ||
                            editingItem.name.trim(),
                          url: editingItem.url.trim(),
                        },
                        '标签链接已更新'
                      );
                      setEditingItemMap(prev => ({
                        ...prev,
                        [position]: null,
                      }));
                    }}
                  >
                    保存
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      setEditingItemMap(prev => ({ ...prev, [position]: null }))
                    }
                  >
                    取消
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    type="link"
                    onClick={() =>
                      setEditingItemMap(prev => ({
                        ...prev,
                        [position]: { ...record },
                      }))
                    }
                  >
                    编辑
                  </Button>
                  <Popconfirm
                    cancelText="取消"
                    okText="确定"
                    title="确定删除这个标签链接吗？"
                    onConfirm={() => handleDelete(position, record.id)}
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
                    disabled={index === 0}
                    size="small"
                    type="link"
                    onClick={() => handleMove(position, index, index - 1)}
                  >
                    上移
                  </Button>
                  <Button
                    disabled={index === list.length - 1}
                    size="small"
                    type="link"
                    onClick={() => handleMove(position, index, index + 1)}
                  >
                    下移
                  </Button>
                </>
              )}
            </Space>
          );
        },
      },
    ];

    return (
      <Card
        key={position}
        style={{ marginBottom: 16 }}
        title={positionTitleMap[position]}
      >
        <Form
          form={formMap[position]}
          initialValues={getDefaultFormValues()}
          layout="vertical"
          onFinish={values => handleAdd(position, values)}
        >
          <Row gutter={16}>
            <Col md={6} sm={12} xs={24}>
              <Form.Item
                label="名称"
                name="name"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="请输入名称" />
              </Form.Item>
            </Col>
            <Col md={6} sm={12} xs={24}>
              <Form.Item label="英文名" name="en_name">
                <Input placeholder="请输入英文名" />
              </Form.Item>
            </Col>
            <Col md={8} sm={24} xs={24}>
              <Form.Item
                label="链接"
                name="url"
                rules={[{ required: true, message: '请输入链接' }]}
              >
                <Input
                  placeholder={
                    position === 'header' ? '/about' : 'https://example.com'
                  }
                />
              </Form.Item>
            </Col>
            <Col md={4} sm={24} xs={24}>
              <Space wrap style={{ marginTop: 30 }}>
                <Form.Item name="isExternal" valuePropName="checked">
                  <Switch checkedChildren="站外" unCheckedChildren="站内" />
                </Form.Item>
                <Form.Item name="enabled" valuePropName="checked">
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
              </Space>
            </Col>
          </Row>
          <Form.Item>
            <Button htmlType="submit" icon={<PlusOutlined />} type="primary">
              添加标签链接
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={list}
          pagination={false}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </Card>
    );
  };

  return (
    <div>
      {renderPositionPanel('header')}
      {renderPositionPanel('footer')}
    </div>
  );
};

export default TagLinkManage;
