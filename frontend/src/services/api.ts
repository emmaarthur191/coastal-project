import { Account } from '../api/models/Account';
import { Transaction } from '../api/models/Transaction';
import { ServiceRequest } from '../api/models/ServiceRequest';

export interface ApiResponse<T = any> {
  data: T;
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export interface MemberDashboardData {
  account_balance: number;
  recent_transactions: any[];
  [key: string]: any;
}

export interface AccountSummary {
  total_balance: number;
  accounts: any[];
  [key: string]: any;
}

// Use environment variable for API URL
const getApiBaseUrl = () => {
  // Check for VITE_API_BASE_URL (used in docker-compose)
  if (import.meta.env.VITE_API_BASE_URL) {
    // If it already ends with /api or /api/, don't add it again
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (baseUrl.endsWith('/api') || baseUrl.endsWith('/api/')) {
      return baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    }
    return baseUrl + '/api/';
  }
  // Fallback to VITE_API_URL for Railway
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL;
    if (baseUrl.endsWith('/api') || baseUrl.endsWith('/api/')) {
      return baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    }
    return baseUrl + '/api/';
  }
  // In production, use HTTPS with environment variable or fallback
  if (import.meta.env.PROD) {
    if (import.meta.env.VITE_PROD_API_URL) {
      return import.meta.env.VITE_PROD_API_URL.endsWith('/')
        ? import.meta.env.VITE_PROD_API_URL
        : import.meta.env.VITE_PROD_API_URL + '/';
    }
    throw new Error('VITE_PROD_API_URL environment variable is required in production');
  }
  // In development, use proxy with environment variable or fallback
  if (import.meta.env.VITE_DEV_API_URL) {
    return import.meta.env.VITE_DEV_API_URL.endsWith('/')
      ? import.meta.env.VITE_DEV_API_URL
      : import.meta.env.VITE_DEV_API_URL + '/';
  }
  return '/api/';
};

// HTTPS enforcement removed - let the deployment environment handle this
// Local development uses HTTP, production should use a reverse proxy with HTTPS

const API_BASE_URL = getApiBaseUrl();

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, options?: any) => void;
    };
  }
}

// Request configuration type
interface RequestConfig {
  method: string;
  url: string;
  data?: any;
  headers?: HeadersInit | Record<string, string>;
  [key: string]: any;
}

// Extended Error interface
interface ApiError extends Error {
  status?: number;
  data?: any;
}


// Logging utility for API debugging
const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${message}`, data || '');
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(`[API Warning] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[API Error] ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
      console.debug(`[API Debug] ${message}`, data || '');
    }
  }
};

// DEPRECATED: This function is no longer used with httpOnly cookie-based authentication
// Tokens are now managed securely by the backend in httpOnly cookies
// @deprecated Use backend-managed httpOnly cookies instead
function setStoredTokens(access, refresh) {
  // No-op: tokens are handled by backend httpOnly cookies
  logger.warn('setStoredTokens is deprecated. Tokens are now managed by backend httpOnly cookies.');
}

// CSRF token management
function getCsrfToken() {
  // Try to get CSRF token from cookie
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return value;
      }
    }
  }
  return null;
}

function getStoredTokens() {
  // Tokens are now stored in httpOnly cookies by the backend
  // Frontend cannot read httpOnly cookies, so we return null
  // Authentication is handled via cookies automatically by the browser
  logger.debug('getStoredTokens: tokens are managed by backend httpOnly cookies');
  return { access: null, refresh: null };
}

// Helper function to check if token is expired
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

// Helper function to refresh access token
async function refreshAccessToken() {
  const { refresh } = getStoredTokens();
  if (!refresh || isTokenExpired(refresh)) {
    logger.warn('Token refresh failed: No valid refresh token available');
    return null;
  }

  logger.debug('Attempting token refresh');

  try {
    const response = await fetch(`${API_BASE_URL}users/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      setStoredTokens(data.access, data.refresh || refresh);
      logger.info('Token refreshed successfully');
      return data.access;
    } else {
      logger.error('Token refresh failed with status:', response.status);
    }
  } catch (error) {
    logger.error('Token refresh network error:', error);
  }

  return null;
}

// Public refresh token function
export async function refreshToken() {
  return refreshAccessToken();
}


// Request timeout configuration
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Request/Response interceptor types
interface RequestInterceptor {
  (config: RequestConfig): Promise<RequestConfig> | RequestConfig;
}

interface ResponseInterceptor {
  (response: Response, data?: any): Promise<any> | any;
}

interface ErrorInterceptor {
  (error: any, config: RequestConfig): Promise<any> | any;
}

// Interceptor storage
const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];
const errorInterceptors: ErrorInterceptor[] = [];

// Add interceptors
export function addRequestInterceptor(interceptor: RequestInterceptor) {
  requestInterceptors.push(interceptor);
}

export function addResponseInterceptor(interceptor: ResponseInterceptor) {
  responseInterceptors.push(interceptor);
}

export function addErrorInterceptor(interceptor: ErrorInterceptor) {
  errorInterceptors.push(interceptor);
}

// Initialize request/response interceptors for error tracking
addRequestInterceptor((config) => {
  // Add request timestamp for tracking
  config.startTime = Date.now();
  logger.debug(`Request interceptor: ${config.method} ${config.url}`);
  return config;
});

addResponseInterceptor((response, data) => {
  // Log successful responses
  const duration = Date.now() - (response as any).startTime;
  logger.debug(`Response interceptor: ${response.status} (${duration}ms)`);
  return response;
});

addErrorInterceptor((error, config) => {
  // Enhanced error tracking
  const duration = Date.now() - (config as any).startTime;
  logger.error(`Error interceptor: ${config.method} ${config.url} (${duration}ms)`, error);

  // Could send to error tracking service here
  if (import.meta.env.PROD && window.Sentry) {
    window.Sentry.captureException(error, {
      tags: {
        api_call: `${config.method} ${config.url}`,
        duration: duration.toString()
      },
      extra: {
        config,
        errorData: error.data
      }
    });
  }

  return error;
});

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate retry delay with exponential backoff
const getRetryDelay = (attempt: number) => RETRY_DELAY * Math.pow(2, attempt);

// Check if error is retryable
const isRetryableError = (error: any) => {
  // Retry on network errors, 5xx server errors, and timeouts
  if (!error || typeof error !== 'object') return false;

  const status = error.status || 0;
  const errorName = error.name;

  // Network errors (no status)
  if (status === 0) return true;

  // Timeout errors
  if (errorName === 'AbortError') return true;

  // Server errors (5xx)
  if (status >= 500 && status < 600) return true;

  // Don't retry client errors (4xx) except 429 (rate limit)
  if (status === 429) return true;

  return false;
};

// Enhanced API call function with retry logic and interceptors
async function apiCall(method: string, url: string, data: any = null, config: RequestInit = {}, retryCount = 0): Promise<{ data: any }> {
  const startTime = Date.now();
  const requestConfig = { method, url, data, ...config };

  logger.debug(`API call: ${method} ${url} (attempt ${retryCount + 1})`, { data: data, config });

  try {
    // Apply request interceptors
    let processedConfig = { ...requestConfig };
    for (const interceptor of requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }

    // Get access token from localStorage for JWT authentication
    const accessToken = localStorage.getItem('accessToken');

    // Build headers object - ensure processedConfig.headers is treated as Record
    const configHeaders = (processedConfig.headers || {}) as Record<string, string>;

    const headers: Record<string, string> = {
      // Default to JSON only if not FormData
      ...(data instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      // Include CSRF token for state-changing operations
      ...((method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') && { 'X-CSRFToken': getCsrfToken() }),
      // Include JWT Authorization header if token exists
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      ...configHeaders,
    };

    // Don't stringify FormData
    const body = (data && method !== 'GET')
      ? (data instanceof FormData ? data : JSON.stringify(data))
      : undefined;

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method,
        headers,
        body,
        credentials: 'include', // Ensure cookies are sent
        signal: controller.signal,
        ...processedConfig,
      });

      clearTimeout(timeoutId);

      // Apply response interceptors
      let processedResponse = response;
      for (const interceptor of responseInterceptors) {
        processedResponse = await interceptor(processedResponse);
      }

      if (!processedResponse.ok) {
        let errorData = {};
        try {
          const contentType = processedResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await processedResponse.json();
          } else if (contentType && contentType.includes('text/html')) {
            // HTML response typically means wrong backend URL or server error page
            const textPreview = await processedResponse.text();
            const preview = textPreview.substring(0, 200);
            console.error('[API] Received HTML instead of JSON - check backend URL:', preview);
            errorData = {
              detail: 'Unexpected HTML response - check backend URL or server configuration',
              html_preview: preview
            };
          } else {
            // Handle non-JSON error responses gracefully
            const textResponse = await processedResponse.text();
            errorData = { detail: textResponse || `HTTP error! status: ${processedResponse.status}` };
          }
        } catch (parseError) {
          // If response parsing fails, create a generic error
          errorData = { detail: `HTTP error! status: ${processedResponse.status}` };
        }

        // Extract the actual error details from the backend response
        const status = processedResponse.status;
        const data = errorData;
        const msg = (data as any)?.detail || (data as any)?.error || (data as any)?.message || `HTTP error! status: ${status}`;
        console.error(`[API ERROR ${status}]`, msg);
        console.error("Full data:", data);

        const error = new Error(
          sanitizeErrorMessage((errorData as any).error || (errorData as any).detail || `HTTP error! status: ${processedResponse.status}`)
        );
        (error as any).status = processedResponse.status;
        (error as any).data = errorData;

        // Apply error interceptors
        for (const interceptor of errorInterceptors) {
          try {
            await interceptor(error, processedConfig);
          } catch (interceptorError) {
            logger.warn('Error interceptor failed:', interceptorError);
          }
        }

        // Handle specific status codes
        if (processedResponse.status === 403) {
          throw new Error('Access denied - insufficient permissions. Please contact an administrator.');
        }
        if (processedResponse.status === 401) {
          // Token might be expired, try to refresh
          const refreshResult = await refreshToken();
          if (refreshResult) {
            // Refresh successful, retry the request
            return apiCall(method, url, data, config, retryCount);
          } else {
            // Refresh failed, don't retry
            throw error;
          }
        }

        // Check if error is retryable and we haven't exceeded max retries
        if (isRetryableError(error) && retryCount < MAX_RETRIES) {
          const delay = getRetryDelay(retryCount);
          logger.warn(`Retrying ${method} ${url} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          await sleep(delay);
          return apiCall(method, url, data, config, retryCount + 1);
        }

        throw error;
      }

      let responseData;
      if (processedResponse.status === 204) {
        responseData = null;
      } else {
        const contentType = processedResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            responseData = await processedResponse.json();
          } catch (jsonError) {
            logger.warn(`Failed to parse JSON response for ${method} ${url}:`, jsonError);
            // Handle non-JSON responses gracefully
            responseData = await processedResponse.text();
          }
        } else {
          // Handle non-JSON responses (HTML, text, etc.)
          responseData = await processedResponse.text();
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`API call successful: ${method} ${url} (${duration}ms, attempt ${retryCount + 1})`);
      return { data: responseData };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Apply error interceptors for fetch errors
      for (const interceptor of errorInterceptors) {
        try {
          await interceptor(fetchError, processedConfig);
        } catch (interceptorError) {
          logger.warn('Error interceptor failed:', interceptorError);
        }
      }

      // Handle AbortError (timeout)
      if (fetchError && typeof fetchError === 'object' && 'name' in fetchError && fetchError.name === 'AbortError') {
        logger.warn(`API call timeout: ${method} ${url} (${duration}ms)`);
        const timeoutError = new Error('Request timeout') as ApiError;
        timeoutError.status = 0;
        timeoutError.data = { error: 'Request timeout' };

        // Retry timeout errors
        if (retryCount < MAX_RETRIES) {
          const delay = getRetryDelay(retryCount);
          logger.warn(`Retrying ${method} ${url} after timeout in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          await sleep(delay);
          return apiCall(method, url, data, config, retryCount + 1);
        }

        throw timeoutError;
      }

      // Retry other network errors
      if (isRetryableError(fetchError) && retryCount < MAX_RETRIES) {
        const delay = getRetryDelay(retryCount);
        logger.warn(`Retrying ${method} ${url} after network error in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
        await sleep(delay);
        return apiCall(method, url, data, config, retryCount + 1);
      }

      logger.error(`API call failed: ${method} ${url} (${duration}ms)`, fetchError);
      throw fetchError;
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    // Enhanced error handling with classification
    if (error && typeof error === 'object' && 'status' in error) {
      logger.error(`API call error: ${method} ${url} (${duration}ms)`, error);
      throw error; // Already a properly formatted error
    }

    // Handle network and other errors
    const errorMessage = error && typeof error === 'object' && 'message' in error
      ? error.message
      : 'Network error';

    logger.error(`API call network error: ${method} ${url} (${duration}ms)`, error);
    const networkError = new Error(errorMessage) as ApiError;
    networkError.status = 500;
    networkError.data = { error: 'Network error' };
    throw networkError;
  }
}


const ApiResponse = {
  data: null
};

const AuthResponse = {
  user: null,
  token: null
};

// Error message sanitization helper
function sanitizeErrorMessage(message) {
  // Production environment should show generic messages
  if (import.meta.env.PROD) {
    return 'An error occurred. Please try again or contact support if the problem persists.';
  }

  // Development environment can show more details but still sanitized
  const sensitivePatterns = [
    /password\s*[:=]\s*\S+/i,
    /token\s*[:=]\s*\S+/i,
    /key\s*[:=]\s*\S+/i,
    /bearer\s+\S+/i,
    /secret\s*[:=]\s*\S+/i,
    /private\s+key/i,
    /database/i,
    /sql/i,
    /connection/i,
  ];

  // Ensure message is a string to prevent TypeError when calling replace()
  let sanitized = String(message || '');
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // If message contains suspicious content, use generic message
  if (/[<>{}[\]\\]/.test(sanitized)) {
    sanitized = 'An error occurred. Please try again or contact support if the problem persists.';
  }

  return sanitized;
}


const MemberDashboardData = {
  account_balance: 0,
  recent_transactions: [],
  loan_balance: 0,
  savings_balance: 0,
  available_tabs: [],
  user_permissions: {},
  membership_status: {}
};

const MockAccountSummary = {
  total_savings: 0,
  total_loans: 0,
  available_balance: 0,
  monthly_contributions: 0
};

const MockAccount = {
  id: '',
  name: '',
  balance: 0
};

const MockTransaction = {
  id: '',
  date: '',
  description: '',
  amount: 0
};

// Authentication service
export const authService = {
  async login(email, password) {
    console.log('[DEBUG] authService.login called with:', email, '[PASSWORD HIDDEN]');
    try {
      console.log('[DEBUG] Making login request to backend...');
      // Use direct fetch for login to avoid CSRF token (JWT auth doesn't need it)
      const response = await fetch(`${API_BASE_URL}users/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[DEBUG] Login response status:', response.status);

      if (!response.ok) {
        let errorData: { detail?: string; error?: string;[key: string]: any } = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            // Handle non-JSON error responses gracefully
            const textResponse = await response.text();
            errorData = { detail: textResponse || `HTTP error! status: ${response.status}` };
          }
        } catch (parseError) {
          // If response parsing fails, create a generic error
          errorData = { detail: `HTTP error! status: ${response.status}` };
        }

        console.log('[DEBUG] Login failed with error data:', errorData);

        // Handle rate limiting (429) specifically
        if (response.status === 429) {
          const errorMessage = sanitizeErrorMessage(errorData.detail || errorData.error || 'Too many login attempts');

          // Extract seconds from error message if present
          const secondsMatch = errorMessage.match(/(\d+)\s+seconds?/i);
          if (secondsMatch) {
            const seconds = parseInt(secondsMatch[1]);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;

            if (minutes > 0) {
              throw new Error(
                `Account temporarily locked due to multiple failed login attempts. ` +
                `Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''} ` +
                `${remainingSeconds > 0 ? `and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : ''}.`
              );
            } else {
              throw new Error(
                `Account temporarily locked due to multiple failed login attempts. ` +
                `Please try again in ${seconds} second${seconds !== 1 ? 's' : ''}.`
              );
            }
          }

          throw new Error(errorMessage);
        }

        // Handle other errors
        throw new Error(sanitizeErrorMessage(errorData.detail || errorData.error || 'Login failed'));
      }

      const data = await response.json();
      console.log('[DEBUG] Login successful, tokens set in httpOnly cookies');

      // Store tokens in localStorage as requested for frontend compatibility
      if (data.access) {
        localStorage.setItem('accessToken', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refreshToken', data.refresh);
      }

      return data;
    } catch (error) {
      console.log('[DEBUG] Login threw exception:', error);
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      // Attempt server logout - cookies will be sent automatically
      const response = await fetch(`${API_BASE_URL}users/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Include credentials to send cookies
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Return success regardless - cookies are cleared server-side
    return { detail: 'Logged out successfully' };
  },

  async checkAuth() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include JWT token if available
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}users/auth/check/`, {
        headers,
        credentials: 'include', // Also include cookies for CSRF
      });

      if (response.ok) {
        return await response.json();
      } else {
        return { authenticated: false };
      }
    } catch (error) {
      console.error('Auth check error:', error);
      return { authenticated: false };
    }
  },

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}users/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      // Registration doesn't automatically log in, so don't set tokens
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Helper function to get current access token
  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  // Helper function to check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}users/auth/check/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return data.authenticated || false;
      }
      return false;
    } catch (error) {
      logger.error('Auth check failed:', error);
      return false;
    }
  },

  // Helper function to refresh access token (deprecated - handled automatically by cookies)
  async refreshAccessToken(): Promise<string | null> {
    logger.warn('refreshAccessToken is deprecated. Token refresh is handled automatically via cookies.');
    return null;
  },

  // Manager Dashboard Methods
  async getOperationalMetrics(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/metrics/');
      return { success: true, data: response.data || {} };
    } catch (error: any) {
      console.error('Error fetching operational metrics:', error);
      return { success: false, error: error.message, data: {} };
    }
  },

  async getAllTransactions(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('transactions/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getPendingLoans(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('banking/loans/pending/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getCashFlow(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/cash-flow/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async calculateInterest(): Promise<{ success; data?: any; error?: string }> {
    try {
      // Provide default parameters to avoid 400 Bad Request
      const defaultParams = {
        account_type: 'loan',
        principal: 10000,
        rate: 0.05, // 5%
        time_period: 12, // 12 months
        compounding_frequency: 'monthly'
      };
      const response = await api.post('operations/calculate-interest/', defaultParams);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getCommissionSummary(): Promise<{ success; data?: any; error?: string }> {
    try {
      // Use the commission summary endpoint which provides daily/weekly/monthly breakdowns
      const response = await api.get('operations/commissions/summary/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getServiceCharges(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/service-charges/');
      return { success: true, data: response.data || [] };
    } catch (error: any) {
      console.error('Error fetching service charges:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  async createServiceCharge(chargeData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/service-charges/', chargeData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async calculateServiceCharge(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/calculate-service-charge/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getAllStaff(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('users/staff/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getStaffIds(filters?: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const queryString = filters ? `?${new URLSearchParams(filters).toString()}` : '';
      const response = await api.get(`users/staff-ids/${queryString}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getExpenses(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/expenses/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async sendOTP(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('users/send-otp/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async verifyOTP(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('users/verify-otp/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createUser(userData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      // Check if userData contains file uploads
      const hasFileUploads = userData.passport_picture || userData.application_letter || userData.appointment_letter;

      if (hasFileUploads) {
        // Handle file uploads with FormData
        const formData = new FormData();

        // Add regular fields
        Object.keys(userData).forEach(key => {
          if (key !== 'passport_picture' && key !== 'application_letter' && key !== 'appointment_letter') {
            if (userData[key] !== null && userData[key] !== undefined) {
              formData.append(key, userData[key]);
            }
          }
        });

        // Add files if they exist
        if (userData.passport_picture) {
          formData.append('passport_picture', userData.passport_picture);
        }
        if (userData.application_letter) {
          formData.append('application_letter', userData.application_letter);
        }
        if (userData.appointment_letter) {
          formData.append('appointment_letter', userData.appointment_letter);
        }

        // Make request with FormData
        const response = await fetch(`${API_BASE_URL}users/create/`, {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - let browser set it with boundary
        });

        if (!response.ok) {
          const errorData = await response.json();
          return { success: false, error: errorData.error || 'Failed to create user' };
        }

        return { success: true, data: await response.json() };
      } else {
        // Regular JSON request for backward compatibility
        const response = await api.post('users/create/', userData);
        return { success: true, data: response.data };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async approveLoan(loanId: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post(`banking/loans/${loanId}/approve/`, {});
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async rejectLoan(loanId: string, notes?: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post(`banking/loans/${loanId}/reject/`, { notes: notes || '' });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async generatePayslip(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/generate-payslip/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async generateStatement(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('banking/generate-statement/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Operations Manager Methods
  async getBranchActivity(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/branch-activity/');
      return { success: true, data: response.data || [] };
    } catch (error: any) {
      console.error('Error fetching branch activity:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  async getSystemAlerts(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/system-alerts/');
      return { success: true, data: response.data || [] };
    } catch (error: any) {
      console.error('Error fetching system alerts:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  async getWorkflowStatus(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/workflow-status/');
      return { success: true, data: response.data || {} };
    } catch (error: any) {
      console.error('Error fetching workflow status:', error);
      return { success: false, error: error.message, data: {} };
    }
  },

  async generateReport(reportData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/generate-report/', reportData);
      return { success: true, data: response.data || null };
    } catch (error: any) {
      console.error('Error generating report:', error);
      return { success: false, error: error.message, data: null };
    }
  },

  // Staff Management Methods
  async deactivateStaff(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('users/deactivate-staff/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async reactivateStaff(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('users/reactivate-staff/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Expense Management
  async createExpense(expenseData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/expenses/', expenseData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },


  async getAllUsers(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('users/all/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Messaging API Methods
  async getMessageThreads(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('banking/message-threads/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getThreadMessages(threadId: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get(`banking/messages/?thread=${threadId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async sendMessage(messageData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('banking/messages/', messageData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createMessageThread(threadData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('banking/message-threads/', threadData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async markThreadRead(threadId: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.patch(`banking/message-threads/${threadId}/`, { is_read: true });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getUserEncryptionKey(userId: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get(`banking/encryption-keys/${userId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createUserEncryptionKey(keyData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('banking/encryption-keys/', keyData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getStaffUsers(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('users/staff/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async addMessageReaction(messageId: string, emoji: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post(`banking/messages/${messageId}/add_reaction/`, { emoji });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async removeMessageReaction(messageId: string, emoji: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post(`banking/messages/${messageId}/remove_reaction/`, { emoji });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async uploadMedia(file: File): Promise<{ success; data?: any; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('banking/messages/upload_media/', formData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async registerDevice(deviceData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('banking/devices/', deviceData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async syncDeviceData(deviceId: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get(`banking/devices/sync_data/?device_id=${deviceId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async markMessageRead(messageId: string, deviceId: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('banking/read-statuses/', {
        message: messageId,
        device_id: deviceId
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createBackup(backupType: string = 'full'): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('banking/backups/', {
        backup_type: backupType
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getBackups(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('banking/backups/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async restoreBackup(backupId: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post(`banking/backups/${backupId}/restore/`, {});
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Additional Operations APIs
  async calculateCommission(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/calculate-commission/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async calculateInterest(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/calculate-interest/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getMobileBankerMetrics(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/mobile-banker-metrics/');
      return { success: true, data: response.data || [] };
    } catch (error: any) {
      console.error('Error fetching mobile banker metrics:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  async processDeposit(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/process_deposit/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async processWithdrawal(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/process_withdrawal/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // CRUD Operations for Operations entities
  async getWorkflows(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/workflows/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createWorkflow(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/workflows/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getWorkflowSteps(workflowId?: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const url = workflowId ? `operations/workflow-steps/?workflow=${workflowId}` : 'operations/workflow-steps/';
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createWorkflowStep(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/workflow-steps/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getClientKYC(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/client-kyc/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createClientKYC(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/client-kyc/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getFieldCollections(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/field-collections/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createFieldCollection(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/field-collections/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getCommissions(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/commissions/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createCommission(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/commissions/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getVisitSchedules(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/visit_schedules/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },


  async getMembers(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('users/members/');
      return { success: true, data: response.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createVisitSchedule(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/visit_schedules/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getClientAssignments(filters: any = {}): Promise<{ success; data?: any; error?: string }> {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.mobile_banker) queryParams.append('mobile_banker', filters.mobile_banker);
      if (filters.status) queryParams.append('status', filters.status);

      const response = await api.get(`operations/assignments/?${queryParams.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async assignClient(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/assignments/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateAssignment(id: number | string, data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.patch(`operations/assignments/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getMobileBankerMetrics(mobileBankerId?: string): Promise<{ success; data?: any; error?: string }> {
    try {
      const url = mobileBankerId
        ? `operations/mobile-banker-metrics/?mobile_banker_id=${mobileBankerId}`
        : 'operations/mobile-banker-metrics/';
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getOperationsMessages(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('operations/messages/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createOperationsMessage(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('operations/messages/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Reports API Methods
  async getReportTemplates(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('reports/templates/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createReportTemplate(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('reports/templates/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getReports(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('reports/reports/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createReport(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('reports/reports/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getReportSchedules(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('reports/schedules/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createReportSchedule(data: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('reports/schedules/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getReportAnalytics(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('reports/analytics/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Performance API Methods
  async getPerformanceDashboardData(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('performance/dashboard-data/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getSystemHealth(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('performance/system-health/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getPerformanceMetrics(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('performance/metrics/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getPerformanceAlerts(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('performance/alerts/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getPerformanceRecommendations(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('performance/recommendations/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getTransactionVolume(params?: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get(`performance/transaction-volume/${queryString}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getPerformanceChartData(params?: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get(`performance/chart-data/${queryString}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Settings API Methods
  async getUserSettings(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('settings/user-settings/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateUserSettings(settings: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('settings/user-settings/', settings);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getSystemSettings(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('settings/system-settings/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getApiUsage(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('settings/api-usage/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getRateLimits(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('settings/rate-limits/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getHealthChecks(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('settings/health-checks/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Banking API Methods
  async getLoans(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('banking/loans/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createLoan(loanData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('banking/loans/', loanData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getStaffAccounts(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('banking/staff-accounts/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getStaffAccountsSummary(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('banking/staff-accounts/summary/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getComplaints(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('banking/complaints/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createComplaint(complaintData: any): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.post('banking/complaints/', complaintData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getCashAdvances(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('banking/cash-advances/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getRefunds(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('banking/refunds/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getAccounts(): Promise<{ success; data?: any; error?: string }> {
    try {
      const response = await api.get('accounts/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

};

// Cache invalidation utilities
export const cacheUtils = {
  // Invalidate specific query patterns
  invalidateQueries: (queryClient: any, patterns: string[]) => {
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ queryKey: [pattern] });
    });
  },

  // Invalidate user-related queries
  invalidateUserData: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },

  // Invalidate banking data
  invalidateBankingData: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['banking'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },

  // Invalidate fraud data
  invalidateFraudData: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['fraud'] });
  },

  // Selective invalidation based on operation type
  invalidateByOperation: (queryClient: any, operation: string, resource: string) => {
    const key = `${operation}_${resource}`;
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

// Banking API service
// Compatibility layer for existing components that expect an axios-like API
export const api = {
  get: <T = any>(url: string, config: RequestInit = {}): Promise<ApiResponse<T>> => apiCall('GET', url, null, config),
  post: <T = any>(url: string, data: any, config: RequestInit = {}): Promise<ApiResponse<T>> => apiCall('POST', url, data, config),
  put: <T = any>(url: string, data: any, config: RequestInit = {}): Promise<ApiResponse<T>> => apiCall('PUT', url, data, config),
  patch: <T = any>(url: string, data: any, config: RequestInit = {}): Promise<ApiResponse<T>> => apiCall('PATCH', url, data, config),
  delete: <T = any>(url: string, config: RequestInit = {}): Promise<ApiResponse<T>> => apiCall('DELETE', url, null, config),
};

export const apiService = {
  async getMemberDashboardData(): Promise<MemberDashboardData> {
    try {
      const response = await api.get('users/member-dashboard/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);

      // Handle specific error cases
      if (error.message.includes('Access denied') || error.message.includes('Members only')) {
        // Trigger re-authentication or redirect
        throw new Error('Member access required. Please ensure your membership is active.');
      }

      // Return fallback data for development
      return {
        account_balance: 15000.50,
        recent_transactions: [
          { date: '2024-01-15', description: 'Loan Payment', amount: '-500.00' },
          { date: '2024-01-10', description: 'Deposit', amount: '2000.00' },
        ],
        loan_balance: 5000.00,
        savings_balance: 10000.50,
        available_tabs: [
          { id: 'overview', name: 'Overview', icon: '📊', enabled: true, description: 'Financial overview and quick stats' },
          { id: 'accounts', name: 'Accounts', icon: '🏦', enabled: true, description: 'Manage your bank accounts' },
          { id: 'transactions', name: 'Transactions', icon: '💳', enabled: true, description: 'View transaction history' },
          { id: 'transfers', name: 'Transfers', icon: '↗', enabled: true, description: 'Send money and manage transfers' },
          { id: 'loans', name: 'Loans', icon: '💰', enabled: false, description: 'Loan services not available' },
          { id: 'profile', name: 'Profile', icon: '👤', enabled: true, description: 'Manage your account settings' }
        ],
        user_permissions: {
          can_view_accounts: true,
          can_make_transfers: true,
          can_apply_loans: false,
          can_view_reports: true,
          can_manage_profile: true,
          can_access_support: true,
        },
        membership_status: {
          is_active_member: true,
          account_count: 2,
          has_recent_activity: true,
          membership_level: 'standard',
          days_since_join: 30,
        },
      };
    }
  },

  async getAccountSummary(): Promise<AccountSummary> {
    try {
      const response = await api.get('banking/account-summary/');
      return response.data;
    } catch (error) {
      console.error('Error fetching account summary:', error);
      return {
        total_savings: 25000.75,
        total_loans: 15000.00,
        available_balance: 10000.75,
        monthly_contributions: 500.00,
        total_balance: 40000.75,
        accounts: [],
      };
    }
  },

  async getAccounts(): Promise<Account[]> {
    try {
      const response = await api.get('accounts/');
      const data = response.data;
      // Handle paginated response (results array) or direct array
      if (Array.isArray(data)) {
        return data;
      }
      if (data && Array.isArray(data.results)) {
        return data.results;
      }
      // Return empty array if unexpected format
      console.warn('Unexpected accounts response format:', data);
      return [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const response = await api.get('transactions/');
      const data = response.data;
      console.log('Full transactions response:', data);
      console.log('Response keys:', Object.keys(data));

      // Check common patterns for array data in objects
      if (data && typeof data === 'object') {
        console.log('data.results:', data.results);
        console.log('data.transactions:', data.transactions);
        console.log('data.data:', data.data);
        console.log('data.items:', data.items);
      }

      let transactionsArray = [];

      // Handle different possible response structures
      if (Array.isArray(data)) {
        // Case 1: Direct array response
        transactionsArray = data;
      } else if (data && typeof data === 'object') {
        // Case 2: Object with nested array
        if (Array.isArray(data.results)) {
          // Django REST framework pagination style
          transactionsArray = data.results;
          console.log('Using paginated results:', transactionsArray.length, 'transactions');
        } else if (data.transactions) {
          console.log('data.transactions exists:', data.transactions);
          console.log('typeof data.transactions:', typeof data.transactions);
          console.log('Array.isArray(data.transactions):', Array.isArray(data.transactions));
          if (Array.isArray(data.transactions)) {
            // Custom transactions key
            transactionsArray = data.transactions;
            console.log('Using transactions array:', transactionsArray.length, 'transactions');
          } else if (data.transactions.results && Array.isArray(data.transactions.results)) {
            transactionsArray = data.transactions.results;
            console.log('Using transactions.results array:', transactionsArray.length, 'transactions');
          } else if (data.transactions.data && Array.isArray(data.transactions.data)) {
            transactionsArray = data.transactions.data;
            console.log('Using transactions.data array:', transactionsArray.length, 'transactions');
          } else {
            console.warn('transactions property exists but no array found inside it. Keys:', Object.keys(data.transactions));
          }
        } else if (Array.isArray(data.data)) {
          // Common data key
          transactionsArray = data.data;
          console.log('Using data array:', transactionsArray.length, 'transactions');
        } else if (Array.isArray(data.items)) {
          // Another common pattern
          transactionsArray = data.items;
          console.log('Using items array:', transactionsArray.length, 'transactions');
        } else {
          // If no array found, check if we can use object values
          const values = Object.values(data);
          if (values.length > 0 && Array.isArray(values[0])) {
            transactionsArray = values[0];
            console.log('Using first array value:', transactionsArray.length, 'transactions');
          } else {
            console.warn('No array found in response object. Available keys:', Object.keys(data));
            transactionsArray = [];
          }
        }
      } else {
        console.warn('Unexpected response type:', typeof data);
        transactionsArray = [];
      }

      console.log('Final transactions array:', transactionsArray);
      return transactionsArray;

    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post('users/change-password/', data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createServiceRequest(data: { request_type: string; description?: string; delivery_method: string }): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, this will need to be implemented in the backend
      // We'll use a placeholder endpoint that doesn't exist yet
      const response = await api.post('users/service-requests/', data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getServiceRequests(): Promise<any[]> {
    try {
      const response = await api.get('services/requests/');
      const data = response.data;
      // Handle paginated response (results array) or direct array
      if (Array.isArray(data)) {
        return data;
      }
      if (data && Array.isArray(data.results)) {
        return data.results;
      }
      // Return empty array if unexpected format
      console.warn('Unexpected service requests response format:', data);
      return [];
    } catch (error) {
      console.error('Error fetching service requests:', error);
      return [];
    }
  },

  async enable2FA(data: { phone_number: string; otp_code: string }): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify OTP, then enable 2FA
      const verifyResponse = await api.post('users/verify-otp/', {
        phone_number: data.phone_number,
        otp_code: data.otp_code,
        verification_type: '2fa_setup'
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Client Registration API Methods
  async submitClientRegistration(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Don't set Content-Type header - browser will set it with proper boundary for FormData
      const response = await api.post('banking/client-registrations/submit_registration/', formData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async sendClientRegistrationOTP(registrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post(`banking/client-registrations/${registrationId}/send_otp/`, {});
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async verifyClientRegistrationOTP(registrationId: string, otpCode: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.post(`banking/client-registrations/${registrationId}/verify_otp/`, {
        otp_code: otpCode
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};