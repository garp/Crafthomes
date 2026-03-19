import { useState, useRef, useEffect } from 'react';
import LoginLayout from '../components/LoginLayout';
import { Button } from '../../../components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconShieldCheck } from '@tabler/icons-react';
import { useVerifyOtpMutation, useResendOtpMutation } from '../../../store/services/auth/authSlice';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../store/types/common.types';
import ResetPasswordForm from './components/ResetPasswordForm';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [identifier, setIdentifier] = useState<string>('');

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/login/forgot-password');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);

    // Focus on the next empty input or last input
    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    verifyOtp({ email, code })
      .unwrap()
      .then((response) => {
        toast.success(response.data.message || 'OTP verified successfully');
        // Use the identifier from response for password reset
        setIdentifier(response.data.identifier);
        setIsVerified(true);
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Invalid OTP. Please try again.');
        }
        console.error('Error verifying OTP:', error);
      });
  };

  const handleResendOtp = () => {
    if (!canResend) return;

    resendOtp({ email })
      .unwrap()
      .then(() => {
        toast.success('OTP sent successfully');
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to resend OTP');
        }
        console.error('Error resending OTP:', error);
      });
  };

  if (!email) {
    return null;
  }

  return (
    <LoginLayout>
      <div className='md:w-1/2 h-full flex flex-col items-center w-full px-8 lg:px-16 justify-center'>
        <div className='w-full max-w-sm p-8 rounded-xl shadow-sm flex flex-col border bg-white'>
          {!isVerified ? (
            <>
              <div className='bg-white border rounded-md p-3 w-fit self-center mb-5'>
                <IconShieldCheck className='size-6' />
              </div>
              <h2 className='text-center text-2xl font-semibold mb-2'>Verify OTP</h2>
              <p className='text-center text-gray-500 text-sm mb-6'>
                We've sent a 6-digit code to{' '}
                <span className='font-medium text-gray-700'>{email}</span>
              </p>

              <form onSubmit={handleSubmit}>
                <div className='flex gap-2 justify-center mb-6' onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        if (el) {
                          inputRefs.current[index] = el;
                        }
                      }}
                      type='text'
                      inputMode='numeric'
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className='w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors'
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <Button
                  radius='full'
                  type='submit'
                  disabled={isVerifying || otp.some((digit) => !digit)}
                  className='w-full'
                >
                  {isVerifying ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </form>

              <div className='mt-6 text-center'>
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className='text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50'
                  >
                    {isResending ? 'Resending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <p className='text-sm text-gray-500'>
                    Resend OTP in <span className='font-medium text-gray-700'>{countdown}s</span>
                  </p>
                )}
              </div>

              <Link
                to='/login/forgot-password'
                className='mt-6 mx-auto text-sm flex gap-1 items-center text-text-subHeading'
              >
                <IconArrowLeft className='size-4' /> Back to email
              </Link>
            </>
          ) : (
            <ResetPasswordForm email={email} identifier={identifier} />
          )}
        </div>
      </div>
    </LoginLayout>
  );
}
