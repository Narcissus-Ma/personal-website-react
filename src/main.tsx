import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { router } from './router';
import 'antd/dist/reset.css';
import './assets/styles/global.less';
import { useTheme } from '@/hooks';
import { ClickEffect, Loading } from './components';
import { useSiteStore } from './stores/site-store';

const AppRoot: React.FC = () => {
  const { theme } = useTheme();
  const { isLoading } = useSiteStore();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === 'dark'
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      <Loading isLoading={isLoading} />
      <RouterProvider router={router} />
      <ClickEffect type="fireworks" />
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
