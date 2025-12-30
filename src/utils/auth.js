/**
 * Authentication Utilities
 * JWT 토큰 관리 및 API 요청 헤더 설정
 */

/**
 * 토큰 저장
 */
export const saveToken = (token) => {
  localStorage.setItem('authToken', token);
};

/**
 * 토큰 가져오기
 */
export const getToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * 토큰 제거
 */
export const removeToken = () => {
  localStorage.removeItem('authToken');
};

/**
 * 인증 헤더가 포함된 fetch 옵션 생성
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * 인증 헤더가 포함된 fetch 요청
 */
export const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers
  });
};

