import type { TUser } from '../store/types/auth.types';
import { getFromLocal } from './helper';

export const getToken = (): string | null => getFromLocal('accessToken');

export const getUser = () => getFromLocal<TUser>('userData');

export const setToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('accessToken');
};

export const logout = () => {
  localStorage.removeItem('userData');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('sidebarConfig');
  localStorage.removeItem('moduleAccess');
  window.location.href = '/login';
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  const userData = getFromLocal<TUser>('userData');
  return !!token && !userData?.passwordChangeRequired;
};
