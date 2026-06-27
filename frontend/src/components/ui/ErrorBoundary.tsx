import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

// ============================================================================
// Error Fallback (stateless)
// ============================================================================
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center p-6" role="alert">
      <div className="max-w-md text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-danger-500/10 flex items-center justify-center">
          <FiAlertTriangle size={24} className="text-danger-500" />
        </div>
        <h2 className="text-lg font-bold text-surface-900">Something went wrong</h2>
        <p className="text-sm text-surface-700/60">
          An unexpected error occurred. The rest of the application is unaffected.
        </p>
        {import.meta.env.DEV && (
          <details className="text-left bg-surface-50 rounded-xl p-3 text-xs text-surface-700/70">
            <summary className="cursor-pointer font-medium mb-1">Error details</summary>
            <pre className="whitespace-pre-wrap break-words mt-1">{error.message}</pre>
          </details>
        )}
        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition"
        >
          <FiRefreshCw size={14} />
          Try Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Error Boundary (class component — required by React)
// ============================================================================
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }
    return this.props.children;
  }
}
