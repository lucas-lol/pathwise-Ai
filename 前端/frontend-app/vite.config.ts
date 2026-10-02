// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // 👈 1. 引入 path

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 👇 2. 强制所有包使用项目根目录的同一个 React 实例
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    }
  }
});