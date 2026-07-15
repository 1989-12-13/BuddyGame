import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 监听所有网卡接口,让局域网内其他设备可访问
    // 使用 host:true 时 Vite 默认绑定 0.0.0.0
    // strictPort: 避免端口被自动改成别的
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      // TTS 后端代理: 前端 fetch('/api/tts') → http://127.0.0.1:8787/api/tts
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})