export const senderOptions = [
  { value: 'client', label: 'Client' },
  { value: 'team-member', label: 'Team Member' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'admin', label: 'Admin' },
];

export const messageTypeOptions = [
  { value: 'general', label: 'General' },
  { value: 'project-update', label: 'Project Update' },
  { value: 'task-assignment', label: 'Task Assignment' },
  { value: 'approval', label: 'Approval' },
  { value: 'feedback', label: 'Feedback' },
];

export const projectOptions = [
  { value: 'estate-craft', label: 'Estate Craft' },
  { value: 'property-management', label: 'Property Management' },
  { value: 'construction', label: 'Construction' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const mockMessages = [
  {
    id: 1,
    date: '28 June 2024',
    sender: 'Mr. Sharma',
    senderInitial: 'R',
    type: 'Client',
    project: 'Cozy Retreat',
    messageSnippet:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    isRead: false,
  },
  {
    id: 2,
    date: '28 June 2024',
    sender: 'Mrs. Patel',
    senderInitial: 'P',
    type: 'Client',
    project: 'Urban Heights',
    messageSnippet:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    isRead: true,
  },
  {
    id: 3,
    date: '28 June 2024',
    sender: 'Mr. Kumar',
    senderInitial: 'K',
    type: 'Vendor',
    project: 'Sunset Villa',
    messageSnippet:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    isRead: true,
  },
  {
    id: 4,
    date: '28 June 2024',
    sender: 'Ms. Singh',
    senderInitial: 'S',
    type: 'Team Member',
    project: 'Luxury Apartments',
    messageSnippet:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    isRead: true,
  },
  {
    id: 5,
    date: '28 June 2024',
    sender: 'Mr. Gupta',
    senderInitial: 'G',
    type: 'Client',
    project: 'Modern Complex',
    messageSnippet:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    isRead: true,
  },
  {
    id: 6,
    date: '28 June 2024',
    sender: 'Mrs. Reddy',
    senderInitial: 'R',
    type: 'Vendor',
    project: 'Cozy Retreat',
    messageSnippet:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    isRead: false,
  },
  {
    id: 7,
    date: '28 June 2024',
    sender: 'Mr. Verma',
    senderInitial: 'V',
    type: 'Team Member',
    project: 'Urban Heights',
    messageSnippet:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    isRead: true,
  },
  {
    id: 8,
    date: '28 June 2024',
    sender: 'Ms. Joshi',
    senderInitial: 'J',
    type: 'Client',
    project: 'Sunset Villa',
    messageSnippet:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    isRead: true,
  },
];
