import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoginLayout from '../components/LoginLayout';

const BASE_URL = import.meta.env.VITE_BASE_URL || '';

export default function OtpCopyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ref = searchParams.get('ref');
  const [status, setStatus] = useState<'loading' | 'copied' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!ref) {
      setStatus('error');
      setMessage('Invalid link.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/otp-by-ref/${encodeURIComponent(ref)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.data?.code) {
          setStatus('error');
          setMessage(data?.message || 'Code expired or invalid.');
          return;
        }
        const code = String(data.data.code);
        await navigator.clipboard.writeText(code);
        setStatus('copied');
        setMessage('Code copied to clipboard.');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Could not copy code.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ref, navigate]);

  return (
    <LoginLayout>
      <div className='flex flex-col items-center justify-center min-h-[60vh] w-full max-w-md mx-auto'>
        {status === 'loading' && (
          <>
            <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#6c63ff] mb-4' />
            <p className='text-gray-600'>Getting your code...</p>
          </>
        )}
        {status === 'copied' && (
          <>
            <div className='rounded-full bg-green-100 p-4 mb-4'>
              <svg
                className='w-10 h-10 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <p className='text-gray-800 font-medium'>{message}</p>
            <p className='text-gray-500 text-sm mt-1'>Redirecting to login...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className='rounded-full bg-red-100 p-4 mb-4'>
              <svg
                className='w-10 h-10 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </div>
            <p className='text-gray-800 font-medium'>{message}</p>
            <button
              type='button'
              onClick={() => navigate('/login', { replace: true })}
              className='mt-4 px-4 py-2 bg-[#6c63ff] text-white rounded-lg hover:opacity-90'
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </LoginLayout>
  );
}
