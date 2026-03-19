import { useFormik } from 'formik';
import LoginLayout from '../components/LoginLayout';
import FormLabel from '../../../components/base/FormLabel';
import FormInput from '../../../components/base/FormInput';
import { Button } from '../../../components';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconKey } from '@tabler/icons-react';
import { useResetPasswordMutation } from '../../../store/services/auth/authSlice';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../store/types/common.types';
import * as yup from 'yup';
import { useEffect } from 'react';

const resetPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[@$!%*?&#]/, 'Password must contain at least one special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const identifier = location.state?.identifier;

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  // Redirect if no email or identifier
  useEffect(() => {
    if (!email || !identifier) {
      navigate('/login/forgot-password');
    }
  }, [email, identifier, navigate]);

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    onSubmit: (data) => {
      resetPassword({
        email,
        identifier,
        newPassword: data.newPassword,
      })
        .unwrap()
        .then(() => {
          toast.success('Password reset successfully! Please login with your new password.');
          navigate('/login');
        })
        .catch((error: { data: TErrorResponse }) => {
          if (error?.data?.message) {
            toast.error(error?.data?.message);
          } else {
            toast.error('Failed to reset password. Please try again.');
          }
          console.error('Error resetting password:', error);
        });
    },
  });

  if (!email || !identifier) {
    return null;
  }

  return (
    <LoginLayout>
      <div className='md:w-1/2 h-full flex flex-col items-center w-full px-8 lg:px-16 justify-center'>
        <div className='w-full max-w-sm p-8 rounded-xl shadow-sm flex flex-col border bg-white'>
          <div className='bg-white border rounded-md p-3 w-fit self-center mb-5'>
            <IconKey className='size-6' />
          </div>
          <h2 className='text-center text-2xl font-semibold mb-2'>Set new password</h2>
          <p className='text-center text-gray-500 text-sm mb-6'>
            Your new password must be different from previously used passwords.
          </p>

          <form onSubmit={formik.handleSubmit} className='space-y-4'>
            <div>
              <FormLabel>New Password</FormLabel>
              <FormInput
                type='password'
                name='newPassword'
                placeholder='Enter new password'
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.newPassword && formik.errors.newPassword}
              />
            </div>

            <div>
              <FormLabel>Confirm Password</FormLabel>
              <FormInput
                type='password'
                name='confirmPassword'
                placeholder='Confirm new password'
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && formik.errors.confirmPassword}
              />
            </div>

            <div className='pt-2'>
              <p className='text-xs text-gray-500 mb-2'>Password must contain:</p>
              <ul className='text-xs text-gray-500 space-y-1 list-disc list-inside'>
                <li>At least 8 characters</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (@$!%*?&#)</li>
              </ul>
            </div>

            <Button radius='full' type='submit' disabled={isLoading} className='w-full'>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </div>
      </div>
    </LoginLayout>
  );
}
