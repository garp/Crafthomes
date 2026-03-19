import type { ProjectData, TeamMember } from '../types/types';

export const TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Peter', initial: 'P', color: 'bg-green-500' },
  { id: '2', name: 'Alice', initial: 'A', color: 'bg-blue-500' },
  { id: '3', name: 'Robert', initial: 'R', color: 'bg-orange-500' },
  { id: '4', name: 'Tom', initial: 'T', color: 'bg-amber-600' },
];

export const PROJECT_TABLE_DATA: ProjectData[] = [
  {
    id: '2',
    projectName: 'Downtown Tower Build',
    client: 'Client Name',
    location: 'New York, NY',
    payment: 'pending',
    dueDate: '2024-02-01',
    lastUpdated: '2024-02-01',
    phase: 'Execution',
    progress: 65,
    progressText: '₹3.2L / ₹5L (65%)',
    status: 'in-progress',
    teamMembers: [TEAM_MEMBERS[0], TEAM_MEMBERS[1], TEAM_MEMBERS[2]],
  },
  {
    id: '3',
    projectName: 'Residential Complex',
    client: 'John Smith',
    location: 'Los Angeles, CA',
    payment: 'paid',
    dueDate: '2024-03-15',
    lastUpdated: '2024-02-15',
    phase: 'Planning',
    progress: 85,
    progressText: '₹4.2L / ₹5L (85%)',
    status: 'completed',
    teamMembers: [TEAM_MEMBERS[1], TEAM_MEMBERS[2]],
  },
  {
    id: '4',
    projectName: 'Office Building Renovation',
    client: 'Sarah Johnson',
    location: 'Chicago, IL',
    payment: 'paid',
    dueDate: '2024-04-20',
    lastUpdated: '2024-02-20',
    phase: 'Design',
    progress: 45,
    progressText: '₹2.2L / ₹5L (45%)',
    status: 'on-hold',
    teamMembers: [TEAM_MEMBERS[0], TEAM_MEMBERS[3]],
  },
  {
    id: '5',
    projectName: 'Shopping Mall Construction',
    client: 'Michael Brown',
    location: 'Miami, FL',
    payment: 'pending',
    dueDate: '2024-05-10',
    lastUpdated: '2024-02-25',
    phase: 'Construction',
    progress: 30,
    progressText: '₹1.5L / ₹5L (30%)',
    status: 'in-progress',
    teamMembers: [TEAM_MEMBERS[0], TEAM_MEMBERS[1], TEAM_MEMBERS[2], TEAM_MEMBERS[3]],
  },
];

export const TABLE_COLUMNS = [
  { key: 'id', label: '#', className: 'w-16' },
  { key: 'projectName', label: 'Project Name', className: 'w-48' },
  { key: 'client', label: 'Client', className: 'w-32' },
  { key: 'location', label: 'Location', className: 'w-32' },
  { key: 'payment', label: 'Payment', className: 'w-24' },
  { key: 'dueDate', label: 'Due Date', className: 'w-32' },
  { key: 'lastUpdated', label: 'Last Updated', className: 'w-32' },
  { key: 'phase', label: 'Phase', className: 'w-24' },
  { key: 'progress', label: 'Progress', className: 'w-24' },
  { key: 'status', label: 'Status', className: 'w-32' },
  { key: 'actions', label: '', className: 'w-16' },
];

export const CLIENT_CONTACT_DATA: Record<string, { name: string; phone: string; email: string }> = {
  '2': { name: 'John Smith', phone: '+91 7656820123', email: 'john.smith@gmail.com' },
  '3': { name: 'Sarah Johnson', phone: '+91 8765432109', email: 'sarah.johnson@gmail.com' },
  '4': { name: 'Michael Brown', phone: '+91 9876543210', email: 'michael.brown@gmail.com' },
  '5': { name: 'Emily Davis', phone: '+91 8765432198', email: 'emily.davis@gmail.com' },
};

export const phaseOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'deployment', label: 'Deployment' },
];

export const progressOptions = [
  { value: '0-25', label: '0-25%' },
  { value: '25-50', label: '25-50%' },
  { value: '50-75', label: '50-75%' },
  { value: '75-100', label: '75-100%' },
];

export const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'COMPLETED', label: 'Completed' },
];
