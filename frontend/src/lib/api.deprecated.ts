// src/lib/api.ts
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

class ApiClient {
  instance: any;

  constructor(options: any) {
    this.instance = axios.create(options);
  }
}

export const api = new ApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// SECURITY: Authentication is now handled via HttpOnly cookies
// set by the backend. Do NOT use localStorage for tokens (XSS vulnerable).
// See: 2026 Red/Black Team Audit - LocalStorage PII Remediation
api.instance.interceptors.request.use((config) => {
  // Cookies are automatically included via credentials: 'include'
  // No manual token handling required
  return config;
});

// Override deprecated methods to use new API service
const originalPost = api.instance.post;
api.instance.post = async function (url, data, config) {
  // Route client registration requests to new API service
  if (url.includes('client-registrations')) {
    try {
      // Import dynamically to avoid circular dependency
      const { apiService } = await import('../services/api');

      if (url.includes('submit-registration')) {
        return apiService.submitClientRegistration(data);
      } else if (url.includes('send-otp')) {
        const registrationId = url.split('/')[2];
        return apiService.sendClientRegistrationOTP(registrationId);
      } else if (url.includes('verify-otp')) {
        const registrationId = url.split('/')[2];
        const otpCode = data?.otp_code;
        return apiService.verifyClientRegistrationOTP(registrationId, otpCode);
      }
    } catch (error) {
      console.error('[API DEPRECATED] Error redirecting to new API service:', error);
      throw error;
    }
  }

  // Fall back to original axios implementation for other requests
  return originalPost.call(this, url, data, config);
};

// Add hooks
export function useGetTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.instance.get('/transactions/');
      return response.data;
    },
  });
}

export function useGetAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.instance.get('/banking/accounts/');
      return response.data;
    },
  });
}
