import { useLoginMutation } from '../../../store/services/auth/authSlice';
import { loginSchema } from '../../../validators/user';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import { Button, Input } from '../../../components';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useState } from 'react';
import type { TErrorResponse } from '../../../store/types/common.types';
import { setInLocal } from '../../../utils/helper';
import { Link } from 'react-router-dom';

export default function LoginForm() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  // const [checkedRememberMe, setCheckedRememberMe] = useState(false);
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: (values) => {
      login(values)
        .unwrap()
        .then((res) => {
          const { accessToken, refreshToken, sidebar, moduleAccess } = res?.data || {};
          // Also check if sidebar is at root level of response
          const sidebarConfig = sidebar || (res as any)?.sidebar;
          // if (res?.data?.data?.user?.role === USER_ROLE.FSS) {
          //   toast.error('Access Denied: Please use FSS mobile app instead');
          //   return;
          // }
          if (accessToken) {
            // if (checkedRememberMe) {
            setInLocal('accessToken', accessToken);
            // }
            setInLocal('userData', {
              ...res?.data?.user,
              accessToken,
              refreshToken,
            });
            // Save sidebar configuration to localStorage
            if (sidebarConfig) {
              setInLocal('sidebarConfig', sidebarConfig);
            }
            // Save module access to localStorage
            setInLocal('moduleAccess', moduleAccess || []);
            toast.success('Login successful!');
            // if (user?.passwordChangeRequired) {
            //   navigate('/change-password');
            // } else if (user?.role && user.role.toUpperCase() === USER_ROLE.LABORATORY) {
            //   navigate('/sample-handling');
            // } else if (user?.role && user.role.toUpperCase() === USER_ROLE.ACCOUNTANT) {
            //   navigate('/invoice-record');
            // } else {
            // }
            navigate('/');
          } else {
            toast.error('Invalid response from server. Please try again.');
          }
        })
        .catch((error: { data: TErrorResponse }) => {
          if (error?.data?.code) {
            toast.error(error?.data?.message);
          } else toast.error('Something went wrong, please try again later');
        });
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className='md:w-1/2 h-full flex flex-col items-center w-full px-8 lg:px-16  '>
      <div className='flex flex-col my-auto '>
        <div className='mb-6 mt-5'>
          <h6 className='text-3xl font-semibold text-[#121212] mb-2'>Welcome Back</h6>
          <p className='text-gray-600 '>Enter your email and password to access your account</p>
        </div>

        <form onSubmit={formik.handleSubmit} className='space-y-6 flex flex-col '>
          <div>
            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
              Email
            </label>
            <Input
              onBlur={formik.handleBlur}
              error={formik.touched.email && formik.errors.email}
              name='email'
              disabled={isLoading}
              onChange={formik.handleChange}
              value={formik.values.email}
              type='email'
              placeholder='Enter your email'
              inputClassName='!px-5 !rounded-full'
              width='100%'
            />
          </div>

          <div>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-2'>
              Password
            </label>
            {/* <div className='relative flex items-center'> */}
            <Input
              width='100%'
              error={formik.touched.password && formik.errors.password}
              name='password'
              disabled={isLoading}
              onChange={formik.handleChange}
              value={formik.values.password}
              type={showPassword ? 'text' : 'password'}
              placeholder='Enter your password'
              inputClassName='!px-5 !rounded-full'
              rightSection={
                <button
                  onClick={() => setShowPassword((prev) => !prev)}
                  type='button'
                  className=' text-gray-400 hover:text-gray-600 mt-2 mr-3'
                >
                  {showPassword ? <IconEye /> : <IconEyeOff />}
                </button>
              }
            />
            {/* </div> */}
          </div>

          <div className='flex items-center justify-between'>
            <label className='flex items-center'>
              <input
                type='checkbox'
                className='w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500'
              />
              <span className='ml-2 text-sm text-gray-600'>Remember me</span>
            </label>
            <Link
              to='/login/forgot-password'
              className='font-semibold text-sm text-gray-600 hover:text-gray-800'
            >
              Forgot Password
            </Link>
          </div>

          <Button
            disabled={isLoading}
            radius='full'
            type='submit'
            className='w-full mt-5 bg-black text-white py-2 px-4 rounded-full hover:bg-gray-800 transition-colors font-medium'
          >
            {'Sign In'}
          </Button>

          {/* <div className='text-center'>
            <a href='#' className='text-gray-600 hover:text-gray-800 text-sm'>
              Login with <span className='font-semibold'>Mobile Number</span>
            </a>
          </div> */}

          <p className='text-center text-sm text-gray-500'>
            If you face any challenges logging in, kindly contact <br />
            <a
              href='https://www.bytive.in/'
              target='_blank'
              className='text-gray-600 hover:text-gray-800 underline font-semibold'
            >
              Bytive Support
            </a>
            .
          </p>

          {/* <p className='text-center text-sm text-gray-600 mt-5'>
            Don't have an account?{' '}
            <a href='#' className='text-gray-600 hover:text-gray-800 font-medium'>
              Sign Up
            </a>
          </p> */}
        </form>
      </div>
    </div>
  );
}
