import { Navigate, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import { getModuleAccess } from '../../hooks/useModuleAccess';

interface ModuleAccessGuardProps {
  children: ReactNode;
}

/**
 * Route-to-module mapping for top-level routes.
 * Maps route path segments to topLevel module keys.
 */
const ROUTE_TO_TOP_LEVEL: Record<string, string> = {
  summary: 'summary',
  projects: 'projects',
  tasks: 'allTasks',
  calendar: 'calendar',
  libraries: 'allLibraries',
  messages: 'messages',
  clients: 'clients',
  vendors: 'vendors',
  timesheet: 'timesheet',
  settings: 'settings',
  users: 'settings', // users page is under settings access
};

/**
 * Route-to-typeLevel mapping for settings sub-routes.
 */
const SETTINGS_ROUTE_TO_TYPE: Record<string, string> = {
  user: 'users',
  role: 'roles',
  phase: 'phase',
  'project-settings': 'projectSettings',
  product: 'products',
  organization: 'organization',
  integration: 'integrations',
  'add-project-type': 'phase',
  'timeline-template': 'phase',
};

/**
 * Route-to-typeLevel mapping for project sub-routes.
 */
const PROJECT_ROUTE_TO_TYPE: Record<string, string> = {
  summary: 'projectSummary',
  quotation: 'quotation',
  files: 'files',
  task: 'projectTask',
  timeline: 'timeline',
  snag: 'snag',
  mom: 'mom',
  payment: 'payment',
  'site-visit': 'siteVisit',
  deliverable: 'projectTask',
  version: 'projectSummary',
  reports: 'projectSummary',
};

/**
 * ModuleAccessGuard checks if the current route is accessible to the user
 * based on their role's module access entries.
 *
 * If the user doesn't have access, they are redirected to /summary (or the first accessible page).
 */
export const ModuleAccessGuard = ({ children }: ModuleAccessGuardProps) => {
  const location = useLocation();
  const { hasTopLevel, hasTypeLevel, isSuperAdmin } = getModuleAccess();

  // Super admin bypasses all checks
  if (isSuperAdmin) return <>{children}</>;

  const segments = location.pathname.split('/').filter(Boolean);

  // If no segments (root), allow access
  if (segments.length === 0) return <>{children}</>;

  const firstSegment = segments[0];

  // Check top-level access
  const topLevelKey = ROUTE_TO_TOP_LEVEL[firstSegment];
  if (topLevelKey && !hasTopLevel(topLevelKey)) {
    return <Navigate to='/summary' replace />;
  }

  // Check settings sub-routes
  if (firstSegment === 'settings' && segments.length > 1) {
    const settingsSubRoute = segments[1];
    const settingsType = SETTINGS_ROUTE_TO_TYPE[settingsSubRoute];
    if (settingsType && !hasTypeLevel('settings', settingsType)) {
      return <Navigate to='/settings/user' replace />;
    }
  }

  // Check project sub-routes (e.g., /projects/:id/quotation)
  if (firstSegment === 'projects' && segments.length > 2) {
    const projectSubRoute = segments[2];
    const projectType = PROJECT_ROUTE_TO_TYPE[projectSubRoute];
    if (projectType && !hasTypeLevel('projects', projectType)) {
      return <Navigate to={`/projects/${segments[1]}/summary`} replace />;
    }
  }

  return <>{children}</>;
};
