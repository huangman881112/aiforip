import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.vue', '.js', '.ts'],
  },
  server: {
    // 允许外部访问（host: true = 监听所有网卡）
    host: true,
    // 阶段三：/api 代理到 Spring Boot 后端（dev 联调）
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
