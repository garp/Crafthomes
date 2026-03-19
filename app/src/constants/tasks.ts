export interface TaskData {
  id: string;
  projectName: string;
  progress: number;
  description: string;
  status: string;
  assignedBy: {
    name: string;
    avatar: string;
  };
  assignedTo: {
    name: string;
    avatar: string;
  };
  allocatedTime: string;
  spentTime: string;
  isOpenTask: boolean;
  dateRange: string;
}

export const SAMPLE_TASK_DATA: TaskData[] = [
  {
    id: '1',
    projectName: 'DOWNTOWN TOWER BUILD',
    progress: 20,
    description: 'Add a field in the portal to let the user connect their Slack account.',
    status: 'Not Started',
    assignedBy: {
      name: 'Anita Singh',
      avatar: '/avatars/anita-singh.jpg',
    },
    assignedTo: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    allocatedTime: '2 days',
    spentTime: '0 days',
    isOpenTask: true,
    dateRange: 'Jan 21 - Sep 21, 2022',
  },
  {
    id: '2',
    projectName: 'DOWNTOWN TOWER BUILD',
    progress: 20,
    description: 'Add a field in the portal to let the user connect their Slack account.',
    status: 'Not Started',
    assignedBy: {
      name: 'Anita Singh',
      avatar: '/avatars/anita-singh.jpg',
    },
    assignedTo: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    allocatedTime: '2 days',
    spentTime: '0 days',
    isOpenTask: true,
    dateRange: 'Jan 21 - Sep 21, 2022',
  },
  {
    id: '3',
    projectName: 'DOWNTOWN TOWER BUILD',
    progress: 20,
    description: 'Add a field in the portal to let the user connect their Slack account.',
    status: 'Not Started',
    assignedBy: {
      name: 'Anita Singh',
      avatar: '/avatars/anita-singh.jpg',
    },
    assignedTo: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    allocatedTime: '2 days',
    spentTime: '0 days',
    isOpenTask: true,
    dateRange: 'Jan 21 - Sep 21, 2022',
  },
  {
    id: '4',
    projectName: 'DOWNTOWN TOWER BUILD',
    progress: 20,
    description: 'Add a field in the portal to let the user connect their Slack account.',
    status: 'Not Started',
    assignedBy: {
      name: 'Anita Singh',
      avatar: '/avatars/anita-singh.jpg',
    },
    assignedTo: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    allocatedTime: '2 days',
    spentTime: '0 days',
    isOpenTask: true,
    dateRange: 'Jan 21 - Sep 21, 2022',
  },
  {
    id: '5',
    projectName: 'DOWNTOWN TOWER BUILD',
    progress: 20,
    description: 'Add a field in the portal to let the user connect their Slack account.',
    status: 'Not Started',
    assignedBy: {
      name: 'Anita Singh',
      avatar: '/avatars/anita-singh.jpg',
    },
    assignedTo: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    allocatedTime: '2 days',
    spentTime: '0 days',
    isOpenTask: true,
    dateRange: 'Jan 21 - Sep 21, 2022',
  },
  {
    id: '6',
    projectName: 'DOWNTOWN TOWER BUILD',
    progress: 20,
    description: 'Add a field in the portal to let the user connect their Slack account.',
    status: 'Not Started',
    assignedBy: {
      name: 'Anita Singh',
      avatar: '/avatars/anita-singh.jpg',
    },
    assignedTo: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    allocatedTime: '2 days',
    spentTime: '0 days',
    isOpenTask: true,
    dateRange: 'Jan 21 - Sep 21, 2022',
  },
  {
    id: '7',
    projectName: 'DOWNTOWN TOWER BUILD',
    progress: 20,
    description: 'Add a field in the portal to let the user connect their Slack account.',
    status: 'Not Started',
    assignedBy: {
      name: 'Anita Singh',
      avatar: '/avatars/anita-singh.jpg',
    },
    assignedTo: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    allocatedTime: '2 days',
    spentTime: '0 days',
    isOpenTask: true,
    dateRange: 'Jan 21 - Sep 21, 2022',
  },
  {
    id: '8',
    projectName: 'DOWNTOWN TOWER BUILD',
    progress: 20,
    description: 'Add a field in the portal to let the user connect their Slack account.',
    status: 'Not Started',
    assignedBy: {
      name: 'Anita Singh',
      avatar: '/avatars/anita-singh.jpg',
    },
    assignedTo: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    allocatedTime: '2 days',
    spentTime: '0 days',
    isOpenTask: true,
    dateRange: 'Jan 21 - Sep 21, 2022',
  },
];
