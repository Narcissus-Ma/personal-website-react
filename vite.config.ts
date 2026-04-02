import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          'primary-color': '#3498db',
          'border-radius-base': '4px',
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将大型依赖库单独打包
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          zustand: ['zustand'],
        },
      },
    },
  },
  base: './',
});
