import { useFormik } from 'formik';
import FormLabel from '../../../../components/base/FormLabel';
import FormInput from '../../../../components/base/FormInput';
import { Button } from '../../../../components';
import { useResetPasswordMutation } from '../../../../store/services/auth/authSlice';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { IconKey } from '@tabler/icons-react';

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

type TResetPasswordFormProps = {
  email: string;
  identifier: string;
};

export default function ResetPasswordForm({ email, identifier }: TResetPasswordFormProps) {
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

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

  return (
    <div className='animate-fadeIn'>
      <div className='bg-white border rounded-md p-3 w-fit self-center mb-5 mx-auto'>
        <IconKey className='size-6' />
      </div>
      <h3 className='text-center text-xl font-semibold mb-2'>Set new password</h3>
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

        <div className='bg-gray-50 rounded-lg p-3'>
          <p className='text-xs font-medium text-gray-700 mb-2'>Password must contain:</p>
          <ul className='text-xs text-gray-600 space-y-1'>
            <li className='flex items-start'>
              <span className='mr-2'>•</span>
              <span>At least 8 characters</span>
            </li>
            <li className='flex items-start'>
              <span className='mr-2'>•</span>
              <span>One uppercase letter (A-Z)</span>
            </li>
            <li className='flex items-start'>
              <span className='mr-2'>•</span>
              <span>One lowercase letter (a-z)</span>
            </li>
            <li className='flex items-start'>
              <span className='mr-2'>•</span>
              <span>One number (0-9)</span>
            </li>
            <li className='flex items-start'>
              <span className='mr-2'>•</span>
              <span>One special character (@$!%*?&#)</span>
            </li>
          </ul>
        </div>

        <Button radius='full' type='submit' disabled={isLoading} className='w-full'>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
}
