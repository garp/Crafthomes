import { Menu } from '@mantine/core';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import { toast } from 'react-toastify';

import {
  useUpdateProjectStatusMutation,
  type TProjectStatus,
} from '../../store/services/project/projectSlice';

const PROJECT_STATUSES: { value: TProjectStatus; label: string; dotColor: string }[] = [
  { value: 'NOT_STARTED', label: 'Not Started', dotColor: 'bg-gray-400' },
  { value: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-blue-500' },
  { value: 'DELAYED', label: 'Delayed', dotColor: 'bg-orange-500' },
  { value: 'COMPLETED', label: 'Completed', dotColor: 'bg-green-500' },
];

const getStatusConfig = (status: string) => {
  const found = PROJECT_STATUSES.find((s) => s.value === status);
  if (found) {
    return { label: found.label, dotColor: found.dotColor };
  }
  return { label: status, dotColor: 'bg-gray-400' };
};

interface ProjectStatusDropdownProps {
  projectId: string;
  currentStatus: string;
}

export default function ProjectStatusDropdown({
  projectId,
  currentStatus,
}: ProjectStatusDropdownProps) {
  const [updateStatus, { isLoading }] = useUpdateProjectStatusMutation();
  const config = getStatusConfig(currentStatus);

  const handleStatusChange = async (newStatus: TProjectStatus) => {
    if (newStatus === currentStatus) return;

    try {
      await updateStatus({ id: projectId, projectStatus: newStatus }).unwrap();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <Menu shadow='sm' width={150} position='bottom-end' withArrow arrowPosition='center'>
      <Menu.Target>
        <button
          disabled={isLoading}
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${isLoading ? 'opacity-50' : ''}`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`} />
          <span className='text-gray-700'>{config.label}</span>
          <IconChevronDown className='size-3.5 text-gray-400' />
        </button>
      </Menu.Target>

      <Menu.Dropdown onClick={(e) => e.stopPropagation()} className='py-1'>
        {PROJECT_STATUSES.map((status) => {
          const isSelected = status.value === currentStatus;

          return (
            <Menu.Item
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              rightSection={isSelected ? <IconCheck className='size-4 text-gray-500' /> : null}
              className='py-2'
            >
              <div className='flex items-center gap-2'>
                <span className={`w-2 h-2 rounded-full shrink-0 ${status.dotColor}`} />
                <span
                  className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}
                >
                  {status.label}
                </span>
              </div>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
