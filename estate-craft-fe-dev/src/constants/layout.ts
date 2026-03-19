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

export const menuItems = [
  {
    id: 'summary',
    label: 'Summary',
    path: '/summary',
    icon: SummaryIcon,
  },
  {
    id: 'projects',
    label: 'Projects',
    path: '/projects',
    icon: ProjectsIcon,
  },
  {
    id: 'tasks',
    label: 'All Tasks',
    path: '/tasks',
    icon: TasksIcon,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/calendar',
    icon: CalendarIcon,
  },
  {
    id: 'libraries',
    label: 'All Libraries',
    path: '/libraries',
    icon: LibrariesIcon,
  },
  {
    id: 'messages',
    label: 'Messages',
    path: '/messages',
    icon: MessagesIcon,
  },
  {
    id: 'clients',
    label: 'Clients',
    path: '/clients',
    icon: ClientsIcon,
  },
  {
    id: 'vendors',
    label: 'Vendors',
    path: '/vendors',
    icon: VendorsIcon,
  },
  {
    id: 'timesheet',
    label: 'Timesheet',
    path: '/timesheet',
    icon: ClockIcon,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings/user',
    icon: SettingsIcon,
  },
];
