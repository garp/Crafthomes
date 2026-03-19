import React, { useEffect, useState } from 'react';
import type { FallbackProps } from 'react-error-boundary';

export const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.log({ error });
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      // Retry with exponential backoff before reloading
      if (retryCount < 2) {
        setIsRetrying(true);
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          setIsRetrying(false);
          resetErrorBoundary();
        }, delay);
      } else {
        // After 2 retries, reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  }, [error, retryCount, resetErrorBoundary]);

  const isDynamicImportError = error.message.includes(
    'Failed to fetch dynamically imported module',
  );

  return (
    <div role='alert' className='p-4 text-center'>
      <p className='font-semibold text-red-600'>Something went wrong.</p>
      {error?.message ? (
        <pre className='mt-2 text-sm text-gray-700 break-words whitespace-pre-wrap'>
          {error.message}
        </pre>
      ) : null}
      {isDynamicImportError && isRetrying && (
        <p className='mt-2 text-sm text-gray-600'>Retrying... ({retryCount + 1}/2)</p>
      )}
      {isDynamicImportError && retryCount >= 2 && (
        <p className='mt-2 text-sm text-gray-600'>Reloading page...</p>
      )}
      {!isDynamicImportError && (
        <button
          type='button'
          className='mt-3 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors'
          onClick={() => resetErrorBoundary()}
        >
          Try again
        </button>
      )}
    </div>
  );
};

export default ErrorFallback;
