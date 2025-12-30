import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9100,
    host: '0.0.0.0',
    strictPort: false,
    // nginx를 통한 접근 허용
    allowedHosts: [
      'setlone.com',
      'www.setlone.com',
      'localhost'
    ],
    // HMR 설정: 개발 환경에서는 기본값 사용 (자동 감지)
    // 프로덕션 환경에서만 특정 설정 필요 시 아래 주석 해제
    // hmr: process.env.NODE_ENV === 'production' ? {
    //   protocol: 'wss',
    //   host: 'setlone.com',
    //   clientPort: 443
    // } : undefined
  }
  // 환경 변수는 .env 파일 또는 시스템 환경 변수로 설정
  // Vite는 자동으로 import.meta.env.VITE_* 형태의 변수를 제공
  // 개발 환경: .env 파일에 VITE_API_URL=https://localhost:3000
  // 프로덕션 환경: 빌드 시 VITE_API_URL=https://api.setlone.com 설정
})
