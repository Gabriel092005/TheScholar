import axios from 'axios';
import Cookies from 'js-cookie';
import { env } from '@/env';

export const api = axios.create({
    baseURL: env.VITE_API_URL,
    withCredentials: true
});

// URL base para uploads (sem o /api) — ex: https://afroscholars.academy/uploads/
export const uploadsBaseURL = env.VITE_API_URL.replace(/\/api\/?$/, '');

/**
 * Gera URL completa para ficheiros do /uploads/.
 * Aceita paths como "/uploads/foto.jpg", "uploads/foto.jpg", ou "foto.jpg".
 */
export function getUploadUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const clean = path.replace(/^\//, "");
  return `${uploadsBaseURL}/${clean}`;
}

api.interceptors.request.use((config) => {
    const token = Cookies.get("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(async (response) => {
    const delay = 100;
    await new Promise(resolve => setTimeout(resolve, delay));
    return response;
}, (error) => {
    return Promise.reject(error);
});
