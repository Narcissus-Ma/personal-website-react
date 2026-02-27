import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores';
import styles from './auth-modal.module.less';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyPassword } = useAuthStore();

  const handleOk = async () => {
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
      onClose();
      onSuccess();
    } else {
      message.error('密码错误');
    }
  };

  const handleCancel = () => {
    setPassword('');
    onClose();
  };

  return (
    <Modal
      cancelText="取消"
      confirmLoading={loading}
      okText="确认"
      open={visible}
      title="管理页面鉴权"
      onCancel={handleCancel}
      onOk={handleOk}
    >
      <div className={styles.container}>
        <Input.Password
          placeholder="请输入管理密码"
          prefix={<LockOutlined />}
          size="large"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onPressEnter={handleOk}
        />
      </div>
    </Modal>
  );
};

export default AuthModal;
