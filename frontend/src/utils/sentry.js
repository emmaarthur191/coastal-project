// Sentry configuration for error tracking and monitoring
import * as Sentry from "@sentry/react";
import { browserTracingIntegration } from "@sentry/react";
import { replayIntegration } from "@sentry/replay";

const validateSentryDsn = (dsn) => {
  if (!dsn) return false;

  // Basic format validation
  const dsnPattern = /^https:\/\/[a-f0-9]+@(?:[a-zA-Z0-9-]+\.)*sentry\.io\/[0-9]+$/;
  if (!dsnPattern.test(dsn)) return false;

  // Check for placeholder values
  if (dsn.includes('your-sentry-dsn-here') || dsn.includes('project-id')) return false;

  return true;
};

const initializeSentry = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const sentryEnabled = import.meta.env.VITE_SENTRY_ENABLED !== 'false'; // Default to true
  const environment = import.meta.env.PROD ? 'production' : 'development';

  if (!sentryEnabled || !sentryDsn) {
    // console.log('[Sentry] Disabled or no DSN configured');
    return false;
  }

  if (!validateSentryDsn(sentryDsn)) {
    console.warn('[Sentry] Invalid DSN format or contains placeholder values');
    return false;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        browserTracingIntegration({
          tracePropagationTargets: [
            "localhost",
            /^\//,
            /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com/,
          ],
        }),
        replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development
      // Session Replay
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      environment,

      // Release tracking
      release: import.meta.env.VITE_RELEASE_VERSION || '1.0.0',

      // Error filtering
      beforeSend(event, hint) {
        // Don't send events in development unless explicitly enabled
        if (!import.meta.env.PROD && import.meta.env.VITE_SENTRY_DEBUG !== 'true') {
          console.log('[Sentry] Suppressed event in development:', event);
          return null;
        }

        // Filter out common non-actionable errors
        const error = hint.originalException;
        if (error && typeof error === 'object') {
          const errorMessage = error.message || '';
          // Filter out network errors that are expected (user offline, CORS, etc.)
          if (errorMessage.includes('NetworkError') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('Load failed')) {
            return null;
          }
        }

        return event;
      },

      // Debug mode
      debug: import.meta.env.VITE_SENTRY_DEBUG === 'true',
    });

    console.log('[Sentry] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
    return false;
  }
};

// Health check function
const checkSentryHealth = () => {
  try {
    Sentry.captureMessage("Sentry health check", "info");
    return true;
  } catch (error) {
    console.error('[Sentry] Health check failed:', error);
    return false;
  }
};

// Export functions for external use
export { initializeSentry, checkSentryHealth };

// Initialize Sentry when this module is imported
const sentryInitialized = initializeSentry();

export default sentryInitialized;
