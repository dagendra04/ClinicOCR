'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
      <p className="text-text-muted mb-6 max-w-sm text-sm">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
