import { useFormik } from 'formik';
import LoginLayout from '../components/LoginLayout';
import { loginSchema } from '../../../validators/user';
import FormLabel from '../../../components/base/FormLabel';
import FormInput from '../../../components/base/FormInput';
import { Button } from '../../../components';
import { Link, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconFingerprint } from '@tabler/icons-react';
import { useForgotPasswordMutation } from '../../../store/services/auth/authSlice';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../store/types/common.types';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: loginSchema.pick(['email']),
    onSubmit: (data) => {
      forgotPassword({ email: data.email })
        .unwrap()
        .then(() => {
          toast.success('OTP sent successfully to your email');
          navigate('/login/verify-otp', { state: { email: data.email } });
        })
        .catch((error: { data: TErrorResponse }) => {
          if (error?.data?.message) {
            toast.error(error?.data?.message);
          } else {
            toast.error('Failed to send OTP. Please try again.');
          }
          console.error('Error sending OTP:', error);
        });
    },
  });
  return (
    <LoginLayout>
      <div className='md:w-1/2 h-full flex flex-col items-center w-full px-8 lg:px-16 justify-center'>
        <div className='w-full  max-w-sm p-8 rounded-xl shadow-sm flex flex-col border bg-white'>
          <div className='bg-white border rounded-md p-3 w-fit self-center mb-5'>
            <IconFingerprint />
          </div>
          <h2 className='text-center text-2xl font-semibold mb-2'>Forgot password?</h2>
          <p className='text-center text-gray-500 text-sm mb-6'>
            No worries, we’ll send you reset instructions.
          </p>

          <form onSubmit={formik.handleSubmit} className=''>
            <div>
              <FormLabel>Email</FormLabel>
              <FormInput
                name='email'
                type='email'
                required
                placeholder='Enter your email'
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && formik.errors.email}
              />
            </div>

            <Button radius='full' type='submit' disabled={isLoading} className='w-full mt-6'>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </Button>
          </form>

          <Link
            to='/login'
            className='mt-8 mx-auto text-sm flex gap-1 items-center text-text-subHeading'
          >
            <IconArrowLeft className='size-4 ' /> Back to log in
          </Link>
        </div>
      </div>
    </LoginLayout>
  );
}
