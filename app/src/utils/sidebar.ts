import type { TSidebarConfig, TSidebarItem } from '../store/types/auth.types';
import type { TMenuItem } from '../types/common.types';
import { getFromLocal } from './helper';
import {
  SummaryIcon,
  ProjectsIcon,
  TasksIcon,
  CalendarIcon,
  LibrariesIcon,
  MessagesIcon,
  ClientsIcon,
  VendorsIcon,
  SettingsIcon,
  ClockIcon,
} from '../components/icons';
import { PaymentIcon } from '../components/icons';
import { ProjectSummaryIcon } from '../components/icons/ProjectSumaryIcon';
// import { ReportsIcon } from '../components/icons/ReportsIcon';
import { SiteVisitIcon } from '../components/icons/SiteVisitIcon';
import QuotationIcon from '../components/icons/QuotationIcon';
import FilesIcon from '../components/icons/FilesIcon';
import TaskIcon from '../components/icons/TaskIcon';
import TimelineIcon from '../components/icons/TimelineIcon';
import SnagIcon from '../components/icons/SnagIcon';
// import VersionIcon from '../components/icons/VersionIcon';
import MOMIcon from '../components/icons/MOMIcon';
// import DeliverableIcon from '../components/icons/DeliverableIcon';
import { ProjectsIcon as AllProjectsIcon } from '../components';

// Mapping for main sidebar items
const MAIN_SIDEBAR_ICON_MAP: Record<string, any> = {
  summary: SummaryIcon,
  projects: ProjectsIcon,
  allTasks: TasksIcon,
  calendar: CalendarIcon,
  allLibraries: LibrariesIcon,
  messages: MessagesIcon,
  clients: ClientsIcon,
  vendors: VendorsIcon,
  settings: SettingsIcon,
  timesheet: ClockIcon,
};

// Mapping for main sidebar paths
const MAIN_SIDEBAR_PATH_MAP: Record<string, string> = {
  summary: '/summary',
  projects: '/projects',
  allTasks: '/tasks',
  calendar: '/calendar',
  allLibraries: '/libraries',
  messages: '/messages',
  clients: '/clients',
  vendors: '/vendors',
  settings: '/settings/user',
  timesheet: '/timesheet',
};

// Mapping for project sidebar items
const PROJECT_SIDEBAR_ICON_MAP: Record<string, any> = {
  projectSummary: ProjectSummaryIcon,
  quotation: QuotationIcon,
  files: FilesIcon,
  projectTask: TaskIcon,
  timeline: TimelineIcon,
  snag: SnagIcon,
  // version: VersionIcon,
  mom: MOMIcon,
  // deliverable: DeliverableIcon,
  payment: PaymentIcon,
  // reports: ReportsIcon,
  siteVisit: SiteVisitIcon,
};

// Mapping for project sidebar paths
const PROJECT_SIDEBAR_PATH_MAP: Record<string, string> = {
  projectSummary: '/summary',
  quotation: '/quotation',
  files: '/files',
  projectTask: '/task',
  timeline: '/timeline',
  snag: '/snag',
  // version: '/version',
  mom: '/mom',
  // deliverable: '/deliverable',
  payment: '/payment',
  // reports: '/reports',
  siteVisit: '/site-visit',
};

/**
 * Check if user has permission for a sidebar item
 * Currently checks if operations object has any keys (permissions)
 * You can extend this to check specific operations if needed
 */
const hasPermission = (item: TSidebarItem): boolean => {
  // If operations is empty, assume no permission
  if (!item.operations || Object.keys(item.operations).length === 0) {
    // You can change this to return true if empty operations means all permissions
    // For now, we'll show items even if operations is empty (assuming it means all permissions)
    return true;
  }
  // Add more specific permission checks here if needed
  return true;
};

/**
 * Convert sidebar items to menu items format
 */
const mapSidebarItemsToMenuItems = (
  items: TSidebarItem[],
  iconMap: Record<string, any>,
  pathMap: Record<string, string>,
): TMenuItem[] => {
  return items
    .filter(hasPermission)
    .filter((item) => {
      // Only include items that have a recognized icon mapping
      const icon = iconMap[item.name] || iconMap[item.slug];
      if (!icon) {
        console.warn(`Skipping unrecognized sidebar item: ${item.name} (${item.slug})`);
        return false;
      }
      return true;
    })
    .map((item) => {
      const icon = iconMap[item.name] || iconMap[item.slug];
      const path = pathMap[item.name] || pathMap[item.slug] || `/${item.slug}`;

      return {
        id: item.slug,
        label: item.frontendName || item.name,
        path,
        icon,
      };
    });
};

/**
 * Get main sidebar menu items from localStorage
 * Falls back to default menuItems if not found
 */
export const getMainSidebarItems = (): TMenuItem[] => {
  const sidebarConfig = getFromLocal<TSidebarConfig>('sidebarConfig');
  console.log('🚀 ~ getMainSidebarItems ~ sidebarConfig:', sidebarConfig);

  if (sidebarConfig?.mainSidebar) {
    const items = mapSidebarItemsToMenuItems(
      sidebarConfig.mainSidebar,
      MAIN_SIDEBAR_ICON_MAP,
      MAIN_SIDEBAR_PATH_MAP,
    );

    // Ensure Timesheet is present and placed as the 2nd last option in main sidebar.
    const timesheetItem: TMenuItem = {
      id: 'timesheet',
      label: 'Timesheet',
      path: '/timesheet',
      icon: ClockIcon,
    };

    const withoutTimesheet = items.filter((i) => i.id !== 'timesheet' && i.path !== '/timesheet');
    const insertIndex = Math.max(withoutTimesheet.length - 1, 0);
    withoutTimesheet.splice(insertIndex, 0, timesheetItem);
    return withoutTimesheet;
  }

  // Fallback to default menuItems (import from constants if needed)
  return [];
};

/**
 * Get project sidebar menu items from localStorage
 * Falls back to default projectMenuItems if not found
 */
export const getProjectSidebarItems = (): TMenuItem[] => {
  const sidebarConfig = getFromLocal<TSidebarConfig>('sidebarConfig');

  if (sidebarConfig?.projectSidebar) {
    // Add "All Projects" item at the beginning
    const allProjectsItem: TMenuItem = {
      id: 'all-projects',
      label: 'All Projects',
      path: '/projects',
      icon: AllProjectsIcon,
    };

    const projectItems = mapSidebarItemsToMenuItems(
      sidebarConfig.projectSidebar,
      PROJECT_SIDEBAR_ICON_MAP,
      PROJECT_SIDEBAR_PATH_MAP,
    );
    return [allProjectsItem, ...projectItems].filter(
      (i) => i.id !== 'timesheet' && i.path !== '/timesheet',
    );
  }

  // Fallback to default projectMenuItems (import from constants if needed)
  return [];
};
