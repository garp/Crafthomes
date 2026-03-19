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

export const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];
