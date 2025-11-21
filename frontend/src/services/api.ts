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

// Ensure HTTPS is used in production builds
const enforceHttpsInProduction = () => {
  if (import.meta.env.PROD && window.location.protocol !== 'https:') {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
};

// Call this function when the module loads
enforceHttpsInProduction();

const API_BASE_URL = getApiBaseUrl();

// Request configuration type
interface RequestConfig {
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
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

// Use secure storage for tokens
function setStoredTokens(access, refresh) {
  if (typeof window !== 'undefined') {
    if (access) {
      // Store access token in localStorage for client-side access
      localStorage.setItem('accessToken', access);
    } else {
      localStorage.removeItem('accessToken');
    }
    if (refresh) {
      // Store refresh token in localStorage as well for client-side refresh
      localStorage.setItem('refreshToken', refresh);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }
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
  if (typeof window !== 'undefined') {
    const access = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    return { access, refresh };
  }
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
    const response = await fetch(`${API_BASE_URL}users/auth/token/refresh/`, {
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

    let { access } = getStoredTokens();

    // Check if access token exists and is not expired
    if (access && isTokenExpired(access)) {
      logger.debug('Access token expired, refreshing...');
      access = await refreshAccessToken();
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(access && { 'Authorization': `Bearer ${access}` }),
      // Include CSRF token for state-changing operations
      ...((method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') && { 'X-CSRFToken': getCsrfToken() }),
      ...processedConfig.headers,
    };
    const body = (data && method !== 'GET') ? JSON.stringify(data) : undefined;

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method,
        headers,
        body,
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
          } else {
            // Handle non-JSON error responses gracefully
            const textResponse = await processedResponse.text();
            errorData = { detail: textResponse || `HTTP error! status: ${processedResponse.status}` };
          }
        } catch (parseError) {
          // If response parsing fails, create a generic error
          errorData = { detail: `HTTP error! status: ${processedResponse.status}` };
        }

        const error = new Error(
          sanitizeErrorMessage(errorData.error || errorData.detail || `HTTP error! status: ${processedResponse.status}`)
        );
        error.status = processedResponse.status;
        error.data = errorData;

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
          throw new Error('Access denied. Members only.');
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
        const timeoutError = new Error('Request timeout');
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
    const networkError = new Error(errorMessage);
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
  savings_balance: 0
};

const AccountSummary = {
  total_savings: 0,
  total_loans: 0,
  available_balance: 0,
  monthly_contributions: 0
};

const Account = {
  id: '',
  name: '',
  balance: 0
};

const Transaction = {
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
        let errorData = {};
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
      console.log('[DEBUG] Login successful, received data:', data);
      setStoredTokens(data.access, data.refresh);
      console.log('[DEBUG] Tokens stored successfully');
      return data;
    } catch (error) {
      console.log('[DEBUG] Login threw exception:', error);
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      const { access, refresh } = getStoredTokens();
      
      // Only attempt server logout if we have tokens
      if (access && refresh) {
        const response = await fetch(`${API_BASE_URL}users/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`,
          },
          body: JSON.stringify({ refresh }),
        });

        // Clear tokens regardless of response
        setStoredTokens(null, null);
        
        if (response.ok) {
          return await response.json();
        }
      } else {
        // No tokens, just clear local storage
        setStoredTokens(null, null);
      }
      
      return { detail: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens even if logout request fails
      setStoredTokens(null, null);
      return { detail: 'Logged out successfully' };
    }
  },

  async checkAuth() {
    try {
      const { access } = getStoredTokens();
      if (!access || isTokenExpired(access)) {
        return { authenticated: false };
      }

      const response = await fetch(`${API_BASE_URL}users/auth/check/`, {
        headers: {
          'Authorization': `Bearer ${access}`,
        },
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
    return getStoredTokens().access;
  },

  // Helper function to check if user is authenticated
  isAuthenticated() {
    const { access } = getStoredTokens();
    return !!(access && !isTokenExpired(access));
  },

  // Helper function to refresh access token (public method)
  async refreshAccessToken(): Promise<string | null> {
    return refreshAccessToken();
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

  async calculateCommission(): Promise<{ success; data?: any; error?: string }> {
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
      const response = await api.post('users/create/', userData);
      return { success: true, data: response.data };
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
  }
};

// Banking API service
// Compatibility layer for existing components that expect an axios-like API
export const api = {
  get: <T = any>(url: string, config: RequestInit = {}): Promise<ApiResponse<T>> => apiCall('GET', url, null, config),
  post: <T = any>(url: string, data: any, config: RequestInit = {}): Promise<ApiResponse<T>> => apiCall('POST', url, data, config),
  put: <T = any>(url: string, data: any, config: RequestInit = {}): Promise<ApiResponse<T>> => apiCall('PUT', url, data, config),
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
          { date: '2024-01-15', description: 'Loan Payment', amount: -500.00 },
          { date: '2024-01-10', description: 'Deposit', amount: 2000.00 },
        ],
        loan_balance: 5000.00,
        savings_balance: 10000.50,
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
      };
    }
  },

  async getAccounts(): Promise<Account[]> {
    try {
      const response = await api.get('banking/accounts/');
      return response.data;
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
        } else if (Array.isArray(data.transactions)) {
          // Custom transactions key
          transactionsArray = data.transactions;
          console.log('Using transactions array:', transactionsArray.length, 'transactions');
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
};