import {
  UserProfileIcon,
  RolePermissionIcon,
  PhaseManagementIcon,
  ProjectSettingsIcon,
  IntegrationsIcon,
} from '../../../components/icons';
import type { User } from '../types/types';
import { IconPackage, IconSitemap } from '@tabler/icons-react';

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const tabs = [
  {
    id: 'users',
    label: 'User Profiles',
    icon: <UserProfileIcon className='w-4 h-4' />,
    link: '/settings/user',
  },
  {
    id: 'roles',
    label: 'Role & Permissions',
    icon: <RolePermissionIcon className='w-4 h-4' />,
    link: '/settings/role',
  },
  {
    id: 'phase',
    label: 'Phase Management',
    icon: <PhaseManagementIcon className='w-4 h-4' />,
    link: '/settings/phase',
  },
  {
    id: 'projectSettings',
    label: 'Project Settings',
    icon: <ProjectSettingsIcon className='w-4 h-4' />,
    link: '/settings/project-settings',
  },
  {
    id: 'products',
    label: 'Product Management',
    icon: <IconPackage className='w-4 h-4 ' />,
    link: '/settings/product',
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: <IconSitemap className='w-4 h-4' />,
    link: '/settings/organization',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: <IntegrationsIcon className='w-4 h-4' />,
    link: '/settings/integration',
  },
];

export const tabVariants = {
  inactive: {
    color: '#9CA3AF',
    borderColor: 'transparent',
  },
  active: {
    color: '#1F2937',
    borderColor: '#1F2937',
  },
};

export const userNameOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'jai-singh', label: 'Jai Singh' },
];

export const projectNameOptions = [
  { value: 'all', label: 'All Projects' },
  { value: 'project-1', label: 'Project 1' },
  { value: 'project-2', label: 'Project 2' },
];

export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'Super Admin':
      return 'bg-orange-100 text-orange-600';
    case 'Admin':
      return 'bg-green-100 text-green-600';
    case 'Viewer':
      return 'bg-blue-100 text-blue-600';
    case 'Editor':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export const getRolePermissionColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-600';
    case 'Inactive':
      return 'bg-red-100 text-red-600';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export const getPhaseStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-600';
    case 'In Progress':
      return 'bg-blue-100 text-blue-600';
    case 'Not Started':
      return 'bg-gray-100 text-gray-600';
    case 'On Hold':
      return 'bg-yellow-100 text-yellow-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export const getIntegrationStatusColor = (status: string) => {
  switch (status) {
    case 'Connected':
      return 'bg-green-100 text-green-600';
    case 'Disconnected':
      return 'bg-red-100 text-red-600';
    case 'Error':
      return 'bg-red-100 text-red-600';
    case 'Syncing':
      return 'bg-blue-100 text-blue-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Super Admin',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 2,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Admin',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 3,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Viewer',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 4,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Editor',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 5,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Super Admin',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 6,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Admin',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 7,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Viewer',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 8,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Editor',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 9,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Super Admin',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 10,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Admin',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 11,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Viewer',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 12,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Editor',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 13,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Super Admin',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 14,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Admin',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
  {
    id: 15,
    name: 'Jai Singh',
    designation: 'UI Designer',
    role: 'Viewer',
    lastActive: '2024-02-01',
    dateAdded: '2024-02-01',
  },
];

// Role Permission Options and Data
export const roleTypeOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin Roles' },
  { value: 'user', label: 'User Roles' },
  { value: 'custom', label: 'Custom Roles' },
];

export const permissionLevelOptions = [
  { value: 'all', label: 'All Levels' },
  { value: 'full', label: 'Full Access' },
  { value: 'limited', label: 'Limited Access' },
  { value: 'view-only', label: 'View Only' },
];

export const mockRoles = [
  {
    id: 1,
    name: 'Super Administrator',
    description: 'Full system access and control',
    permissions: ['All Permissions', 'User Management', 'System Settings', 'Data Export'],
    usersCount: 2,
    status: 'Active',
  },
  {
    id: 2,
    name: 'Project Manager',
    description: 'Manage projects and team members',
    permissions: ['Project Management', 'Team Management', 'Reports'],
    usersCount: 5,
    status: 'Active',
  },
  {
    id: 3,
    name: 'Team Lead',
    description: 'Lead team and manage tasks',
    permissions: ['Task Management', 'Team View', 'Basic Reports'],
    usersCount: 8,
    status: 'Active',
  },
  {
    id: 4,
    name: 'Developer',
    description: 'Development and code access',
    permissions: ['Code Access', 'Issue Tracking'],
    usersCount: 12,
    status: 'Active',
  },
  {
    id: 5,
    name: 'Viewer',
    description: 'View-only access to projects',
    permissions: ['View Projects', 'View Reports'],
    usersCount: 15,
    status: 'Active',
  },
];

// Phase Management Options and Data
export const phaseStatusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
];

export const projectPhaseOptions = [
  { value: 'all', label: 'All Phases' },
  { value: 'planning', label: 'Planning' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'deployment', label: 'Deployment' },
];

export const mockPhases = [
  {
    id: 1,
    name: 'Planning Phase',
    project: 'Crafthomes',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    progress: 100,
    status: 'Completed',
  },
  {
    id: 2,
    name: 'Design Phase',
    project: 'Crafthomes',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    progress: 85,
    status: 'In Progress',
  },
  {
    id: 3,
    name: 'Development Phase',
    project: 'Crafthomes',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    progress: 45,
    status: 'In Progress',
  },
  {
    id: 4,
    name: 'Testing Phase',
    project: 'Crafthomes',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    progress: 0,
    status: 'Not Started',
  },
  {
    id: 5,
    name: 'Deployment Phase',
    project: 'Crafthomes',
    startDate: '2024-07-01',
    endDate: '2024-07-15',
    progress: 0,
    status: 'Not Started',
  },
];

// Integration Options and Data
export const integrationTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'payment', label: 'Payment Gateway' },
  { value: 'communication', label: 'Communication' },
  { value: 'storage', label: 'Cloud Storage' },
  { value: 'analytics', label: 'Analytics' },
];

export const connectionStatusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'connected', label: 'Connected' },
  { value: 'disconnected', label: 'Disconnected' },
  { value: 'error', label: 'Error' },
];

export const mockIntegrations = [
  {
    id: 1,
    serviceName: 'Stripe',
    type: 'Payment Gateway',
    description: 'Online payment processing',
    connectedDate: '2024-01-15',
    lastSync: '2024-02-01 10:30',
    status: 'Connected',
  },
  {
    id: 2,
    serviceName: 'Slack',
    type: 'Communication',
    description: 'Team communication platform',
    connectedDate: '2024-01-20',
    lastSync: '2024-02-01 09:15',
    status: 'Connected',
  },
  {
    id: 3,
    serviceName: 'AWS S3',
    type: 'Cloud Storage',
    description: 'File storage and backup',
    connectedDate: '2024-01-10',
    lastSync: '2024-02-01 08:45',
    status: 'Connected',
  },
  {
    id: 4,
    serviceName: 'Google Analytics',
    type: 'Analytics',
    description: 'Website traffic analysis',
    connectedDate: '2024-01-25',
    lastSync: 'Failed',
    status: 'Error',
  },
  {
    id: 5,
    serviceName: 'Mailgun',
    type: 'Communication',
    description: 'Email delivery service',
    connectedDate: '2024-01-30',
    lastSync: 'Never',
    status: 'Disconnected',
  },
];

export const mockPhaseManagementTable = [
  {
    id: 1,
    vendor: '2BHK flat',
    phasesCount: 5,
    taskCount: 11,
  },
  {
    id: 2,
    vendor: 'Kitchen Design',
    phasesCount: 7,
    taskCount: 12,
  },
  {
    id: 3,
    vendor: 'Factory Design',
    phasesCount: 5,
    taskCount: 14,
  },
  {
    id: 4,
    vendor: 'Independent Bungalow',
    phasesCount: 4,
    taskCount: 41,
  },
  {
    id: 5,
    vendor: 'Shop Design',
    phasesCount: 5,
    taskCount: 12,
  },
  {
    id: 6,
    vendor: 'Showroom Design',
    phasesCount: 6,
    taskCount: 4,
  },
];

export const MOCK_PHASES_TABLE = [
  {
    id: 1,
    phases: 'Moodboard',
    description: 'Description comes here',
  },
  {
    id: 3,
    phases: 'Measurement',
    description: 'Description comes here',
  },
  {
    id: 4,
    phases: 'Design',
    description: 'Description comes here',
  },
  {
    id: 5,
    phases: 'Modelling',
    description: 'Description comes here',
  },
  {
    id: 6,
    phases: 'Vendor Coordination',
    description: 'Description comes here',
  },
  {
    id: 7,
    phases: 'Execution',
    description: 'Description comes here',
  },
];

export const MOCK_TASKS_TABLE = [
  {
    id: 1,
    task: 'Select Design Theme',
    phase: 'Moodboard',
    description: 'Description comes here',
  },
  {
    id: 2,
    task: 'Choose Color Palette',
    phase: 'Measurement',
    description: 'Description comes here',
  },
  {
    id: 3,
    task: 'Gather Inspirational Images',
    phase: 'Design',
    description: 'Description comes here',
  },
  {
    id: 4,
    task: 'Add Sample Materials',
    phase: 'Modelling',
    description: 'Description comes here',
  },
  {
    id: 5,
    task: 'Define Furniture Style',
    phase: 'Vendor Coordination',
    description: 'Description comes here',
  },
  {
    id: 6,
    task: 'Compile Mood Board',
    phase: 'Execution',
    description: 'Description comes here',
  },
];

export const INTEGRATION_SUB_TABS = [
  { title: 'All', value: 'all' },
  { title: 'Developer tools', value: 'developerTools' },
  { title: 'Communication', value: 'communication' },
  { title: 'Productivity', value: 'productivity' },
  { title: 'Browser tools', value: 'browserTools' },
];

export const INTEGRATIONS = [
  {
    title: 'Google Drive',
    link: 'google.com',
    description: '',
    image: '',
  },
];
