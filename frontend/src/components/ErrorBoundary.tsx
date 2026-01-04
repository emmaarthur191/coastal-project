import React, { ReactNode, ErrorInfo } from "react";
import * as Sentry from "@sentry/react";

/**
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  /** The child components that the ErrorBoundary will wrap and monitor for errors. */
  children: ReactNode;
}

/**
 * State of the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught by the boundary. */
  hasError: boolean;
  /** The error object caught by the component. */
  error: Error | null;
  /** Detailed information about the component stack when the error occurred. */
  errorInfo: ErrorInfo | null;
}

/**
 * A class-based component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors to Sentry, and displays a fallback UI.
 *
 * In production, it shows a user-friendly error page.
 * In development, it shows a detailed error trace and component stack.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * Updates state so the next render will show the fallback UI.
   */
  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component.
   * Logs the error to Sentry and updates the component state.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Sentry
    Sentry.withScope((scope) => {
      scope.setTag("component", "ErrorBoundary");
      scope.setLevel("error");
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    });

    // Also log to console for development
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  /**
   * Resets the error state to attempt re-rendering the children.
   */
  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Production error UI
      if (import.meta.env.PROD) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We apologize for the inconvenience. Our team has been notified and is working to fix this issue.
              </p>
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Development error UI with details
      return (
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg className="h-8 w-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">
                Development Error
              </h1>
            </div>

            <div className="mb-4">
              <button
                onClick={this.handleRetry}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mr-2"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Reload Page
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Details</h3>
                <pre className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800 overflow-auto">
                  {this.state.error && this.state.error.toString()}
                </pre>
              </div>

              {this.state.errorInfo && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Component Stack</h3>
                  <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-800 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
