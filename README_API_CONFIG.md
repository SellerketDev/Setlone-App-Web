# API 서버 설정 가이드

## 개요
프론트엔드에서 사용하는 API 서버 URL을 환경 변수로 관리합니다.
AWS 인스턴스에 API 서버를 별도로 배포할 때 쉽게 변경할 수 있습니다.

## 설정 방법

### 1. 환경 변수 파일 생성 (선택사항)
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```bash
# 개발 환경
VITE_API_URL=https://localhost:3000

# 프로덕션 환경 (AWS 인스턴스)
# VITE_API_URL=https://api.setlone.com
```

### 2. 빌드 시 환경 변수 설정
프로덕션 빌드 시 환경 변수를 설정:

```bash
# 개발 환경
npm run dev

# 프로덕션 빌드 (AWS 인스턴스 URL 사용)
VITE_API_URL=https://api.setlone.com npm run build
```

### 3. vite.config.js 수정
`vite.config.js`에서 기본값을 변경할 수 있습니다:

```javascript
define: {
  'import.meta.env.VITE_API_URL': JSON.stringify(
    process.env.VITE_API_URL || 'https://localhost:3000'  // 기본값 변경
  )
}
```

## AWS 인스턴스 배포 시

1. AWS 인스턴스의 공개 IP 또는 도메인 확인
2. 환경 변수 설정:
   ```bash
   export VITE_API_URL=https://your-aws-instance-url.com
   ```
3. 빌드:
   ```bash
   npm run build
   ```

## 코드에서 사용

```javascript
import { getApiUrl } from '../config/api'

// API 호출
const response = await fetch(getApiUrl('/api/v1/users/1'))
```

## 현재 설정
- 개발 환경: `https://localhost:3000`
- 프로덕션 환경: 환경 변수 `VITE_API_URL` 또는 기본값 사용

