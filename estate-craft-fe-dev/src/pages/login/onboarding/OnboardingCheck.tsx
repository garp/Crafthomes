import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoginLayout from '../components/LoginLayout';
import {
  useOnboardingCheckQuery,
  useAcceptInviteMutation,
  useAddPasswordMutation,
} from '../../../store/services/user/userSlice';
import { Button, Loader, Input } from '../../../components';
import { setInLocal } from '../../../utils/helper';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

// Match the same password rules used in user forms:
// - At least 6 characters (checked separately)
// - At least one letter and one number
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export default function OnboardingCheck() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const { data, error, isLoading } = useOnboardingCheckQuery({
    userId: uuid!,
  });

  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation();
  const [addPassword, { isLoading: isAddingPassword }] = useAddPasswordMutation();

  const [step, setStep] = useState<'accept' | 'password'>('accept');
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && data) {
      const info = (data as any)?.data ?? data;
      if (info?.email) {
        setStoredEmail(info.email as string);
        setInLocal('onboardingEmail', info.email);
      }
      if (info?.inviteState === 'ACCEPTED') {
        setStep('password');
      }
    }
  }, [data, isLoading]);

  const onboardingInfo = (data as any)?.data ?? data;
  const email = (onboardingInfo as any)?.email ?? storedEmail ?? '';
  const name = (onboardingInfo as any)?.name;

  const handleAccept = async () => {
    if (!uuid || !email) {
      setErrorMessage('Missing user information.');
      return;
    }

    setErrorMessage(null);

    try {
      await acceptInvite({ userId: uuid, email }).unwrap();
      setStep('password');
    } catch {
      setErrorMessage('Unable to accept invite. Please try again.');
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setErrorMessage('Password must contain at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!uuid || !email) {
      setErrorMessage('Missing user information.');
      return;
    }

    try {
      await addPassword({ userId: uuid, email, password }).unwrap();
      navigate('/login');
    } catch {
      setErrorMessage('Unable to set password. Please try again.');
    }
  };

  return (
    <LoginLayout>
      <div className='md:w-1/2 h-full flex flex-col items-center w-full px-8 lg:px-16'>
        <div className='flex flex-col my-auto'>
          <div className='mb-6 mt-5'>
            <h6 className='text-3xl font-semibold text-[#121212] mb-2'>Welcome</h6>
            {isLoading && (
              <p className='text-gray-600'>
                We&apos;re verifying your onboarding link. This will only take a moment.
              </p>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className='flex flex-col items-center space-y-4 py-6'>
              <Loader />
              <p className='text-sm text-gray-500'>Checking your account…</p>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className='space-y-6 py-4'>
              <p className='text-sm text-red-500'>
                We couldn&apos;t verify your onboarding link. It may be invalid or expired.
              </p>
              <Button
                radius='full'
                className='w-full bg-black text-white py-2 px-4 rounded-full hover:bg-gray-800 transition-colors font-medium'
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          )}

          {/* Success state */}
          {!isLoading && data && (
            <div className='space-y-6 py-4'>
              <p className='text-gray-700'>
                {name ? `Hi ${name}, ` : 'Hi, '}
                we&apos;ve found your onboarding invitation for{' '}
                <span className='font-semibold'>{email}</span>.
              </p>

              {step === 'accept' && (
                <div className='space-y-4'>
                  <p className='text-sm text-gray-600'>
                    Click the button below to accept your invite and continue setting up your
                    account.
                  </p>
                  <Button
                    radius='full'
                    className='w-full bg-black text-white py-2 px-4 rounded-full hover:bg-gray-800 transition-colors font-medium'
                    onClick={handleAccept}
                    disabled={isAccepting}
                  >
                    {isAccepting ? 'Accepting...' : 'Accept Invite'}
                  </Button>
                </div>
              )}

              {step === 'password' && (
                <form onSubmit={handlePasswordSubmit} className='space-y-4'>
                  <p className='text-sm text-gray-600'>
                    Set a password to complete your account setup.
                  </p>

                  <div>
                    <label
                      htmlFor='password'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Password
                    </label>
                    <Input
                      name='password'
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder='Enter a password'
                      inputClassName='!px-5 !rounded-full'
                      width='100%'
                      rightSection={
                        <button
                          type='button'
                          onClick={() => setShowPassword((prev) => !prev)}
                          className='text-gray-400 hover:text-gray-600 mt-2 mr-3 cursor-pointer'
                        >
                          {showPassword ? <IconEye /> : <IconEyeOff />}
                        </button>
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='confirmPassword'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Confirm Password
                    </label>
                    <Input
                      name='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder='Re-enter your password'
                      inputClassName='!px-5 !rounded-full'
                      width='100%'
                      rightSection={
                        <button
                          type='button'
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className='text-gray-400 hover:text-gray-600 mt-2 mr-3 cursor-pointer'
                        >
                          {showConfirmPassword ? <IconEye /> : <IconEyeOff />}
                        </button>
                      }
                    />
                  </div>

                  {errorMessage && <p className='text-sm text-red-500'>{errorMessage}</p>}

                  <Button
                    radius='full'
                    type='submit'
                    className='w-full bg-black text-white py-2 px-4 rounded-full hover:bg-gray-800 transition-colors font-medium'
                    disabled={isAddingPassword}
                  >
                    {isAddingPassword ? 'Saving password...' : 'Set Password & Continue'}
                  </Button>
                </form>
              )}
            </div>
          )}

          <p className='text-center text-sm text-gray-500 mt-8'>
            If you face any challenges logging in, kindly contact <br />
            <a
              href='https://www.bytive.in/'
              target='_blank'
              rel='noreferrer'
              className='text-gray-600 hover:text-gray-800 underline font-semibold'
            >
              Bytive Support
            </a>
            .
          </p>
        </div>
      </div>
    </LoginLayout>
  );
}
