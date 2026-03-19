import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

// const getDefaultRedirectPath = (role: USER_ROLE | null): string => {
//   if (!role) return '/';
//   if (role === USER_ROLE.LABORATORY) return '/sample-handling';
//   if (role === USER_ROLE.ACCOUNTANT) return '/invoice-record';
//   return '/dashboard';
// };

// const hasAccessToRoute = (pathname: string, role: USER_ROLE | null): boolean => {
//   if (!role) return false;

//   const permissions = ROLE_PERMISSIONS[role];

//   const routePermissionMap: Record<string, keyof typeof permissions> = {
//     '/dashboard': 'canAccessDashboard',
//     '/user-accounts': 'canManageUsers',
//     '/management': 'canManageUsers',
//     '/sample-handling': 'canAccessSampleHandling',
//     '/kitchen-inspection-record': 'canAccessKitchenInspection',
//     '/kitchen-training-record': 'canAccessKitchenTraining',
//     '/fss-record': 'canAccessFssRecord',
//     '/fss-attendance-record': 'canAccessFssAttendance',
//     '/invoice-record': 'canAccessInvoiceRecord',
//     '/shared-files': 'canAccessSharedFiles',
//     '/user-manual': 'canAccessUserManual',
//   };

//   const baseRoute = '/' + pathname.split('/')[1];
//   const permission = routePermissionMap[baseRoute];

//   if (!permission) return false;
//   return permissions[permission];
// };

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuth = isAuthenticated();
  //   const location = useLocation();
  //   const userRole = getCurrentUserRole();

  if (!isAuth) {
    return <Navigate to='/login' replace />;
  }

  //   if (!hasAccessToRoute(location.pathname, userRole)) {
  //     return <Navigate to={getDefaultRedirectPath(userRole)} replace />;
  //   }

  return <>{children}</>;
};
