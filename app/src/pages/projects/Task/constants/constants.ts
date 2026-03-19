export const BREADCRUMB_DATA = [
  {
    title: 'Home',
    link: '/',
  },
  {
    title: 'Project Name',
    link: '/projects',
  },
  {
    title: 'Tasks',
    link: '/projects/task',
  },
];

export const createTaskData = {
  title: 'Get Started with Task',
  subtitle:
    'It looks like you don’t have any tasks yet. Let’s create your first task to get started!',
  heading: 'TASKS',
  buttonText: 'Create Task',
  link: '/projects/task/create-task',
};

export const durationOptions = [
  { value: '1 Day', label: '1 Day' },
  { value: '2 Days', label: '2 Days' },
  { value: '1 Week', label: '1 Week' },
];

export const assigneeOptions = [
  { value: 'member1', label: 'Member 1' },
  { value: 'member2', label: 'Member 2' },
];

export const unitOptions = [
  { value: 'unit1', label: 'Unit 1' },
  { value: 'unit2', label: 'Unit 2' },
];

export const tasks = Array.from({ length: 10 }).map(() => ({
  taskId: '1234-09',
  taskName: 'Signup Formalities',
  duration: '3 days',
  plannedStart: '26 Nov 2025',
  plannedEnd: '29 Nov 2025',
  assignedTo: 'Jai Singh',
  assignedBy: 'Kavin',
  status: 'in-progress',
  progress: '25%',
}));

// export const statusOptions = [
//   { value: 'IN_PROGRESS', label: 'In-progress' },
//   { value: 'COMPLETED', label: 'Completed' },
//   { value: 'PENDGIN', label: 'Pending' },
// ];
export const progressOptions = [
  { value: '25%', label: '25%' },
  { value: '50%', label: '50%' },
  { value: '100%', label: '100%' },
];
