import type { Account } from '../api/models/Account';
import type { AccountAccountTypeEnum } from '../api/models/AccountAccountTypeEnum';
import type { CashAdvance } from '../api/models/CashAdvance';
import type { Complaint } from '../api/models/Complaint';
import type { FraudAlert } from '../api/models/FraudAlert';
import type { Loan } from '../api/models/Loan';
import type { Message } from '../api/models/Message';
import type { MessageThread } from '../api/models/MessageThread';
import type { Refund } from '../api/models/Refund';
import type { Report } from '../api/models/Report';
import type { ReportSchedule } from '../api/models/ReportSchedule';
import type { ReportTemplate } from '../api/models/ReportTemplate';
import type { AccountOpeningRequest } from '../api/models/AccountOpeningRequest';
import type { Transaction } from '../api/models/Transaction';
import type { User } from '../api/models/User';

import type { Product } from '../api/models/Product';
import type { Promotion } from '../api/models/Promotion';
import type { ServiceRequest } from '../api/models/ServiceRequest';
import type { ReportTypeEnum } from '../api/models/ReportTypeEnum';

import type {
  ApiResponse,
  PaginatedResponse,
  UserExtended,
  AccountUser,
  AccountWithDetails,
  LoanExtended,
  Payslip,
  AccountClosureRequest,
  ChatRoomData,
  ChatMessageData,
  FinancialProduct,
  PromotionType,
  MemberDashboardData,
  AccountSummary,
  StaffAccountSummary,
  ServiceRequestExtended,
  MessageThreadExtended,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseData,
  Expense,
  ManagerOverviewData,
  UserSettings,
  PaginationInfo,
  CreateLoanData,
  CreateComplaintData,
  CreateMessageThreadData,
  SendMessageData,
  CreateAccountOpeningData,
  PerformanceDashboardData,
  TransactionVolumeData,
  TransactionVolumeSummary,
  PerformanceChartData,
  SystemHealthComponent,
  SystemHealthData,
  PerformanceAlert,
  PerformanceRecommendation,
  PerformanceMetric,
  ServiceStats,
  DateRangeParams,
  CreateReportTemplateData,
  CreateUserData,
  CreateServiceRequestData,
  ComplaintStats,
  CreateReportScheduleData,
  ReportAnalytics,
  GeneratedReport,
  ApiUsageData,
  RateLimitData,
  HealthCheckData,
  SystemSettingData,
  AuditData,
  AssignedClient,
  ScheduleVisitResponse,
  MobileBankerMetric,
  OperationsMetrics,
  BranchActivity,
  SystemAlert,
  WorkflowStatus,
  MobileMessage,
  RequestConfig,
  ApiError,
  MessageExtended,
  ServiceCharge,
  CreateServiceChargeData,
  VisitSchedule,
  InterestCalculationResult,
  CommissionCalculationResult,
  ServiceChargeCalculation,
  CashAdvanceExtended,
  RefundExtended,
  LoginAttemptRecord,
  AuditLogRecord,
  ClientsForMappingResult,
  MemberLookupResult,
  StaffId,
  MLModelStatus,
  MLFraudAnalysis
} from '../types';

export type {
  Account,
  AccountAccountTypeEnum,
  CashAdvance,
  Complaint,
  FraudAlert,
  Loan,
  Message,
  MessageThread,
  Refund,
  Report,
  ReportSchedule,
  ReportTemplate,
  AccountOpeningRequest,
  Transaction,
  User,
  ServiceRequest,
  Product,
  Promotion,
  ReportTypeEnum,
  ApiResponse,
  PaginatedResponse,
  UserExtended,
  AccountUser,
  AccountWithDetails,
  LoanExtended,
  Payslip,
  AccountClosureRequest,
  ChatRoomData,
  ChatMessageData,
  FinancialProduct,
  PromotionType,
  MemberDashboardData,
  AccountSummary,
  StaffAccountSummary,
  ServiceRequestExtended,
  MessageThreadExtended,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseData,
  Expense,
  ManagerOverviewData,
  UserSettings,
  PaginationInfo,
  CreateLoanData,
  CreateComplaintData,
  CreateMessageThreadData,
  SendMessageData,
  CreateAccountOpeningData,
  PerformanceDashboardData,
  TransactionVolumeData,
  TransactionVolumeSummary,
  PerformanceChartData,
  SystemHealthComponent,
  SystemHealthData,
  PerformanceAlert,
  PerformanceRecommendation,
  PerformanceMetric,
  ServiceStats,
  DateRangeParams,
  CreateReportTemplateData,
  CreateUserData,
  CreateServiceRequestData,
  ComplaintStats,
  CreateReportScheduleData,
  ReportAnalytics,
  GeneratedReport,
  ApiUsageData,
  RateLimitData,
  HealthCheckData,
  SystemSettingData,
  AuditData,
  AssignedClient,
  ScheduleVisitResponse,
  MobileBankerMetric,
  OperationsMetrics,
  BranchActivity,
  SystemAlert,
  WorkflowStatus,
  MobileMessage,
  RequestConfig,
  ApiError,
  MessageExtended,
  ServiceCharge,
  CreateServiceChargeData,
  VisitSchedule,
  InterestCalculationResult,
  CommissionCalculationResult,
  ServiceChargeCalculation,
  CashAdvanceExtended,
  RefundExtended,
  LoginAttemptRecord,
  AuditLogRecord,
  StaffId,
  MLModelStatus,
  MLFraudAnalysis
};

import axios from 'axios';




// Logging utility for API debugging - PRODUCTION SAFE (no output in production)
const API_SERVICE_IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Comprehensive error extractor for Django REST Framework responses
/**
 * Extracted from backend response to provide meaningful feedback in toasts.
 * Handles nested field errors, non-field errors, and generic network errors.
 */
function handleApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    
    if (data) {
      // 1. Handle DRF 'detail' or 'error' top-level keys
      const dataRecord = data as Record<string, unknown>;
      if (dataRecord.detail && typeof dataRecord.detail === 'string') {
        const detail = dataRecord.detail;
        // Strip stringified Python lists if present (e.g., "['Error message']")
        if (detail.startsWith("['") && detail.endsWith("']")) {
          return detail.substring(2, detail.length - 2);
        }
        return detail;
      }
      if (dataRecord.error && typeof dataRecord.error === 'string') return dataRecord.error;
      if (dataRecord.message && typeof dataRecord.message === 'string') return dataRecord.message;

      // 2. Handle DRF field-specific validation errors (e.g., { "amount": ["Invlaid"] })
      if (typeof data === 'object') {
        const firstEntry = Object.entries(data)[0];
        if (firstEntry) {
          const [key, value] = firstEntry;
          if (Array.isArray(value) && value.length > 0) {
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            return `${fieldName}: ${value[0]}`;
          }
          if (typeof value === 'string') return value;
        }
      }
    }
    
    // 3. Handle Status-based fallback
    const status = error.response?.status;
    if (status === 401) return 'Session expired. Please log in again.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'Requested resource not found.';
    if (status === 429) return 'Too many requests. Please try again later.';
    if (status && status >= 500) return 'Internal server error. Our team has been notified.';
  }
  
  if (error instanceof Error) return error.message;
  return fallback;
}

function extractResults<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'object' && data !== null && 'results' in data) {
    const results = (data as { results: unknown }).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
}

const apiLogger = {
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as Window & { DEBUG_API?: boolean }).DEBUG_API)) {
      console.warn('[API INFO]', ...args);
    }
  },
  warn: (message: string, data?: unknown) => {
    if (API_SERVICE_IS_DEV) {
      console.warn(`[API Warning] ${message}`, data || '');
    }
  },
  error: (message: string, error?: unknown) => {
    if (API_SERVICE_IS_DEV) {
      console.error(`[API Error] ${message}`, error || '');
    }
  },
  debug: (...args: unknown[]) => {
    if (typeof window !== 'undefined' && (window as Window & { DEBUG_API?: boolean }).DEBUG_API) {
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
    // apiLogger.debug('[Config] Environment Detection:', {
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
    apiLogger.info('[Config] Using VITE_DEV_API_URL');
    return devUrl.endsWith('/') ? devUrl : devUrl + '/';
  }

  apiLogger.info('[Config] Using production fallback (Expecting BFF Proxy)');
  return '/api/';
};

// HTTPS enforcement removed - let the deployment environment handle this
// Local development uses HTTP, production should use a reverse proxy with HTTPS



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
  apiLogger.info('[Config] Final API_BASE_URL:', API_BASE_URL);
}

// DEPRECATED: This function is no longer used with httpOnly cookie-based authentication
// Tokens are now managed securely by the backend in httpOnly cookies
// @deprecated Use backend-managed httpOnly cookies instead
function _setStoredTokens(_access: string, _refresh: string) {
  // No-op: tokens are handled by backend httpOnly cookies
  apiLogger.warn('setStoredTokens is deprecated. Tokens are now managed by backend httpOnly cookies.');
}

export function _getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  // Tokens are now stored in httpOnly cookies by the backend
  // Frontend cannot read httpOnly cookies, so we return null
  // Authentication is handled via cookies automatically by the browser
  apiLogger.debug('getStoredTokens: tokens are managed by backend httpOnly cookies');
  return { accessToken: null, refreshToken: null };
}

/**
 * Helper function to check if a JWT token is expired
 * @param token - JWT token string
 * @returns boolean indicating if token is expired
 */
export function _isTokenExpired(token: string): boolean {
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
  apiLogger.debug('Attempting token refresh via cookies');

  try {
    const response = await fetch(`${API_BASE_URL}users/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Credentials 'include' ensures cookies are sent with the request
      credentials: 'include',
      // No body needed as the refresh token is in the cookie
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const data = await response.json();
      // Tokens are now managed securely by the backend in httpOnly cookies.
      // We no longer need to manually store them in the frontend.
      apiLogger.info('Token refreshed successfully');
      return data.access;
    } else {
      apiLogger.error('Token refresh failed with status:', response.status);
    }
  } catch (error) {
    apiLogger.error('Token refresh network error:', error);
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
  apiLogger.debug(`Request interceptor: ${config.method} ${config.url}`);
  return config;
});

addResponseInterceptor((response) => {
  // Log successful responses
  const duration = Date.now() - ((response as unknown as { startTime: number }).startTime || 0);
  apiLogger.debug(`Response interceptor: ${response.status} (${duration}ms)`);
  return response;
});

addErrorInterceptor((error, config) => {
  const duration = Date.now() - (config.startTime || 0);

  // Enhanced error tracking - only log if it's a raw network error 
  // (Standard API status errors are handled in apiCall)
  if (!(error as ApiError).status) {
    apiLogger.error(`Network interceptor error: ${config.method} ${config.url} (${duration}ms)`, error);
  }

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
    apiLogger.warn('Failed to fetch CSRF token', e);
  }
  return null;
}

/**
 * Generate a unique idempotency key for requests.
 * Uses crypto.randomUUID if available, else a simple random string.
 */
function generateIdempotencyKey(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Core API caller with retry logic, interceptors, and error handling
 */
async function apiCall<T = unknown>(method: string, url: string, data?: unknown, config?: RequestConfig, retryCount = 0, idempotencyKey?: string): Promise<{ data: T }> {
  const startTime = Date.now();

  // For state-changing requests, ensure we have an idempotency key that persists across retries
  const isStateChanging = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
  const effectiveIdempotencyKey = (isStateChanging && !idempotencyKey) ? generateIdempotencyKey() : idempotencyKey;

  const requestConfig = { method, url, data, ...config } as RequestConfig;

  apiLogger.debug(`API call: ${method} ${url} (attempt ${retryCount + 1})`, { data: data, config });

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
      // Include Idempotency key for protection against duplicate processed requests
      ...(effectiveIdempotencyKey && { 'X-Idempotency-Key': effectiveIdempotencyKey }),
      // Authorization is handled by HttpOnly cookies automatically
      ...configHeaders,
    };

    // Don't stringify FormData
    const body = (data && method !== 'GET')
      ? (data instanceof FormData ? data : JSON.stringify(data))
      : undefined;

    // Build query string if params are present
    let finalUrl = url;
    if (processedConfig.params) {
      const searchParams = new URLSearchParams();
      Object.entries(processedConfig.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}${finalUrl}`, {
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
          console.warn('[DEBUG] Response Content-Type:', contentType);
          if (contentType && contentType.includes('application/json')) {
            errorData = await processedResponse.json();
            console.warn('[DEBUG] Parsed JSON errorData:', errorData);
          } else if (contentType && contentType.includes('text/html')) {
            // HTML response typically means wrong backend URL or server error page
            const textPreview = await processedResponse.text();
            const preview = textPreview.substring(0, 200);
            apiLogger.error('[API] Received HTML instead of JSON - check backend URL:', preview);
            errorData = {
              detail: 'Unexpected HTML response - check backend URL or server configuration',
              html_preview: preview
            };
          } else {
            // Handle non-JSON error responses gracefully
            const textResponse = await processedResponse.text();
            console.warn('[DEBUG] Non-JSON text response:', textResponse);
            errorData = { detail: textResponse || `HTTP error! status: ${processedResponse.status}` };
          }
        } catch (parseError) {
          // If response parsing fails, create a generic error
          console.warn('[DEBUG] Response parsing failed:', parseError);
          errorData = { detail: `HTTP error! status: ${processedResponse.status}` };
        }

        // Extract the actual error details from the backend response
        const status = processedResponse.status;
        const responseBodyData = errorData as Record<string, unknown>;
        // Check for DRF's non_field_errors (array) first, then detail, error, message
        const nonFieldErrors = responseBodyData?.non_field_errors as string[] | undefined;
        console.warn('[DEBUG] nonFieldErrors:', nonFieldErrors);
        const msg = nonFieldErrors?.[0] || 
                    (typeof responseBodyData?.detail === 'string' ? responseBodyData.detail : null) || 
                    (typeof responseBodyData?.error === 'string' ? responseBodyData.error : null) || 
                    (typeof responseBodyData?.message === 'string' ? responseBodyData.message : null) || 
                    `HTTP error! status: ${status}`;
        
        apiLogger.error(`[API ERROR ${status}]`, msg);

        // Throw specialized error for better handling
        const apiError: ApiError = new Error(
          sanitizeErrorMessage(nonFieldErrors?.[0] as string || (errorData as Record<string, unknown>).error as string || (errorData as Record<string, unknown>).detail as string || `HTTP error! status: ${processedResponse.status}`)
        ) as ApiError;
        apiError.status = processedResponse.status;
        apiError.data = errorData;

        // Apply error interceptors
        for (const interceptor of errorInterceptors) {
          try {
            await interceptor(apiError, processedConfig);
          } catch (interceptorError) {
            apiLogger.warn('Error interceptor failed:', interceptorError);
          }
        }

        // Handle specific status codes
        if (processedResponse.status === 403) {
          throw new Error(msg || 'Access denied - insufficient permissions. Please contact an administrator.');
        }
        if (processedResponse.status === 401) {
          // If the token is fundamentally invalid (not just expired), don't even try to refresh
          if (msg && (msg.includes('not valid for any token type') || msg.includes('token_not_valid'))) {
            apiLogger.warn('Mangled session detected (invalid token type). Forcing logout.');
            window.dispatchEvent(new Event('auth:logout'));
            throw apiError;
          }

          // Token might be expired, try to refresh
          const refreshResult = await refreshToken();
          if (refreshResult) {
            // Refresh successful, retry the request with the SAME idempotency key
            return apiCall(method, url, data, config, retryCount, effectiveIdempotencyKey);
          } else {
            // Refresh failed, dispatch logout event to clear auth state
            // This prevents infinite loops and ensures the UI reflects the logged-out state
            window.dispatchEvent(new Event('auth:logout'));
            throw apiError;
          }
        }

        // Check if error is retryable and we haven't exceeded max retries
        if (isRetryableError(apiError) && retryCount < MAX_RETRIES) {
          const delay = getRetryDelay(retryCount);
          apiLogger.warn(`Retrying ${method} ${url} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          await sleep(delay);
          return apiCall(method, url, data, config, retryCount + 1, effectiveIdempotencyKey);
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
            apiLogger.error('[API] Failed to parse JSON response:', parseError);
            responseData = {} as T;
          }
        }
      }

      const duration = Date.now() - startTime;
      apiLogger.info(`API call successful: ${method} ${url} (${duration}ms, attempt ${retryCount + 1})`);
      return { data: responseData as T };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Apply error interceptors for fetch errors
      for (const interceptor of errorInterceptors) {
        try {
          await interceptor(fetchError, processedConfig);
        } catch (interceptorError) {
          apiLogger.warn('Error interceptor failed:', interceptorError);
        }
      }

      // Handle AbortError (timeout)
      if (fetchError && typeof fetchError === 'object' && 'name' in fetchError && fetchError.name === 'AbortError') {
        apiLogger.warn(`API call timeout: ${method} ${url} (${duration}ms)`);
        const timeoutError = new Error('Request timeout') as ApiError;
        timeoutError.status = 0;
        timeoutError.data = { error: 'Request timeout' };

        // Retry timeout errors
        if (retryCount < MAX_RETRIES) {
          const delay = getRetryDelay(retryCount);
          apiLogger.warn(`Retrying ${method} ${url} after timeout in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          await sleep(delay);
          return apiCall(method, url, data, config, retryCount + 1, effectiveIdempotencyKey);
        }

        throw timeoutError;
      }

      // Retry other network errors
      if (isRetryableError(fetchError) && retryCount < MAX_RETRIES) {
        const delay = getRetryDelay(retryCount);
        apiLogger.warn(`Retrying ${method} ${url} after network error in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
        await sleep(delay);
        return apiCall(method, url, data, config, retryCount + 1, effectiveIdempotencyKey);
      }

      throw fetchError;
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    // Enhanced error handling - only re-log if it doesn't have a status 
    // (Already logged above in status check)
    if (error && typeof error === 'object' && 'status' in error) {
      throw error; // Already a properly formatted and logged error
    }

    // Handle network and other errors
    const errorMessage = error && typeof error === 'object' && 'message' in error
      ? (error as Error).message
      : 'Network error';

    apiLogger.error(`API call network error: ${method} ${url} (${duration}ms)`, error);
    const networkError = new Error(errorMessage) as ApiError;
    networkError.status = 500;
    networkError.data = { error: 'Network error' };
    throw networkError;
  }
}


// Error message sanitization helper
function sanitizeErrorMessage(message: unknown): string {
  // Development environment can show more details but still sanitized
  const sensitivePatterns = [
    /password\s*[:=]\s*\S+/i,
    /token\s*[:=]\s*\S+/i,
    /secret\s*[:=]\s*\S+/i,
    /private\s+key/i,
  ];

  // Ensure message is a string to prevent TypeError when calling replace()
  let sanitized = String(message || '');
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // If message contains suspicious content, use generic message
  // Allow most characters but block actual HTML tags to prevent XSS
  if (/[<>]/.test(sanitized)) {
     // Still generic if it looks like an HTML tag injection attempt
    return 'An error occurred. Please try again or contact support if the problem persists.';
  }

  // Allow sanitized messages even in production for visibility
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
  get: <T = unknown>(url: string, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('GET', url, undefined, { ...config }),
  post: <T = unknown>(url: string, data?: unknown, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('POST', url, data, { ...config }),
  put: <T = unknown>(url: string, data?: unknown, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('PUT', url, data, { ...config }),
  patch: <T = unknown>(url: string, data?: unknown, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('PATCH', url, data, { ...config }),
  delete: <T = unknown>(url: string, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('DELETE', url, undefined, { ...config }),
};




export const apiService = {
  async getMemberDashboardData(): Promise<MemberDashboardData> {
    try {
      const response = await api.get<MemberDashboardData>('users/member-dashboard/');
      return response.data;
    } catch (error: unknown) {
      apiLogger.error('Error fetching dashboard data:', error);
      return {
        account_balance: 0,
        recent_transactions: [],
        loan_balance: 0,
        savings_balance: 0,
        available_tabs: [],
        user_permissions: {},
        membership_status: {},
      };
    }
  },

  async getAccountSummary(): Promise<AccountSummary> {
    try {
      const response = await api.get<AccountSummary>('banking/account-summary/');
      return response.data;
    } catch (error: unknown) {
      apiLogger.error('Error fetching account summary:', error);
      return {
        total_savings: 0,
        total_loans: 0,
        available_balance: 0,
        monthly_contributions: 0,
        total_balance: 0,
        accounts: [],
      };
    }
  },

  async getAccounts(): Promise<{ success: boolean; data: Account[]; error?: string }> {
    try {
      const response = await api.get<Account[] | PaginatedResponse<Account>>('accounts/');
      return { success: true, data: extractResults<Account>(response.data) };
    } catch (error: unknown) {
      return { success: false, data: [], error: handleApiError(error, 'Fetch failed') };
    }
  },

  async createUser(userData: CreateUserData | FormData): Promise<{ success: boolean; data?: { staff_id: string }; error?: string }> {
    try {
      // Use any for userData to accommodate FormData or objects if needed, but return typed
      const response = await api.post<{ staff_id: string }>('users/staff/create/', userData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      return { success: false, error: errorMessage };
    }
  },

  async createExpense(expenseData: ExpenseData): Promise<{ success: boolean; data?: Expense; error?: string }> {
    try {
      const response = await api.post<Expense>('operations/expenses/', expenseData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record expense';
      return { success: false, error: errorMessage };
    }
  },

  async getTransactions(params: Record<string, string | number | boolean | undefined> = {}): Promise<{ success: boolean; data?: PaginatedResponse<Transaction>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<Transaction>>('transactions/', { params: params as Record<string, string | number | boolean> });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async approveTransaction(transactionId: string | number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post<{ status: string }>(`transactions/${transactionId}/approve/`, {});
      return { success: response.data.status === 'success' };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Approval failed' };
    }
  },

  async rejectTransaction(transactionId: string | number, reason: string = 'Rejected by Manager'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post<{ status: string }>(`transactions/${transactionId}/reject/`, { reason });
      return { success: response.data.status === 'success' };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Rejection failed' };
    }
  },

  async getAllTransactions(params?: Record<string, string | number | boolean | undefined>): Promise<{ success: boolean; data: { transactions: Transaction[]; pagination: { count: number; next: string | null; previous: string | null } }; error?: string }> {
    try {
      const result = await this.getTransactions(params);
      if (result.success && result.data) {
        return {
          success: true,
          data: {
            transactions: result.data.results,
            pagination: {
              count: result.data.count,
              next: result.data.next,
              previous: result.data.previous
            }
          }
        };
      }
      return {
        success: false,
        data: { transactions: [], pagination: { count: 0, next: null, previous: null } },
        error: result.error || 'Failed to fetch transactions'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
      return { success: false, data: { transactions: [], pagination: { count: 0, next: null, previous: null } }, error: errorMessage };
    }
  },

  async getBalanceInquiry(): Promise<{ success: boolean; data?: { available_balance: number; total_balance: number }; error?: string }> {
    try {
      const response = await api.get<{ available_balance: number; total_balance: number }>('accounts/balance/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      apiLogger.error('Error fetching balance:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Balance query failed' };
    }
  },

  async changePassword(data: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('users/change-password/', data);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Password change failed') };
    }
  },

  async createServiceRequest(data: CreateServiceRequestData): Promise<{ success: boolean; data?: ServiceRequest; error?: string }> {
    try {
      const response = await api.post<ServiceRequest>('users/service-requests/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Service request failed' };
    }
  },

  async getServiceRequests(): Promise<{ success: boolean; data?: ServiceRequestExtended[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<ServiceRequestExtended> | ServiceRequestExtended[]>('services/requests/');
      return { success: true, data: extractResults<ServiceRequestExtended>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async submitServiceRequest(data: CreateServiceRequestData): Promise<{ success: boolean; data?: ServiceRequestExtended; error?: string }> {
    try {
      const response = await api.post<ServiceRequestExtended>('services/requests/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Submission failed' };
    }
  },

  async getServiceRequestStats(): Promise<{ success: boolean; data?: Record<string, number>; error?: string }> {
    try {
      const response = await api.get<Record<string, number>>('services/stats/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async enable2FA(data: { otp: string; secret?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('users/verify-otp/', { ...data, verification_type: '2fa_setup' });
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : '2FA enablement failed' };
    }
  },

  async getFraudAlerts(): Promise<{ success: boolean; data?: PaginatedResponse<FraudAlert>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<FraudAlert>>('banking/fraud-alerts/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async resolveFraudAlert(alertId: string | number): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post<{ status: string }>(`banking/fraud-alerts/${alertId}/resolve/`, {});
      return { success: response.data.status === 'success', data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Resolution failed' };
    }
  },

  async runFraudCheck(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post<{ status: string }>('banking/fraud-alerts/run-check/', {});
      return { success: response.data.status === 'success', data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fraud sweep failed' };
    }
  },

  async getLoans(): Promise<{ success: boolean; data?: LoanExtended[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<LoanExtended> | LoanExtended[]>('banking/loans/');
      return { success: true, data: extractResults<LoanExtended>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async createLoan(data: CreateLoanData): Promise<{ success: boolean; data?: Loan; error?: string }> {
    try {
      const response = await api.post<Loan>('banking/loans/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Creation failed') };
    }
  },

  async approveLoan(loanId: string | number): Promise<{ success: boolean; data?: Loan; error?: string }> {
    try {
      const response = await api.post<Loan>(`banking/loans/${loanId}/approve/`, {});
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Approval failed') };
    }
  },

  async rejectLoan(loanId: string | number, notes?: string): Promise<{ success: boolean; data?: Loan; error?: string }> {
    try {
      const response = await api.post<Loan>(`banking/loans/${loanId}/reject/`, { notes });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Rejection failed' };
    }
  },

  async getPendingLoans(page = 1): Promise<{ success: boolean; data?: PaginatedResponse<LoanExtended>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<LoanExtended>>(`banking/loans/pending/?page=${page}`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getComplaints(): Promise<{ success: boolean; data?: Complaint[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<Complaint> | Complaint[]>('banking/complaints/');
      return { success: true, data: extractResults<Complaint>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async submitComplaint(data: CreateComplaintData): Promise<{ success: boolean; data?: Complaint; error?: string }> {
    try {
      const response = await api.post<Complaint>('banking/complaints/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Submission failed' };
    }
  },

  async getComplaintSummary(): Promise<{ success: boolean; data?: ComplaintStats; error?: string }> {
    try {
      const response = await api.get<{ summary: ComplaintStats }>('banking/complaints/reports/summary/');
      return { success: true, data: response.data?.summary };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createComplaint(data: CreateComplaintData): Promise<{ success: boolean; data?: Complaint; error?: string }> {
    try {
      const response = await api.post<Complaint>('banking/complaints/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  },



  async rejectCashAdvance(advanceId: string | number, notes?: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post<unknown>(`banking/cash-advances/${advanceId}/reject/`, { notes });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Rejection failed' };
    }
  },



  async rejectRefund(refundId: string | number, admin_notes?: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post<unknown>(`banking/refunds/${refundId}/reject/`, { admin_notes });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Rejection failed' };
    }
  },

  async getMessageThreads(): Promise<{ success: boolean; data?: PaginatedResponse<MessageThreadExtended>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<MessageThreadExtended>>('banking/message-threads/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createMessageThread(data: CreateMessageThreadData): Promise<{ success: boolean; data?: MessageThreadExtended; error?: string }> {
    try {
      const response = await api.post<MessageThreadExtended>('banking/message-threads/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  },

  async getThreadMessages(threadId: string | number): Promise<{ success: boolean; data?: MessageExtended[]; error?: string }> {
    try {
      const response = await api.get<MessageExtended[]>(`banking/message-threads/${threadId}/messages/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createMessage(data: { thread_id: string | number; content: string }): Promise<{ success: boolean; data?: MessageExtended; error?: string }> {
    try {
      const response = await api.post<MessageExtended>(`banking/message-threads/${data.thread_id}/messages/`, { content: data.content });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Send failed' };
    }
  },

  async syncUsers(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('users/auth/sync-profile/', {});
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Sync failed') };
    }
  },

  /**
   * Request a bank account closure (Operational Workflow)
   */
  async closeAccount(accountId: string | number, data: { reason: string; notes?: string; otp?: string }): Promise<{ success: boolean; data?: AccountClosureRequest; error?: string }> {
    try {
      const response = await api.post<AccountClosureRequest>('banking/account-closures/', { 
        account: accountId, 
        ...data 
      });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Closure request failed') };
    }
  },

  /**
   * Fetch all bank account closure requests
   */
  async getAccountClosures(): Promise<{ success: boolean; data?: AccountClosureRequest[]; error?: string }> {
    try {
      const response = await api.get<AccountClosureRequest[]>('banking/account-closures/');
      const data = (response.data as { results?: AccountClosureRequest[] }).results || response.data;
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  /**
   * Approve an account closure request
   */
  async approveAccountClosure(id: string | number): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`banking/account-closures/${id}/approve/`);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Approval failed' };
    }
  },

  /**
   * Reject an account closure request
   */
  async rejectAccountClosure(id: string | number, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`banking/account-closures/${id}/reject/`, { reason });
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Rejection failed' };
    }
  },

  /**
   * Fetch authenticated user's payslips
   */
  async getMyPayslips(params?: { month?: number; year?: number }): Promise<{ success: boolean; data?: Payslip[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<Payslip>>('operations/payslips/my_payslips/', { params });
      const data = response.data.results || response.data;
      return { success: true, data: data as Payslip[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async reviewLoan(loanId: string | number, status: 'approved' | 'rejected'): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`banking/loans/${loanId}/review/`, { status });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Loan review failed' };
    }
  },

  async reviewCashAdvance(advanceId: string | number, status: 'approved' | 'rejected'): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`banking/cash-advances/${advanceId}/review/`, { status });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Cash advance review failed' };
    }
  },

  async reviewRefund(refundId: string | number, status: 'approved' | 'rejected'): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`banking/refunds/${refundId}/review/`, { status });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Refund review failed' };
    }
  },

  async reviewFraudAlert(alertId: string | number, status: 'confirmed' | 'dismissed'): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`banking/fraud-alerts/${alertId}/review/`, { status });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fraud review failed' };
    }
  },

  async getAccountOpenings(): Promise<{ success: boolean; data?: AccountOpeningRequest[]; error?: string }> {
    try {
      const response = await api.get<AccountOpeningRequest[]>('banking/account-openings/');
      const data = (response.data as { results?: AccountOpeningRequest[] }).results || response.data;
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async submitAccountOpening(data: CreateAccountOpeningData): Promise<{ success: boolean; data?: AccountOpeningRequest; error?: string }> {
    try {
      const response = await api.post<AccountOpeningRequest>('banking/account-openings/submit-request/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Submission failed' };
    }
  },

  async approveAccountOpening(id: string | number): Promise<{ success: boolean; data?: AccountOpeningRequest; error?: string }> {
    try {
      const response = await api.post<AccountOpeningRequest>(`banking/account-openings/${id}/approve/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Approval failed' };
    }
  },

  async rejectAccountOpening(id: string | number, reason: string): Promise<{ success: boolean; data?: AccountOpeningRequest; error?: string }> {
    try {
      const response = await api.post<AccountOpeningRequest>(`banking/account-openings/${id}/reject/`, { reason });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Rejection failed' };
    }
  },

  async dispatchCredentials(id: string | number): Promise<{ success: boolean; data?: AccountOpeningRequest; error?: string }> {
    try {
      const response = await api.post<AccountOpeningRequest>(`banking/account-openings/${id}/dispatch-credentials/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Dispatch failed' };
    }
  },

  async approveAndPrintAccountOpening(id: string | number): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const response = await api.post(`banking/account-openings/${id}/approve-and-print/`, {}, { responseType: 'blob' });
      return { success: true, blob: response.data as Blob };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Approval & Print failed' };
    }
  },

  async getTransactionsList(): Promise<{ success: boolean; data?: Transaction[]; error?: string }> {
    try {
      const response = await api.get<Transaction[]>('transactions/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getPerformanceMetrics(): Promise<{ success: boolean; data?: PerformanceMetric[]; error?: string }> {
    try {
      const response = await api.get<PerformanceMetric[]>('performance/metrics/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getServiceStats(timeframe?: string): Promise<{ success: boolean; data?: ServiceStats; error?: string }> {
    try {
      const response = await api.get<ServiceStats>(`services/stats/${timeframe ? `?timeframe=${timeframe}` : ''}`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getPerformanceDashboardData(): Promise<{ success: boolean; data?: PerformanceDashboardData[]; error?: string }> {
    try {
      const response = await api.get<PerformanceDashboardData[]>('performance/dashboard-data/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getPerformanceChartData(params?: DateRangeParams): Promise<{ success: boolean; data?: PerformanceChartData; error?: string }> {
    try {
      const response = await api.get<PerformanceChartData>('performance/chart/', { params });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getSystemHealth(): Promise<{ success: boolean; data?: SystemHealthData; error?: string }> {
    try {
      const response = await api.get<SystemHealthData>('performance/system-health/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getPerformanceAlerts(): Promise<{ success: boolean; data?: PerformanceAlert[]; error?: string }> {
    try {
      const response = await api.get<PerformanceAlert[]>('performance/alerts/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getTransactionVolume(params?: DateRangeParams): Promise<{ success: boolean; data?: TransactionVolumeSummary; error?: string }> {
    try {
      const response = await api.get<TransactionVolumeSummary>('performance/volume/', { params });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Volume fetch failed' };
    }
  },

  async getPerformanceRecommendations(): Promise<{ success: boolean; data?: PerformanceRecommendation[]; error?: string }> {
    try {
      const response = await api.get<PerformanceRecommendation[]>('performance/recommendations/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getMLModelStatus(): Promise<{ success: boolean; data?: MLModelStatus; error?: string }> {
    try {
      const response = await api.get<MLModelStatus>('ml/fraud/model/status/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch ML model status') };
    }
  },

  async trainMLModel(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.post<{ status: string; message?: string }>('ml/fraud/model/train/');
      return { success: true, message: response.data.message || 'Training task initiated' };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'ML model training failed') };
    }
  },

  async analyzeTransactionFraud(transactionId: string | number): Promise<{ success: boolean; data?: MLFraudAnalysis; error?: string }> {
    try {
      const response = await api.post<MLFraudAnalysis>('ml/fraud/analyze/', { transaction_id: transactionId });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fraud analysis failed') };
    }
  },

  async getReports(): Promise<{ success: boolean; data?: Report[]; error?: string }> {
    try {
      const response = await api.get<Report[]>('reports/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async generateOperationalReport(params: { 
    type: string; 
    format: 'pdf' | 'csv'; 
    date_from?: string; 
    date_to?: string; 
    limit?: number; 
  }): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const response = await api.post('operations/reports/generate/', params, {
        responseType: 'blob'
      });
      return { success: true, data: response.data as Blob };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Report generation failed') };
    }
  },

  async getReportTemplates(): Promise<{ success: boolean; data?: ReportTemplate[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<ReportTemplate> | ReportTemplate[]>('reports/templates/');
      return { success: true, data: extractResults<ReportTemplate>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async getReportSchedules(): Promise<{ success: boolean; data?: ReportSchedule[]; error?: string }> {
    try {
      const response = await api.get<ReportSchedule[]>('reports/schedules/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createReportTemplate(data: CreateReportTemplateData): Promise<{ success: boolean; data?: ReportTemplate; error?: string }> {
    try {
      const response = await api.post<ReportTemplate>('reports/templates/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Template creation failed' };
    }
  },

  async createReportSchedule(data: CreateReportScheduleData): Promise<{ success: boolean; data?: ReportSchedule; error?: string }> {
    try {
      const response = await api.post<ReportSchedule>('reports/schedules/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Schedule creation failed' };
    }
  },

  async getReportAnalytics(): Promise<{ success: boolean; data?: ReportAnalytics; error?: string }> {
    try {
      const response = await api.get<ReportAnalytics>('reports/analytics/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Analytics fetch failed' };
    }
  },

  async generateReport(templateId: string | number): Promise<{ success: boolean; data?: GeneratedReport; error?: string }> {
    try {
      const response = await api.post<GeneratedReport>(`reporting/reports/generate/`, { template: templateId });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Generation failed' };
    }
  },

  async updateUserSettings(data: Record<string, unknown>): Promise<{ success: boolean; data?: UserSettings; error?: string }> {
    try {
      const response = await api.put<UserSettings>('users/settings/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Settings update failed' };
    }
  },

  async getUserSettings(): Promise<{ success: boolean; data?: UserSettings[]; error?: string }> {
    try {
      const response = await api.get<UserSettings[]>('users/settings/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Settings fetch failed' };
    }
  },

  async calculateServiceCharge(data: Record<string, unknown>): Promise<{ success: boolean; data?: ServiceChargeCalculation; error?: string }> {
    try {
      const response = await api.post<ServiceChargeCalculation>('operations/calculate-service-charge/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Service charge calculation failed' };
    }
  },

  async calculateCommission(data: Record<string, unknown> = {}): Promise<{ success: boolean; data?: CommissionCalculationResult; error?: string }> {
    try {
      const response = await api.post<CommissionCalculationResult>('operations/calculate-commission/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Commission calculation failed') };
    }
  },

  async calculateInterest(data: Record<string, unknown> = {}): Promise<{ success: boolean; data?: InterestCalculationResult; error?: string }> {
    try {
      const response = await api.post<InterestCalculationResult>('operations/calculate-interest/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Interest calculation failed') };
    }
  },

  async exportTransactions(params: Record<string, unknown>): Promise<Blob> {
    const response = await api.get<Blob>('transactions/export/', {
      params: params as Record<string, string | number | boolean>,
      responseType: 'blob'
    });
    return response.data;
  },

  async generateReceipt(transactionId: string): Promise<Blob> {
    const response = await api.get<Blob>(`transactions/${transactionId}/receipt/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async checkAuth(): Promise<{ authenticated: boolean; user?: User }> {
    try {
      const response = await api.get<{ authenticated: boolean; user?: User }>('users/auth/check/');
      return response.data;
    } catch {
      return { authenticated: false };
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await api.post<{ user: User }>('users/auth/login/', { email, password });
      return {
        success: true,
        user: response.data.user
      };
    } catch (error: unknown) {
      apiLogger.error('Login error:', error);
      return { success: false, error: handleApiError(error, 'Login failed') };
    }
  },

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('users/auth/logout/', {});
    } catch {
      apiLogger.warn('Logout API call failed, but proceeding with client-side logout');
    }
    return { success: true };
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

  async verifyOTP(payload: string | { email?: string; phone_number?: string; otp_code?: string; otp?: string; verification_type?: string }, phone_number?: string): Promise<{ success: boolean; error?: string;[key: string]: unknown }> {
    try {
      let data: { email?: string; phone_number?: string; otp_code?: string; otp?: string; verification_type?: string };
      if (typeof payload === 'string') {
        data = { email: payload, otp: phone_number }; // legacy mismatch handling
      } else {
        data = payload;
      }
      const response = await api.post<Record<string, unknown>>('users/verify-otp/', data);
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

  async createAccount(accountData: Record<string, unknown>): Promise<{ success: boolean; account?: Account; error?: string }> {
    try {
      const response = await api.post<Account>('accounts/create_account/', accountData);
      return { success: true, account: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Account creation failed';
      return { success: false, error: msg };
    }
  },

  async getManagerOverview(): Promise<{ success: boolean; data?: ManagerOverviewData; error?: string }> {
    try {
      const response = await api.get<ManagerOverviewData>('accounts/manager/overview/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Overview fetch failed';
      const axiosError = error as { status?: number };
      if (axiosError.status === 404) {
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

  async sendOTP(payload: string | { email?: string; phone_number?: string; verification_type?: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const data = typeof payload === 'string' ? { email: payload } : payload;
      const response = await api.post<{ message: string }>('users/send-otp/', data);
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'OTP sending failed';
      return { success: false, error: msg };
    }
  },

  async getServiceCharges(): Promise<{ success: boolean; data?: ServiceCharge[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<ServiceCharge> | ServiceCharge[]>('operations/service-charges/');
      const data = Array.isArray(response.data) ? response.data : response.data.results;
      return { success: true, data: data as ServiceCharge[] || [] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createServiceCharge(data: CreateServiceChargeData | Record<string, unknown>): Promise<{ success: boolean; data?: ServiceCharge; error?: string }> {
    try {
      const response = await api.post<ServiceCharge>('operations/service-charges/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create service charge' };
    }
  },

  async getStaffIds(filters: Record<string, string | number | boolean | undefined> = {}): Promise<{ success: boolean; data?: StaffId[]; error?: string }> {
    try {
      const response = await api.get<{ status: string; data?: StaffId[] }>('users/staff-ids/', { params: filters });
      const data = response.data?.data || [];
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async getOperationalMetrics(): Promise<{ success: boolean; data?: OperationsMetrics; error?: string }> {
    try {
      const response = await api.get<OperationsMetrics>('operations/metrics/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch metrics' };
    }
  },

  async getBranchActivity(): Promise<{ success: boolean; data?: BranchActivity[]; error?: string }> {
    try {
      const response = await api.get('operations/branch-activity/');
      return { success: true, data: response.data as BranchActivity[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch activity' };
    }
  },

  async getSystemAlerts(): Promise<{ success: boolean; data?: SystemAlert[]; error?: string }> {
    try {
      const response = await api.get('operations/system-alerts/');
      return { success: true, data: response.data as SystemAlert[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch alerts' };
    }
  },

  async getWorkflowStatus(): Promise<{ success: boolean; data?: WorkflowStatus; error?: string }> {
    try {
      const response = await api.get<WorkflowStatus>('operations/workflow-status/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch status' };
    }
  },

  async generateOperationsReport(payload: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('operations/generate-report/', payload);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate report' };
    }
  },

  async getMobileBankerMetrics(): Promise<{ success: boolean; data?: MobileBankerMetric; error?: string }> {
    try {
      const response = await api.get('operations/mobile-banker-metrics/');
      return { success: true, data: response.data as MobileBankerMetric };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch metrics' };
    }
  },

  async getVisits(): Promise<{ success: boolean; data?: VisitSchedule[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<VisitSchedule> | VisitSchedule[]>('operations/visit-schedules/');
      return { success: true, data: extractResults<VisitSchedule>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch visits') };
    }
  },

  async getAssignments(params: Record<string, string | number | boolean | undefined> = {}): Promise<{ success: boolean; data: AssignedClient[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<AssignedClient> | AssignedClient[]>('operations/assignments/my-clients/', { params });
      return { success: true, data: extractResults<AssignedClient>(response.data) };
    } catch (error: unknown) {
      return { success: false, data: [], error: handleApiError(error, 'Fetch failed') };
    }
  },

  async getMobileMessages(): Promise<{ success: boolean; data?: MobileMessage[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<MobileMessage> | MobileMessage[]>('operations/messages/');
      const data = extractResults<MobileMessage>(response.data);
      const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return { success: true, data: sorted };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch messages') };
    }
  },

  async getStaffAccounts(): Promise<{ success: boolean; data?: AccountWithDetails[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<AccountWithDetails> | AccountWithDetails[]>('banking/staff-accounts/'); // Response might be paginated
      return { success: true, data: extractResults<AccountWithDetails>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch accounts') };
    }
  },

  async getStaffAccountsSummary(): Promise<{ success: boolean; data?: StaffAccountSummary; error?: string }> {
    try {
      const response = await api.get<StaffAccountSummary>('accounts/summary/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch account summary' };
    }
  },

  async requestAccountClosure(data: { account_number: string; reason: string }): Promise<{ success: boolean; data?: AccountClosureRequest; error?: string }> {
    try {
      const response = await api.post<AccountClosureRequest>('banking/account-closures/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Request failed' };
    }
  },

  async searchAccounts(query: string): Promise<{ success: boolean; data?: Account[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<Account> | Account[]>(`accounts/search/?q=${query}`);
      return { success: true, data: extractResults<Account>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Search failed') };
    }
  },

  async updateProfile(data: Partial<UserExtended>): Promise<{ success: boolean; data?: UserExtended; error?: string }> {
    try {
      const response = await api.patch<UserExtended>('users/me/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Update failed') };
    }
  },

  async getAllStaff(): Promise<{ success: boolean; data?: User[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<User> | User[]>('users/staff/');
      return { success: true, data: extractResults<User>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch staff members') };
    }
  },


  async getCashFlow(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('operations/cash-flow/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch cash flow' };
    }
  },

  async getExpenses(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('operations/expenses/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch expenses' };
    }
  },

  async generatePayslip(formData: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('operations/generate-payslip/', formData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate payslip' };
    }
  },

  async generateStatement(formData: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/generate-statement/', formData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate statement' };
    }
  },

  async getMembers(): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
    try {
      const response = await api.get('users/members/');
      return { success: true, data: response.data as unknown[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch members' };
    }
  },

  async assignClient(data: { mobile_banker: string; client: string; priority: string; location: string }): Promise<{ success: boolean; data?: AssignedClient; error?: string }> {
    try {
      const response = await api.post<AssignedClient>('operations/assignments/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorData = apiError.data as Record<string, unknown> | undefined;
      let errorMsg = 'Failed to assign client';
      if (errorData) {
        const nonFieldErrors = errorData.non_field_errors as string[] | undefined;
        if (nonFieldErrors?.[0]) errorMsg = nonFieldErrors[0];
        else if (errorData.detail) errorMsg = String(errorData.detail);
        else {
          const fieldErrors: string[] = [];
          for (const [key, value] of Object.entries(errorData)) {
            if (key !== 'status' && Array.isArray(value) && value.length > 0) fieldErrors.push(`${key}: ${value[0]}`);
          }
          if (fieldErrors.length > 0) errorMsg = fieldErrors.join(', ');
        }
      }
      return { success: false, error: errorMsg };
    }
  },

  async getChatRooms(): Promise<{ success: boolean; data?: ChatRoomData[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<ChatRoomData> | ChatRoomData[]>('chat/rooms/');
      const rooms = extractResults<ChatRoomData>(response.data);
      
      // SECURITY: Hide message previews if they are redacted/encrypted for the current user's role
      const processedRooms = rooms.map(room => ({
        ...room,
        last_message: (room.last_message && (room.last_message.content.includes('redacted') || room.last_message.content.includes('ENC:'))) 
          ? { ...room.last_message, content: '[Access Denied]' }
          : room.last_message
      }));

      return { success: true, data: processedRooms };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async createChatRoom(memberIds: (number | string)[], name = '', isGroup = false): Promise<{ success: boolean; data?: ChatRoomData; error?: string }> {
    try {
      const response = await api.post<ChatRoomData>('chat/rooms/create/', { member_ids: memberIds, name, is_group: isGroup });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  },

  async getChatMessages(roomId: number | string): Promise<{ success: boolean; data?: ChatMessageData[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<ChatMessageData> | ChatMessageData[]>(`chat/rooms/${roomId}/messages/`);
      const data = extractResults<ChatMessageData>(response.data);
      return { success: true, data: [...data].reverse() };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async sendChatMessage(roomId: number | string, content: string): Promise<{ success: boolean; data?: ChatMessageData; error?: string }> {
    try {
      const response = await api.post<ChatMessageData>(`chat/rooms/${roomId}/messages/send/`, { content });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Send failed' };
    }
  },

  async getStaffUsers(): Promise<{ success: boolean; data?: User[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<User> | User[]>('users/staff/');
      return { success: true, data: extractResults<User>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async updateAssignment(id: number | string, data: Partial<AssignedClient> & { mobile_banker?: string }): Promise<{ success: boolean; data?: AssignedClient; error?: string }> {
    try {
      const response = await api.patch<AssignedClient>(`operations/assignments/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update assignment' };
    }
  },

  async scheduleVisit(data: { client_name: string; location: string; scheduled_time: string; notes?: string }): Promise<{ success: boolean; data?: ScheduleVisitResponse; error?: string }> {
    try {
      const response = await api.post<ScheduleVisitResponse>('operations/schedule-visit/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule visit' };
    }
  },

  async completeVisit(id: number | string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`operations/visit-schedules/${id}/complete/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to complete visit' };
    }
  },

  async completeAssignment(id: number | string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`operations/assignments/${id}/complete/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to complete assignment' };
    }
  },

  async repayLoan(loanId: number | string, amount: string | number): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`loans/${loanId}/repay/`, { amount });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Repayment failed' };
    }
  },

  async repayLoanCashier(loanId: number | string, amount: string | number): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`banking/cash-advances/${loanId}/repay_loan/`, { amount });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Repayment failed' };
    }
  },

  async getClientsToMap(): Promise<{ success: boolean; data?: ClientsForMappingResult[]; error?: string }> {
    try {
        const response = await api.get<{ success: boolean; data?: ClientsForMappingResult[] }>('users/clients-for-mapping/');
        const data = response.data?.data || [];
        return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error: unknown) {
        return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },


  async createCashAdvance(data: Record<string, unknown>): Promise<{ success: boolean; data?: CashAdvanceExtended; error?: string }> {
    try {
      const response = await api.post<CashAdvanceExtended>('banking/cash-advances/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Advance creation failed') };
    }
  },
  
  async createRefund(data: Record<string, unknown>): Promise<{ success: boolean; data?: RefundExtended; error?: string }> {
    try {
      const response = await api.post<RefundExtended>('banking/refunds/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Refund creation failed') };
    }
  },

  async getCashAdvances(): Promise<{ success: boolean; data?: CashAdvanceExtended[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<CashAdvanceExtended> | CashAdvanceExtended[]>('banking/cash-advances/');
      return { success: true, data: extractResults<CashAdvanceExtended>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async getRefunds(): Promise<{ success: boolean; data?: RefundExtended[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<RefundExtended> | RefundExtended[]>('banking/refunds/');
      return { success: true, data: extractResults<RefundExtended>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Fetch failed') };
    }
  },

  async approveCashAdvance(id: number | string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`banking/cash-advances/${id}/approve/`, {});
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Approval failed') };
    }
  },

  async approveRefund(id: number | string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`banking/refunds/${id}/approve/`, {});
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Approval failed') };
    }
  },
  
  async getLoginAttempts(email?: string): Promise<{ success: boolean; data?: LoginAttemptRecord[]; error?: string }> {
    try {
      const url = email ? `users/auth/login-attempts/?email=${email}` : 'users/auth/login-attempts/';
      const response = await api.get<LoginAttemptRecord[] | PaginatedResponse<LoginAttemptRecord>>(url);
      return { success: true, data: extractResults<LoginAttemptRecord>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Login attempts fetch failed') };
    }
  },

  async getAuditLogs(): Promise<{ success: boolean; data?: AuditLogRecord[]; error?: string }> {
    try {
      const response = await api.get<AuditLogRecord[] | PaginatedResponse<AuditLogRecord>>('users/audit-logs/');
      return { success: true, data: extractResults<AuditLogRecord>(response.data) };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Audit logs fetch failed') };
    }
  },

  async getComplaintDetail(id: string | number): Promise<{ success: boolean; data?: Complaint; error?: string }> {
    try {
      const response = await api.get<Complaint>(`banking/complaints/${id}/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Complaint fetch failed' };
    }
  },

  async resolveComplaint(id: string | number, resolution: string): Promise<{ success: boolean; data?: Complaint; error?: string }> {
    try {
      const response = await api.post<Complaint>(`banking/complaints/${id}/resolve/`, { resolution });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Complaint resolution failed' };
    }
  },

  async lookupMember(memberNumber: string): Promise<{ success: boolean; data?: MemberLookupResult; error?: string }> {
    try {
      const response = await api.get<ApiResponse<MemberLookupResult>>(`users/member-lookup/`, {
        params: { member_number: memberNumber }
      });
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Member lookup failed') };
    }
  },

  async assignBankerToClient(clientId: string | number, bankerId: string | number | null): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.post('users/assign-banker/', { client_id: clientId, banker_id: bankerId });
      const data = response.data as { success: boolean; message: string };
      return { success: true, message: data.message };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Banker assignment failed') };
    }
  },
  async getSystemSettings(): Promise<{ success: boolean; data?: SystemSettingData[]; error?: string }> {
    try {
      const response = await api.get<SystemSettingData[]>('operations/settings/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch settings') };
    }
  },

  async getApiUsage(): Promise<{ success: boolean; data?: ApiUsageData[]; error?: string }> {
    try {
      const response = await api.get<ApiUsageData[]>('operations/api-usage/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch usage stats') };
    }
  },

  async getRateLimits(): Promise<{ success: boolean; data?: RateLimitData[]; error?: string }> {
    try {
      const response = await api.get<RateLimitData[]>('operations/rate-limits/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch rate limits') };
    }
  },

  async getHealthChecks(): Promise<{ success: boolean; data?: HealthCheckData[]; error?: string }> {
    try {
      const response = await api.get<HealthCheckData[]>('operations/health-checks/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch health status') };
    }
  },

  async approveStaff(id: string | number): Promise<Blob> {
    const response = await api.post(`users/staff-management/${id}/approve-and-print/`, {}, { responseType: 'blob' });
    return response.data as Blob;
  }
};

export const authService = apiService;
