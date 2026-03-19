import { fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { getToken, logout } from '../../utils/auth';
import { getFromLocal, setInLocal } from '../../utils/helper';
import type { TRefreshResponse, TUser } from '../types/auth.types';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const getBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

type BaseQueryArg = Parameters<typeof getBaseQuery>[0];

export const baseQuery: BaseQueryFn<
  BaseQueryArg,
  unknown,
  { reason: string },
  { shout?: boolean },
  { timestamp: number }
> = async (args, api, extraOptions): Promise<{ data?: any; error?: any }> => {
  let result = await getBaseQuery(args, api, extraOptions);
  const errorData = result?.error?.data as any;
  const errorCode = errorData?.code;
  const errorMessage = typeof errorData?.message === 'string' ? errorData.message : '';

  // Logout on 401 – e.g. "Invalid token" or any 401 Unauthorized (token invalid/expired)
  if (result?.error?.status === 401) {
    const isInvalidToken = errorMessage.toLowerCase().includes('invalid token');
    if (isInvalidToken || !errorCode) {
      logout();
    }
    return result;
  }

  // Logout if specific error codes are encountered
  const logoutErrorCodes = ['E-103', 'E-107', 'E-002', 'E-003', 'E-006', 'E-104'];
  if (errorCode && logoutErrorCodes.includes(errorCode)) {
    logout();
    return result;
  }

  // Handle 403 Access Denied - use a fixed toastId to prevent duplicate toasts
  if (result?.error?.status === 403 || errorCode === 403) {
    if (!toast.isActive('access-denied')) {
      toast.error('Access Denied! Please contact Administration.', {
        toastId: 'access-denied',
      });
    }
    return result;
  }

  const user = getFromLocal<TUser>('userData');
  // Refresh token
  if (errorCode === 'E-004') {
    const refreshResult = (await fetchBaseQuery({
      baseUrl: BASE_URL,
    })(
      {
        url: '/auth/refresh-access-token',
        method: 'POST',
        body: { refreshToken: user?.refreshToken },
      },
      api,
      extraOptions,
    )) as TRefreshResponse;
    if (refreshResult?.data) {
      setInLocal('accessToken', refreshResult?.data?.accessToken?.token);

      result = await fetchBaseQuery({
        baseUrl: BASE_URL,
        prepareHeaders: (headers) => {
          const token = getToken();
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return headers;
        },
      })(args, api, extraOptions);
    }

    return result;
  }

  return result;
};
// Keep existing 401 status handling for backward compatibility
// if (result?.error?.status === 401) {
//   const user = getFromLocal<TUser>('userData')

//   const refreshResult = (await fetchBaseQuery({
//     baseUrl: BASE_URL,
//   })(
//     {
//       url: '/auth/refresh-access-token',
//       method: 'POST',
//       body: { refreshToken: user?.refreshToken,  },
//     },
//     api,
//     extraOptions,
//   )) as TRefreshResponse;

//   if (refreshResult?.data) {
//     setInLocal("accessToken",refreshResult.data?.accessToken?.token);

//     result = await fetchBaseQuery({
//       baseUrl: BASE_URL,
//       prepareHeaders: (headers) => {
//         const token = getToken();
//         if (token) {
//           headers.set('Authorization', `Bearer ${token}`);
//         }
//         return headers;
//       },
//     })(args, api, extraOptions);
//   }
// }
