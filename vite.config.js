import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // 保持原始路径
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('发送请求到目标服务器:', req.method, req.url);
            // 确保跨域请求的头部正确设置
            proxyReq.setHeader('Origin', 'http://localhost:5173');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('从目标服务器收到响应:', proxyRes.statusCode, req.url);
            // 确保响应头包含正确的CORS头部
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
          });
        },
      }
    }
  }
})
