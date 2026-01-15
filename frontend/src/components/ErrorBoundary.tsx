import { Component, type ReactNode } from 'react';

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" role="alert">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p className="error-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button onClick={this.handleRetry} className="retry-button">
              Try Again
            </button>
          </div>

          <style>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 200px;
              padding: 2rem;
            }
            .error-content {
              text-align: center;
              max-width: 400px;
            }
            .error-content h2 {
              color: #f44336;
              margin: 0 0 1rem 0;
            }
            .error-message {
              color: #888;
              margin-bottom: 1.5rem;
            }
            .retry-button {
              padding: 0.75rem 1.5rem;
              background: #646cff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            .retry-button:hover {
              background: #535bf2;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline error display for non-fatal errors
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message-inline" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-link">
          Try again
        </button>
      )}

      <style>{`
        .error-message-inline {
          padding: 1rem;
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid #f44336;
          border-radius: 4px;
          color: #f44336;
          text-align: center;
        }
        .error-message-inline p {
          margin: 0 0 0.5rem 0;
        }
        .retry-link {
          background: none;
          border: none;
          color: #f44336;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
        }
        .retry-link:hover {
          color: #d32f2f;
        }
      `}</style>
    </div>
  );
}
