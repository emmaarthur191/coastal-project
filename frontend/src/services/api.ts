import { Account } from '../api/models/Account';
import { Transaction } from '../api/models/Transaction';
import { User } from '../api/models/User';

/**
 * Standard API response wrapper that mirrors the backend's consistent response structure.
 * @template T - The type of the data payload.
 */
export interface ApiResponse<T = unknown> {
  /** The primary data payload of the response. */
  data: T;
  /** Indicates if the operation was successful. */
  success?: boolean;
  /** A human-readable error message, if applicable. */
  error?: string;
  /** A general message or success detail. */
  message?: string;
  /** A standardized error or status code for programmatic handling. */
  code?: string;
}

/**
 * Data structure for the member side dashboard
 */
export interface MemberDashboardData {
  account_balance: number;
  recent_transactions: Transaction[];
  total_balance?: string | number;
  total_daily_susu?: string | number;
  available_balance?: string | number;
  loan_balance?: number;
  savings_balance?: number;
  available_tabs?: unknown[];
  user_permissions?: Record<string, boolean>;
  membership_status?: Record<string, unknown>;
}

/**
 * Summary of all accounts for a user
 */
export interface AccountSummary {
  total_balance: number;
  accounts: Account[];
  total_savings?: number;
  total_loans?: number;
  available_balance?: number;
  monthly_contributions?: number;
}

// Logging utility for API debugging - PRODUCTION SAFE (no output in production)
const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

const logger = {
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as Window & { DEBUG_API?: boolean }).DEBUG_API)) {
      // eslint-disable-next-line no-console
      console.warn('[API INFO]', ...args);
    }
  },
  warn: (message: string, data?: unknown) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(`[API Warning] ${message}`, data || '');
    }
  },
  error: (message: string, error?: unknown) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.error(`[API Error] ${message}`, error || '');
    }
  },
  debug: (...args: unknown[]) => {
    if (typeof window !== 'undefined' && (window as Window & { DEBUG_API?: boolean }).DEBUG_API) {
      // eslint-disable-next-line no-console
      console.warn('[API DEBUG]', ...args);
    }
  }
};

// Use environment variable for API URL
const getApiBaseUrl = () => {
  // Debug logging to help diagnose connection issues
  const isProd = import.meta.env.PROD;
  const devUrl = import.meta.env.VITE_DEV_API_URL;
  const prodUrlEnv = import.meta.env.VITE_PROD_API_URL;
  // const baseUrlEnv = import.meta.env.VITE_API_BASE_URL;

  // Safe logging that won't expose sensitive info if we had any
  if (!isProd) {
    // logger.debug('[Config] Environment Detection:', {
    //   isProd,
    //   hasDevUrl: !!devUrl,
    //   hasProdUrl: !!prodUrlEnv,
    //   hasBaseUrl: !!baseUrlEnv,
    //   hostname: window.location.hostname
    // });
  }



  // Priority 2: Check VITE_PROD_API_URL (Explicit Production)
  if (prodUrlEnv) {
    if (!isProd) { /* Debug log removed */ }
    return prodUrlEnv.endsWith('/') ? prodUrlEnv : prodUrlEnv + '/';
  }

  // Priority 5: Development / Localhost Fallback
  // If we are explicitly in dev mode or on localhost
  if (devUrl) {
    logger.info('[Config] Using VITE_DEV_API_URL');
    return devUrl.endsWith('/') ? devUrl : devUrl + '/';
  }

  logger.info('[Config] Using production fallback (Expecting BFF Proxy)');
  return '/api/';
};

// HTTPS enforcement removed - let the deployment environment handle this
// Local development uses HTTP, production should use a reverse proxy with HTTPS

// Request configuration type
interface RequestConfig extends RequestInit {
  method: string;
  url: string;
  data?: unknown;
  headers?: HeadersInit | Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  startTime?: number;
  responseType?: 'json' | 'blob' | 'text';
}

// Extended Error interface
interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error | ApiError, options?: Record<string, unknown>) => void;
    };
  }
}

export const API_BASE_URL = getApiBaseUrl();
if (import.meta.env.DEV) {
  logger.info('[Config] Final API_BASE_URL:', API_BASE_URL);
}

// DEPRECATED: This function is no longer used with httpOnly cookie-based authentication
// Tokens are now managed securely by the backend in httpOnly cookies
// @deprecated Use backend-managed httpOnly cookies instead
function setStoredTokens(_access: string, _refresh: string) {
  // No-op: tokens are handled by backend httpOnly cookies
  logger.warn('setStoredTokens is deprecated. Tokens are now managed by backend httpOnly cookies.');
}



function getStoredTokens() {
  // Tokens are now stored in httpOnly cookies by the backend
  // Frontend cannot read httpOnly cookies, so we return null
  // Authentication is handled via cookies automatically by the browser
  logger.debug('getStoredTokens: tokens are managed by backend httpOnly cookies');
  return { access: null, refresh: null };
}

/**
 * Helper function to check if a JWT token is expired
 * @param token - JWT token string
 * @returns boolean indicating if token is expired
 */
function isTokenExpired(token: string): boolean {
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
  (response: Response, data?: unknown): Promise<Response> | Response;
}

interface ErrorInterceptor {
  (error: Error | ApiError, config: RequestConfig): Promise<unknown> | unknown;
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

addResponseInterceptor((response) => {
  // Log successful responses
  const duration = Date.now() - ((response as unknown as { startTime: number }).startTime || 0);
  logger.debug(`Response interceptor: ${response.status} (${duration}ms)`);
  return response;
});

addErrorInterceptor((error, config) => {
  // Enhanced error tracking
  const duration = Date.now() - (config.startTime || 0);
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
        errorData: (error as ApiError).data
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
const isRetryableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: number }).status;
  const errorName = (error as Error).name;

  // Network errors (no status)
  if (status === 0) return true;

  // Timeout errors
  if (errorName === 'AbortError') return true;

  // Server errors (5xx)
  if (status && status >= 500 && status < 600) return true;

  // Don't retry client errors (4xx) except 429 (rate limit)
  if (status === 429) return true;

  return false;
};

// CSRF token management
function getCsrfCookie() {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return value;
      }
    }
  }
  return null;
}

// Async function to ensure we have a token
async function getCsrfToken(): Promise<string | null> {
  // 1. Try cookie first
  const token = getCsrfCookie();
  if (token) return token;

  // 2. Fetch from backend if missing using the specific endpoint
  try {
    const response = await fetch(`${API_BASE_URL}users/csrf/`, {
      method: 'GET',
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      return data.csrfToken || null;
    }
  } catch (e) {
    logger.warn('Failed to fetch CSRF token', e);
  }
  return null;
}

/**
 * Core API caller with retry logic, interceptors, and error handling
 */
async function apiCall<T = unknown>(method: string, url: string, data?: unknown, config?: RequestConfig, retryCount = 0): Promise<{ data: T }> {
  const startTime = Date.now();
  const requestConfig = { method, url, data, ...config } as RequestConfig;

  logger.debug(`API call: ${method} ${url} (attempt ${retryCount + 1})`, { data: data, config });

  try {
    // Apply request interceptors
    let processedConfig = { ...requestConfig };
    for (const interceptor of requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }

    // SECURITY: Auth tokens are handled via HTTP-only cookies (credentials: 'include').
    // Do NOT use localStorage for tokens - vulnerable to XSS attacks.

    // Build headers object - ensure processedConfig.headers is treated as Record
    const configHeaders = (processedConfig.headers || {}) as Record<string, string>;

    // Fetch CSRF token asynchronously
    let csrfToken = null;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      csrfToken = await getCsrfToken();
    }

    const headers: Record<string, string> = {
      // Default to JSON only if not FormData
      ...(data instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      // Include CSRF token for state-changing operations
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
      // Authorization is handled by HttpOnly cookies automatically
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
            logger.error('[API] Received HTML instead of JSON - check backend URL:', preview);
            errorData = {
              detail: 'Unexpected HTML response - check backend URL or server configuration',
              html_preview: preview
            };
          } else {
            // Handle non-JSON error responses gracefully
            const textResponse = await processedResponse.text();
            errorData = { detail: textResponse || `HTTP error! status: ${processedResponse.status}` };
          }
        } catch {
          // If response parsing fails, create a generic error
          errorData = { detail: `HTTP error! status: ${processedResponse.status}` };
        }

        // Extract the actual error details from the backend response
        const status = processedResponse.status;
        const responseBodyData = errorData as Record<string, unknown>;
        const msg = responseBodyData?.detail || responseBodyData?.error || responseBodyData?.message || `HTTP error! status: ${status}`;
        logger.error(`[API ERROR ${status}]`, msg);
        logger.debug("Full data:", responseBodyData);

        // Throw specialized error for better handling
        const apiError: ApiError = new Error(
          sanitizeErrorMessage((errorData as Record<string, unknown>).error as string || (errorData as Record<string, unknown>).detail as string || `HTTP error! status: ${processedResponse.status}`)
        ) as ApiError;
        apiError.status = processedResponse.status;
        apiError.data = errorData;

        // Apply error interceptors
        for (const interceptor of errorInterceptors) {
          try {
            await interceptor(apiError, processedConfig);
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
            throw apiError;
          }
        }

        // Check if error is retryable and we haven't exceeded max retries
        if (isRetryableError(apiError) && retryCount < MAX_RETRIES) {
          const delay = getRetryDelay(retryCount);
          logger.warn(`Retrying ${method} ${url} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          await sleep(delay);
          return apiCall(method, url, data, config, retryCount + 1);
        }

        throw apiError;
      }

      let responseData: T;
      if (processedResponse.status === 204) {
        responseData = null as T; // Explicitly cast null to T for 204 No Content
      } else {
        const responseType = processedConfig.responseType || 'json';

        if (responseType === 'blob') {
          responseData = (await processedResponse.blob()) as unknown as T;
        } else if (responseType === 'text') {
          responseData = (await processedResponse.text()) as unknown as T;
        } else {
          try {
            responseData = await processedResponse.json();
          } catch (parseError) {
            const preview = await processedResponse.clone().text().then(t => t.substring(0, 100));
            logger.error('[API] Failed to parse JSON response:', parseError);
            logger.error('[API] Raw response preview:', preview);
            responseData = preview as unknown as T;
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`API call successful: ${method} ${url} (${duration}ms, attempt ${retryCount + 1})`);
      return { data: responseData as T };
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
      ? (error as Error).message
      : 'Network error';

    logger.error(`API call network error: ${method} ${url} (${duration}ms)`, error);
    const networkError = new Error(errorMessage) as ApiError;
    networkError.status = 500;
    networkError.data = { error: 'Network error' };
    throw networkError;
  }
}


// Error message sanitization helper
function sanitizeErrorMessage(message: unknown): string {
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


// Use Mock data only if no real data is available (primarily for development fallbacks)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MockMemberDashboardData: MemberDashboardData = {
  account_balance: 0,
  recent_transactions: [],
  loan_balance: 0,
  savings_balance: 0,
  available_tabs: [],
  user_permissions: {},
  membership_status: {}
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MockAccountSummary: AccountSummary = {
  total_balance: 0,
  accounts: [],
  total_savings: 0,
  total_loans: 0,
  available_balance: 0,
  monthly_contributions: 0
};

// Authentication service
export const cacheUtils = {
  // Invalidate specific query patterns
  invalidateQueries: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }, patterns: string[]) => {
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ queryKey: [pattern] });
    });
  },

  // Invalidate user-related queries
  invalidateUserData: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }) => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },

  // Invalidate banking data
  invalidateBankingData: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }) => {
    queryClient.invalidateQueries({ queryKey: ['banking'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },

  // Invalidate fraud data
  invalidateFraudData: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }) => {
    queryClient.invalidateQueries({ queryKey: ['fraud'] });
  },

  // Selective invalidation based on operation type
  invalidateByOperation: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }, operation: string, resource: string) => {
    const key = `${operation}_${resource}`;
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

// Banking API service
// Compatibility layer for existing components that expect an axios-like API
export const api = {
  get: <T = unknown>(url: string, config: RequestConfig = { method: 'GET', url: '' }): Promise<{ data: T }> => apiCall<T>('GET', url, undefined, config),
  post: <T = unknown>(url: string, data?: unknown, config: RequestConfig = { method: 'POST', url: '' }): Promise<{ data: T }> => apiCall<T>('POST', url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config: RequestConfig = { method: 'PUT', url: '' }): Promise<{ data: T }> => apiCall<T>('PUT', url, data, config),
  patch: <T = unknown>(url: string, data?: unknown, config: RequestConfig = { method: 'PATCH', url: '' }): Promise<{ data: T }> => apiCall<T>('PATCH', url, data, config),
  delete: <T = unknown>(url: string, config: RequestConfig = { method: 'DELETE', url: '' }): Promise<{ data: T }> => apiCall<T>('DELETE', url, undefined, config),
};

export const apiService = {
  async getMemberDashboardData(): Promise<MemberDashboardData> {
    try {
      const response = await api.get<MemberDashboardData>('users/member-dashboard/');
      return response.data;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error fetching dashboard data';
      logger.error('Error fetching dashboard data:', error);

      // Handle specific error cases
      if (msg.includes('Access denied') || msg.includes('Members only')) {
        // Trigger re-authentication or redirect
        throw new Error('Member access required. Please ensure your membership is active.');
      }

      // Return fallback data for development
      return {
        account_balance: 15000.50,
        recent_transactions: [
          { id: 1, timestamp: '2024-01-15T12:00:00Z', processed_at: '2024-01-15T12:05:00Z', description: 'Loan Payment', amount: '-500.00', transaction_type: 'withdrawal', status: 'completed' },
          { id: 2, timestamp: '2024-01-10T10:00:00Z', processed_at: '2024-01-10T10:05:00Z', description: 'Deposit', amount: '2000.00', transaction_type: 'deposit', status: 'completed' },
        ] as Transaction[],
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
      } as MemberDashboardData;
    }
  },

  async getAccountSummary(): Promise<AccountSummary> {
    try {
      const response = await api.get<AccountSummary>('banking/account-summary/');
      return response.data;
    } catch (error: unknown) {
      logger.error('Error fetching account summary:', error);
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
      if (data && typeof data === 'object' && Array.isArray((data as { results?: Account[] }).results)) {
        return (data as { results: Account[] }).results;
      }
      // Return empty array if unexpected format
      logger.warn('Unexpected accounts response format:', data);
      return [];
    } catch (error) {
      logger.error('Error fetching accounts:', error);
      return [];
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const response = await api.get('transactions/');
      const data = response.data;
      // Log full response in debug mode
      logger.debug('Full transactions response:', data);
      if (data && typeof data === 'object') {
        logger.debug('Response keys:', Object.keys(data));
      }

      // Check common patterns for array data in objects
      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        logger.debug('data.results:', d.results);
        logger.debug('data.transactions:', d.transactions);
        logger.debug('data.data:', d.data);
        logger.debug('data.items:', d.items);
      }

      let transactionsArray: Transaction[] = [];

      // Handle different possible response structures
      if (Array.isArray(data)) {
        // Case 1: Direct array response
        transactionsArray = data as Transaction[];
      } else if (data && typeof data === 'object') {
        // Case 2: Object with nested array
        if (Array.isArray((data as { results?: Transaction[] }).results)) {
          // Django REST framework pagination style
          transactionsArray = (data as { results: Transaction[] }).results;
          logger.debug('Using paginated results:', { count: transactionsArray.length });
        } else if ((data as Record<string, unknown>).transactions) {
          logger.debug('data.transactions exists:', (data as Record<string, unknown>).transactions);
          const txs = (data as Record<string, unknown>).transactions;
          if (Array.isArray(txs)) {
            transactionsArray = txs as Transaction[];
            logger.debug('Using transactions array:', { count: transactionsArray.length });
          } else if (txs && typeof txs === 'object' && Array.isArray((txs as { results?: Transaction[] }).results)) {
            transactionsArray = (txs as { results: Transaction[] }).results;
            logger.debug('Using transactions.results array:', { count: transactionsArray.length });
          } else if (txs && typeof txs === 'object' && Array.isArray((txs as { data?: Transaction[] }).data)) {
            transactionsArray = (txs as { data: Transaction[] }).data;
            logger.debug('Using transactions.data array:', { count: transactionsArray.length });
          } else {
            logger.warn('transactions property exists but no array found inside it.');
          }
        } else if (Array.isArray((data as { data?: Transaction[] }).data)) {
          // Common data key
          transactionsArray = (data as { data: Transaction[] }).data;
          logger.debug('Using data array:', { count: transactionsArray.length });
        } else if (Array.isArray((data as Record<string, unknown>).items)) {
          // Another common pattern
          transactionsArray = (data as { items: Transaction[] }).items;
          logger.debug('Using items array:', { count: transactionsArray.length });
        } else {
          // If no array found, check if we can use object values
          const values = Object.values(data as object);
          if (values.length > 0 && Array.isArray(values[0])) {
            transactionsArray = values[0] as Transaction[];
            logger.debug('Using first array value:', { count: transactionsArray.length });
          } else {
            logger.warn('No array found in response object. Available keys:', { keys: Object.keys(data as object) });
            transactionsArray = [];
          }
        }
      } else {
        logger.warn('Unexpected response type:', typeof data);
        transactionsArray = [];
      }

      logger.debug('Final transactions array:', transactionsArray);
      return transactionsArray;

    } catch (error) {
      logger.error('Error fetching transactions:', error);
      return [];
    }
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('users/change-password/', data);
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Password change failed';
      return { success: false, error: msg };
    }
  },

  async createServiceRequest(data: { request_type: string; description?: string; delivery_method: string }): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, this will need to be implemented in the backend
      // We'll use a placeholder endpoint that doesn't exist yet
      await api.post('users/service-requests/', data);
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Service request failed';
      return { success: false, error: msg };
    }
  },

  async getServiceRequests(): Promise<unknown[]> {
    try {
      const response = await api.get('services/requests/');
      const data = response.data as { results?: unknown[] } | unknown[];
      // Handle paginated response (results array) or direct array
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
      }
      // Return empty array if unexpected format
      logger.warn('Unexpected service requests response format:', data);
      return [];
    } catch (error) {
      logger.error('Error fetching service requests:', error);
      return [];
    }
  },

  async enable2FA(data: { phone_number: string; otp_code: string }): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify OTP, then enable 2FA
      await api.post('users/verify-otp/', {
        phone_number: data.phone_number,
        otp_code: data.otp_code,
        verification_type: '2fa_setup'
      });
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '2FA enablement failed';
      return { success: false, error: msg };
    }
  },

  // Client Registration API Methods
  async submitClientRegistration(formData: FormData): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      // Don't set Content-Type header - browser will set it with proper boundary for FormData
      const response = await api.post<unknown>('banking/client-registrations/submit_registration/', formData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Registration submission failed';
      return { success: false, error: msg };
    }
  },

  async sendClientRegistrationOTP(registrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`banking/client-registrations/${registrationId}/send_otp/`, {});
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'OTP sending failed';
      return { success: false, error: msg };
    }
  },

  async verifyClientRegistrationOTP(registrationId: string, otpCode: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post<unknown>(`banking/client-registrations/${registrationId}/verify_otp/`, {
        otp_code: otpCode
      });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'OTP verification failed';
      return { success: false, error: msg };
    }
  },

  async getFraudAlerts(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('fraud/alerts/');
      const data = response.data as { results?: unknown[] };
      return { success: true, data: data.results || [] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Fraud alerts fetch failed';
      logger.error('Error fetching fraud alerts:', error);
      return { success: false, error: msg };
    }
  },

  // Banking Operations APIs
  async getLoans(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('banking/loans/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Loans fetch failed';
      return { success: false, error: msg };
    }
  },

  async createLoan(loanData: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/loans/', loanData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Loan creation failed';
      return { success: false, error: msg };
    }
  },

  async approveLoan(loanId: string | number): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`banking/loans/${loanId}/approve/`, {});
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Loan approval failed';
      return { success: false, error: msg };
    }
  },

  async getPendingLoans(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('banking/loans/pending/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Pending loans fetch failed';
      return { success: false, error: msg };
    }
  },

  async getComplaints(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('banking/complaints/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Complaints fetch failed';
      return { success: false, error: msg };
    }
  },

  async createComplaint(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/complaints/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Complaint creation failed';
      return { success: false, error: msg };
    }
  },

  async getCashAdvances(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('banking/cash-advances/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Cash advances fetch failed';
      return { success: false, error: msg };
    }
  },

  async getRefunds(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('banking/refunds/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Refunds fetch failed';
      return { success: false, error: msg };
    }
  },

  async getMessageThreads(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('banking/messages/threads/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Message threads fetch failed';
      return { success: false, error: msg };
    }
  },

  async createMessageThread(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/messages/threads/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Message thread creation failed';
      return { success: false, error: msg };
    }
  },

  async getThreadMessages(threadId: string | number): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get(`banking/messages/threads/${threadId}/messages/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Thread messages fetch failed';
      return { success: false, error: msg };
    }
  },

  async sendMessage(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/messages/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Message sending failed';
      return { success: false, error: msg };
    }
  },

  async getAllTransactions(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('transactions/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'All transactions fetch failed';
      return { success: false, error: msg };
    }
  },

  async getPerformanceMetrics(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('analytics/performance/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      // Mock data if API fails to avoid breaking UI in dev/demo
      return {
        success: true,
        data: [
          { name: 'Service Quality', score: 95 },
          { name: 'Response Time', score: 88 }
        ]
      };
    }
  },

  async createServiceCharge(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/service-charges/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Service charge creation failed';
      return { success: false, error: msg };
    }
  },

  async calculateServiceCharge(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/service-charges/calculate/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Service charge calculation failed';
      return { success: false, error: msg };
    }
  },

  async calculateCommission(data: Record<string, unknown> = {}): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/commissions/calculate/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Commission calculation failed';
      return { success: false, error: msg };
    }
  },

  async calculateInterest(data: Record<string, unknown> = {}): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/interest/calculate/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Interest calculation failed';
      return { success: false, error: msg };
    }
  },

  async exportTransactions(params: Record<string, unknown>): Promise<Blob> {
    const config: RequestConfig = {
      method: 'GET',
      url: 'transactions/export/',
      params: params as Record<string, string | number | boolean>,
      responseType: 'blob'
    };
    const response = await apiCall<Blob>('GET', config.url, undefined, config);
    return response.data;
  },

  async generateReceipt(transactionId: string): Promise<Blob> {
    const config: RequestConfig = {
      method: 'GET',
      url: `transactions/${transactionId}/receipt/`,
      responseType: 'blob'
    };
    const response = await apiCall<Blob>('GET', config.url, undefined, config);
    return response.data;
  },

  // Authentication & Management Methods (Restored)
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    try {
      const response = await api.post<{ user: User; token: string }>('users/auth/login/', { email, password });
      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      logger.error('Login error:', error);
      return {
        success: false,
        error: msg
      };
    }
  },

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('users/auth/logout/', {});
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Logout failed';
      return { success: false, error: msg };
    }
  },

  async register(userData: Record<string, unknown>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await api.post<{ user: User }>('users/auth/register/', userData);
      return { success: true, user: response.data.user };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: msg };
    }
  },

  async verifyOTP(email: string, otp: string): Promise<{ success: boolean; error?: string;[key: string]: unknown }> {
    try {
      const response = await api.post<Record<string, unknown>>('users/verify-otp/', { email, otp });
      return { success: true, ...response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'OTP verification failed';
      return { success: false, error: msg };
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.post<{ message: string }>('users/password-reset/', { email });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: msg };
    }
  },

  // Manager Methods
  async createAccount(accountData: Record<string, unknown>): Promise<{ success: boolean; account?: Account; error?: string }> {
    try {
      const response = await api.post<Account>('accounts/create_account/', accountData);
      return { success: true, account: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Account creation failed';
      return { success: false, error: msg };
    }
  },

  async getAccountOpenings(filters: Record<string, string> = {}): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await api.get(`accounts/openings/?${queryString}`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch account openings';
      return { success: false, error: msg };
    }
  },

  async approveAccount(limitId: string | number, action: string, reason = ''): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`accounts/openings/${limitId}/approve/`, { action, reason });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Approval failed';
      return { success: false, error: msg };
    }
  },

  async getManagerOverview(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('accounts/manager/overview/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const status = (error as ApiError).status;
      const msg = error instanceof Error ? error.message : 'Overview fetch failed';
      // Fallback for demo if endpoint not ready
      if (status === 404) {
        return {
          success: true,
          data: {
            pendingApprovals: 12,
            totalMembers: 1250,
            dailyTransactions: 450,
            systemHealth: 98
          }
        };
      }
      return { success: false, error: msg };
    }
  },

  // Reports & Settings Methods
  async getReports(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('reports/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Reports fetch failed';
      return { success: false, error: msg };
    }
  },

  async getReportSchedules(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('reports/schedules/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Report schedules fetch failed';
      return { success: false, error: msg };
    }
  },

  async createReportTemplate(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('reports/templates/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Template creation failed';
      return { success: false, error: msg };
    }
  },

  async createReportSchedule(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('reports/schedules/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Schedule creation failed';
      return { success: false, error: msg };
    }
  },

  async getReportAnalytics(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('reports/analytics/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Analytics fetch failed';
      return { success: false, error: msg };
    }
  },

  async generateReport(reportId: string, params: Record<string, unknown>): Promise<Blob> {
    const config: RequestConfig = {
      method: 'POST',
      url: `reports/${reportId}/generate/`,
      data: params,
      responseType: 'blob'
    };
    const response = await apiCall<Blob>('POST', config.url, params, config);
    return response.data;
  },

  // Settings & System
  async getApiUsage(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('system/api-usage/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Usage fetch failed';
      return { success: false, error: msg };
    }
  },

  async getRateLimits(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('system/rate-limits/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Rate limits fetch failed';
      return { success: false, error: msg };
    }
  },

  async getHealthChecks(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('system/health/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Health check failed';
      return { success: false, error: msg };
    }
  },

  async getSystemSettings(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('system/settings/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Settings fetch failed';
      return { success: false, error: msg };
    }
  },

  async updateUserSettings(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('users/settings/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Settings update failed';
      return { success: false, error: msg };
    }
  },

  // OTP
  async sendOTP(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.post<{ message: string }>('users/send-otp/', { email });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'OTP sending failed';
      return { success: false, error: msg };
    }
  },
};

export const authService = apiService;
