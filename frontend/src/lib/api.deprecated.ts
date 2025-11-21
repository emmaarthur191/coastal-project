// src/lib/api.ts
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

class ApiClient {
  instance;

  constructor(options: any) {
    this.instance = axios.create(options);
  }
}

export const api = new ApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// Add auth token if using JWT
api.instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add hooks
(api as any).useGetTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.instance.get('/transactions/');
      return response.data;
    },
  });
};

(api as any).useGetAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.instance.get('/banking/accounts/');
      return response.data;
    },
  });
};