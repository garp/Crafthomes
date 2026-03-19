import { useState } from 'react';
import { toast } from 'react-toastify';
import { DateInput } from '@mantine/dates';
import { IconCalendarWeek } from '@tabler/icons-react';
import { format } from 'date-fns';

import SidebarModal from '../../../components/base/SidebarModal';
import FormLabel from '../../../components/base/FormLabel';
import RichTextEditorDescription from '../../../components/common/RichTextEditorDescription';
import FormTimePicker from '../../../components/base/FormTimePicker';
import FormDurationPicker from '../../../components/base/FormDurationPicker';
import FormMultiSelect from '../../../components/base/FormMultiSelect';
import { Button } from '../../../components';
import { useCreateTimesheetMutation } from '../../../store/services/timesheet/timesheetSlice';
import { useGetProjectsQuery } from '../../../store/services/project/projectSlice';
import { useGetProjectTasksQuery } from '../../../store/services/task/taskSlice';
import FormSelect from '../../../components/base/FormSelect';

type TAddTimesheetSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AddTimesheetSidebar({ isOpen, onClose }: TAddTimesheetSidebarProps) {
  const [createTimesheet, { isLoading }] = useCreateTimesheetMutation();
  const { data: projectsData } = useGetProjectsQuery({ pageLimit: '100' });

  const [formData, setFormData] = useState<{
    projectId: string;
    taskIds: string[];
    date: Date | null;
    startTime: string;
    duration: string;
    endTime: string;
    description: string;
  }>({
    projectId: '',
    taskIds: [],
    date: null,
    startTime: '',
    duration: '',
    endTime: '',
    description: '',
  });

  // Fetch tasks assigned to the current user
  const { data: tasksData, isLoading: isLoadingTasks } = useGetProjectTasksQuery({
    pageLimit: '100',
    assignedToMe: true,
  });

  const projectOptions =
    projectsData?.projects?.map((p) => ({
      label: p.name,
      value: p.id,
    })) ?? [];

  const taskOptions =
    tasksData?.tasks?.map((t) => ({
      label: t.name,
      value: t.id,
    })) ?? [];

  // Helper: Convert HH:mm to total minutes from midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Build ISO string for a given date + local time (HH:mm). Avoids sending local time as UTC which shifts display in other TZ.
  const localDateAndTimeToISO = (date: Date, timeHHmm: string): string => {
    const [hours, minutes] = timeHHmm.split(':').map(Number);
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
    return d.toISOString();
  };

  // Helper: Convert total minutes to HH:mm format
  const minutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Calculate endTime when startTime or duration changes
  const handleStartTimeChange = (startTime: string) => {
    setFormData((prev) => {
      const newState = { ...prev, startTime };
      // If duration exists, calculate endTime
      if (prev.duration && startTime) {
        const startMinutes = timeToMinutes(startTime);
        const durationMinutes = parseInt(prev.duration, 10);
        const endMinutes = startMinutes + durationMinutes;
        newState.endTime = minutesToTime(endMinutes);
      }
      return newState;
    });
  };

  const handleDurationChange = (duration: string) => {
    setFormData((prev) => {
      const newState = { ...prev, duration };
      // If startTime exists, calculate endTime
      if (prev.startTime && duration) {
        const startMinutes = timeToMinutes(prev.startTime);
        const durationMinutes = parseInt(duration, 10);
        const endMinutes = startMinutes + durationMinutes;
        newState.endTime = minutesToTime(endMinutes);
      }
      return newState;
    });
  };

  const handleEndTimeChange = (endTime: string) => {
    setFormData((prev) => {
      const newState = { ...prev, endTime };
      // If startTime exists, calculate duration
      if (prev.startTime && endTime) {
        const startMinutes = timeToMinutes(prev.startTime);
        let endMinutes = timeToMinutes(endTime);
        // Handle overnight (endTime is next day)
        if (endMinutes < startMinutes) {
          endMinutes += 24 * 60;
        }
        const durationMinutes = endMinutes - startMinutes;
        if (durationMinutes > 0) {
          newState.duration = durationMinutes.toString();
        }
      }
      return newState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.startTime) {
      toast.error('Please fill in date and start time');
      return;
    }

    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const startTimeStr = localDateAndTimeToISO(formData.date, formData.startTime);

      const basePayload = {
        projectId: formData.projectId || undefined,
        date: dateStr,
        startTime: startTimeStr,
        duration: formData.duration ? parseInt(formData.duration, 10) : undefined,
        endTime: formData.endTime
          ? localDateAndTimeToISO(formData.date, formData.endTime)
          : undefined,
        description: formData.description || undefined,
      };

      await createTimesheet({
        ...basePayload,
        taskIds: formData.taskIds.length > 0 ? formData.taskIds : undefined,
      }).unwrap();
      toast.success('Timesheet entry created successfully');

      setFormData({
        projectId: '',
        taskIds: [],
        date: null,
        startTime: '',
        duration: '',
        endTime: '',
        description: '',
      });
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create timesheet entry');
      console.error('Error creating timesheet:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      projectId: '',
      taskIds: [],
      date: null,
      startTime: '',
      duration: '',
      endTime: '',
      description: '',
    });
    onClose();
  };

  // Duration options in hours:minutes format
  return (
    <SidebarModal heading='Add Time Entry' opened={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className='flex flex-col h-full'>
        <div className='flex flex-col gap-5 p-6 flex-1'>
          {/* Project */}
          <div className='flex flex-col gap-2'>
            <FormLabel htmlFor='projectId'>Project</FormLabel>
            <FormSelect
              placeholder='Select Project'
              value={formData.projectId}
              onChange={(value) => setFormData((prev) => ({ ...prev, projectId: value || '' }))}
              options={projectOptions}
              clearable
            />
          </div>

          {/* Tasks (Multi-select) */}
          <div className='flex flex-col gap-2'>
            <FormLabel>Tasks</FormLabel>
            <FormMultiSelect
              placeholder={isLoadingTasks ? 'Loading tasks...' : 'Select Tasks'}
              value={formData.taskIds}
              onChange={(value) => setFormData((prev) => ({ ...prev, taskIds: value }))}
              options={taskOptions}
              disabled={isLoadingTasks}
            />
          </div>

          {/* From: Date + Time */}
          <div className='flex flex-col gap-2'>
            <FormLabel>From *</FormLabel>
            <div className='flex items-center gap-3'>
              <div className='flex-1'>
                <DateInput
                  placeholder='Select Date'
                  value={formData.date}
                  onChange={(value) => {
                    const date = value
                      ? typeof value === 'string'
                        ? new Date(value)
                        : value
                      : null;
                    setFormData((prev) => ({ ...prev, date }));
                  }}
                  rightSection={<IconCalendarWeek className='text-gray-400 size-5' />}
                  classNames={{
                    input: '!py-2.5 !font-medium !border-gray-300',
                  }}
                />
              </div>
              <div className='flex-1'>
                <FormTimePicker
                  placeholder='Select Time'
                  value={formData.startTime}
                  onChange={handleStartTimeChange}
                />
              </div>
            </div>
          </div>

          {/* Duration / End */}
          <div className='flex flex-col gap-2'>
            <FormLabel>Duration / End</FormLabel>
            <div className='flex items-center gap-3'>
              <div className='flex-1'>
                <FormDurationPicker
                  placeholder='0:00'
                  value={formData.duration}
                  onChange={(value) => handleDurationChange(value)}
                />
              </div>
              <div className='flex-1'>
                <FormTimePicker
                  placeholder='End Time'
                  value={formData.endTime}
                  onChange={handleEndTimeChange}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className='flex flex-col gap-2'>
            <FormLabel>Description</FormLabel>
            <RichTextEditorDescription
              value={formData.description}
              setValue={(val) => setFormData((prev) => ({ ...prev, description: val }))}
              placeholder='Add description...'
              imageFolder='timesheet-description-images'
            />
          </div>
        </div>

        {/* Buttons at bottom right */}
        <div className='flex justify-end gap-3 p-6 border-t border-gray-200 mt-auto'>
          <Button type='button' variant='outline' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Add Time'}
          </Button>
        </div>
      </form>
    </SidebarModal>
  );
}
