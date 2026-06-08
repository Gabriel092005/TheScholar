import axios from 'axios';
import Cookies from 'js-cookie';
import { env } from '@/env';

export const api = axios.create({
    baseURL: env.VITE_API_URL,
    withCredentials: true
});

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
