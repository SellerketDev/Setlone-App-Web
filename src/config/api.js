/**
 * API Configuration
 * 환경 변수에서 API 서버 URL을 가져옵니다.
 * 
 * 개발 환경: .env 파일의 VITE_API_URL 사용
 * 프로덕션 환경: .env.production 파일의 VITE_API_URL 사용
 * 
 * Cloudflare 사용 시: 상대 경로 사용 (같은 도메인)
 * AWS 인스턴스 사용 시: .env.production의 VITE_API_URL을 AWS 인스턴스 URL로 변경
 */

// 프로덕션 환경에서는 상대 경로 사용 (Cloudflare를 통한 접근)
// 개발 환경에서는 절대 URL 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3000');

/**
 * API 엔드포인트 생성
 * @param {string} path - API 경로 (예: '/api/v1/users/1')
 * @returns {string} 전체 API URL
 */
export const getApiUrl = (path) => {
  // path가 이미 전체 URL인 경우 그대로 반환
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // path가 /로 시작하지 않으면 추가
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // API_BASE_URL이 비어있으면 상대 경로 사용 (Cloudflare를 통한 접근)
  if (!API_BASE_URL || API_BASE_URL === '') {
    return normalizedPath;
  }
  
  // API_BASE_URL이 /로 끝나면 제거
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
  
  return `${baseUrl}${normalizedPath}`;
};

/**
 * API 기본 URL
 */
export const API_URL = API_BASE_URL;

export default {
  API_URL,
  getApiUrl
};

