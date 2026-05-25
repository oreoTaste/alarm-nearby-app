import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,    // 0.0.0.0으로 노출 (도커 환경 필수)
    port: 5173,
    // 여기에 접속하려는 도메인을 추가합니다.
    allowedHosts: ['mygps.kr'], 
    // 또는 모든 호스트를 허용하려면 아래와 같이 작성합니다.
    // allowedHosts: 'all',
    watch: {
      usePolling: true,
    }
  }
})

