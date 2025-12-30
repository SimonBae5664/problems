import axios from 'axios';

// API URL 가져오기 및 검증
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 프로덕션 환경에서 localhost 사용 방지
if (import.meta.env.PROD) {
  if (!import.meta.env.VITE_API_URL) {
    console.error('⚠️ VITE_API_URL 환경 변수가 설정되지 않았습니다!');
    console.error('Vercel 대시보드에서 VITE_API_URL 환경 변수를 설정해주세요.');
    // 프로덕션에서는 기본값을 사용하지 않음
    API_URL = window.location.origin; // 현재 도메인 사용 (프록시 설정이 있다면)
  } else if (API_URL.includes('localhost')) {
    console.error('⚠️ 프로덕션 환경에서 localhost를 사용할 수 없습니다!');
    console.error('현재 VITE_API_URL:', API_URL);
    console.error('Vercel 환경 변수에서 올바른 백엔드 URL을 설정해주세요.');
  }
}

// URL 오타 자동 수정 (.comn -> .com)
if (API_URL.includes('.comn')) {
  console.warn('API URL 오타 감지: .comn을 .com으로 수정합니다.');
  API_URL = API_URL.replace('.comn', '.com');
}

// API URL 로깅 (개발 및 프로덕션 모두)
console.log('🌐 API URL:', API_URL);
console.log('🔧 환경:', import.meta.env.MODE);
console.log('📦 VITE_API_URL 값:', import.meta.env.VITE_API_URL || '(설정되지 않음)');

// 전역 변수로 노출 (디버깅용)
if (typeof window !== 'undefined') {
  (window as any).__API_URL__ = API_URL;
  (window as any).__VITE_API_URL__ = import.meta.env.VITE_API_URL;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

