import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SystemStatePanel } from '@/components/system/SystemStatePanel';

export interface ErrorFallbackProps {
  title?: string;
  message?: string;
  error?: Error | any;
  onRetry?: () => void;
  onGoHome?: () => void;
  showErrorDetails?: boolean;
  statusMessage?: string;
}

export function ErrorFallback({
  title = "Oops! Something went wrong",
  message = "We're aware of the issue and actively working to fix it. Your experience matters to us.",
  error,
  onRetry,
  onGoHome,
  showErrorDetails = true,
  statusMessage = "Our team has been notified"
}: ErrorFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl space-y-4">
        <SystemStatePanel
          kind="error"
          eyebrow={statusMessage || 'System alert'}
          title={title}
          message={message}
          icon={AlertTriangle}
          primaryAction={{ label: 'Try Again', onClick: handleRetry }}
          secondaryAction={{ label: 'Go Home', onClick: handleGoHome }}
          className="bg-black/35"
        />

        {process.env.NODE_ENV === 'development' && showErrorDetails && error && (
          <details className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Error details (Development only)
            </summary>
            <pre className="mt-3 max-h-40 overflow-auto text-xs text-muted-foreground">
              {error.message || error.toString()}
              {error.stack && '\n\n' + error.stack + '\n\n' + error.componentStack}
            </pre>
          </details>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          If this problem persists, please contact our support team
        </p>
      </div>
    </div>
  );
}
