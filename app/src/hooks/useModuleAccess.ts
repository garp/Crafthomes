import { useMemo } from 'react';
import { getUser } from '../utils/auth';
import { getFromLocal } from '../utils/helper';
import type { TModuleAccessEntry } from '../store/types/auth.types';

/**
 * ID-to-topLevel mapping for main sidebar items.
 * Maps the sidebar item `id` (from constants/layout.ts) to the topLevel key
 * stored in the ModuleAccess table.
 */
export const SIDEBAR_ID_TO_TOP_LEVEL: Record<string, string> = {
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
};

/**
 * ID-to-typeLevel mapping for project sidebar items.
 * Maps the project sidebar item `id` to the typeLevel key under topLevel "projects".
 */
export const PROJECT_ID_TO_TYPE_LEVEL: Record<string, string> = {
  summary: 'projectSummary',
  quotation: 'quotation',
  files: 'files',
  task: 'projectTask',
  timeline: 'timeline',
  snag: 'snag',
  mom: 'mom',
  payment: 'payment',
  'site-visit': 'siteVisit',
};

/**
 * Hook for checking module access.
 *
 * Reads module access entries from localStorage (populated at login)
 * and provides helper functions for checking access at each level.
 *
 * super_admin always has full access regardless of stored entries.
 */
export const useModuleAccess = () => {
  const user = getUser();
  const isSuperAdmin = user?.role?.name?.toLowerCase?.() === 'super_admin';

  const access: TModuleAccessEntry[] = useMemo(
    () => getFromLocal<TModuleAccessEntry[]>('moduleAccess') || [],
    [],
  );

  /**
   * Check if user has access to a top-level module (main sidebar item).
   */
  const hasTopLevel = (topLevel: string): boolean => {
    if (isSuperAdmin) return true;
    return access.some((a) => a.topLevel === topLevel);
  };

  /**
   * Check if user has access to a type-level module (project sub-page or settings tab).
   */
  const hasTypeLevel = (topLevel: string, typeLevel: string): boolean => {
    if (isSuperAdmin) return true;
    return access.some((a) => a.topLevel === topLevel && a.typeLevel === typeLevel);
  };

  /**
   * Check if user has access to a subtype-level module (further nesting).
   */
  const hasSubtypeLevel = (topLevel: string, typeLevel: string, subtypeLevel: string): boolean => {
    if (isSuperAdmin) return true;
    return access.some(
      (a) =>
        a.topLevel === topLevel && a.typeLevel === typeLevel && a.subtypeLevel === subtypeLevel,
    );
  };

  return { hasTopLevel, hasTypeLevel, hasSubtypeLevel, isSuperAdmin, access };
};

/**
 * Non-hook version for use outside React components (e.g., in utility functions).
 */
export const getModuleAccess = () => {
  const user = getUser();
  const isSuperAdmin = user?.role?.name?.toLowerCase?.() === 'super_admin';
  const access: TModuleAccessEntry[] = getFromLocal<TModuleAccessEntry[]>('moduleAccess') || [];

  const hasTopLevel = (topLevel: string): boolean => {
    if (isSuperAdmin) return true;
    return access.some((a) => a.topLevel === topLevel);
  };

  const hasTypeLevel = (topLevel: string, typeLevel: string): boolean => {
    if (isSuperAdmin) return true;
    return access.some((a) => a.topLevel === topLevel && a.typeLevel === typeLevel);
  };

  const hasSubtypeLevel = (topLevel: string, typeLevel: string, subtypeLevel: string): boolean => {
    if (isSuperAdmin) return true;
    return access.some(
      (a) =>
        a.topLevel === topLevel && a.typeLevel === typeLevel && a.subtypeLevel === subtypeLevel,
    );
  };

  return { hasTopLevel, hasTypeLevel, hasSubtypeLevel, isSuperAdmin, access };
};
