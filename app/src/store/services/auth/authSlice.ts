import type { TAuthResponse, TLoginArgs } from '../../types/auth.types';
import { api } from '../api';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<TAuthResponse, TLoginArgs>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    refreshToken: builder.mutation<TAuthResponse, TLoginArgs>({
      query: (credentials) => ({
        url: '/auth/refresh-access-token',
        method: 'POST',
        body: credentials,
      }),
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/forget-password',
        method: 'POST',
        body,
      }),
    }),
    verifyOtp: builder.mutation<
      {
        data: {
          verified: boolean;
          identifier: string;
          message: string;
        };
      },
      { email: string; code: string }
    >({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
      transformResponse(res: { data: { verified: boolean; identifier: string; message: string } }) {
        return res;
      },
    }),
    resetPassword: builder.mutation<
      { message: string },
      { email: string; identifier: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    resendOtp: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useResendOtpMutation,
} = authApi;
