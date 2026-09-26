// 优先读取 Vercel 部署时的环境变量，如果没有，则默认使用本地开发地址
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';