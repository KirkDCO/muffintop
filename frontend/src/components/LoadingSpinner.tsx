interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingSpinner({ message = 'Loading...', size = 'medium' }: LoadingSpinnerProps) {
  const sizeClass = `spinner-${size}`;

  return (
    <div className={`loading-spinner ${sizeClass}`} role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span className="sr-only">{message}</span>
      {message && <p className="loading-message">{message}</p>}

      <style>{`
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #888;
        }
        .spinner {
          border: 3px solid #333;
          border-top-color: #646cff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .spinner-small .spinner {
          width: 20px;
          height: 20px;
          border-width: 2px;
        }
        .spinner-medium .spinner {
          width: 32px;
          height: 32px;
        }
        .spinner-large .spinner {
          width: 48px;
          height: 48px;
          border-width: 4px;
        }
        .loading-message {
          margin-top: 0.75rem;
          font-size: 0.9rem;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
