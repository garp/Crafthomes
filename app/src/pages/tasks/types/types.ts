export interface TaskCardProps {
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
  onOpenTaskChange?: (checked: boolean) => void;
}
