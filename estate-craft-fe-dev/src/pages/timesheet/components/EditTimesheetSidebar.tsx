import { useState, useEffect } from 'react';
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
import { useUpdateTimesheetMutation } from '../../../store/services/timesheet/timesheetSlice';
import { useGetProjectsQuery } from '../../../store/services/project/projectSlice';
import { useGetProjectTasksQuery } from '../../../store/services/task/taskSlice';
import FormSelect from '../../../components/base/FormSelect';
import type { TTimesheet } from '../../../store/types/timesheet.types';

type TEditTimesheetSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  timesheet: TTimesheet | null;
};

export default function EditTimesheetSidebar({
  isOpen,
  onClose,
  timesheet,
}: TEditTimesheetSidebarProps) {
  const [updateTimesheet, { isLoading }] = useUpdateTimesheetMutation();
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

  useEffect(() => {
    if (timesheet) {
      const dateVal = timesheet.date ? new Date(timesheet.date) : null;
      const startTimeVal = timesheet.startTime
        ? format(new Date(timesheet.startTime), 'HH:mm')
        : '';
      const endTimeVal = timesheet.endTime ? format(new Date(timesheet.endTime), 'HH:mm') : '';

      const rawDurationMinutes = timesheet.durationMinutes ?? timesheet.duration;
      let durationVal =
        rawDurationMinutes === null || rawDurationMinutes === undefined
          ? ''
          : rawDurationMinutes.toString();

      // If start/end exist, prefer deriving duration (handles overnight)
      // This avoids cases where backend returns duration=0/null even though endTime exists.
      if (startTimeVal && endTimeVal) {
        const startMinutes = timeToMinutes(startTimeVal);
        let endMinutes = timeToMinutes(endTimeVal);
        if (endMinutes < startMinutes) endMinutes += 24 * 60;
        const diff = endMinutes - startMinutes;
        if (diff > 0) durationVal = diff.toString();
      }

      // If endTime is missing but start + duration exist, derive endTime
      const computedEndTime =
        !endTimeVal && startTimeVal && durationVal
          ? minutesToTime(timeToMinutes(startTimeVal) + parseInt(durationVal, 10))
          : endTimeVal;

      setFormData({
        projectId: timesheet.projectId || '',
        taskIds: timesheet.taskIds?.length
          ? timesheet.taskIds
          : timesheet.tasks?.length
            ? timesheet.tasks.map((t) => t.id)
            : timesheet.taskId
              ? [timesheet.taskId]
              : [],
        date: dateVal,
        startTime: startTimeVal,
        duration: durationVal,
        endTime: computedEndTime,
        description: timesheet.description || '',
      });
    }
  }, [timesheet]);

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

  // Build ISO string for a given date + local time (HH:mm). Avoids sending local time as UTC which shifts display in other TZ.
  const localDateAndTimeToISO = (date: Date, timeHHmm: string): string => {
    const [hours, minutes] = timeHHmm.split(':').map(Number);
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
    return d.toISOString();
  };

  // Helper: Convert HH:mm to total minutes from midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
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

  // Duration options in hours:minutes format
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!timesheet?.id) {
      toast.error('No timesheet selected');
      return;
    }

    try {
      const body: Record<string, any> = {};

      if (formData.projectId) body.projectId = formData.projectId;
      if (formData.taskIds.length > 0) body.taskIds = formData.taskIds;
      if (formData.date) body.date = format(formData.date, 'yyyy-MM-dd');
      if (formData.date && formData.startTime) {
        body.startTime = localDateAndTimeToISO(formData.date, formData.startTime);
      }
      if (formData.duration) body.duration = parseInt(formData.duration, 10);
      if (formData.date && formData.endTime) {
        body.endTime = localDateAndTimeToISO(formData.date, formData.endTime);
      }
      if (formData.description) body.description = formData.description;

      await updateTimesheet({ id: timesheet.id, body }).unwrap();

      toast.success('Timesheet entry updated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update timesheet entry');
      console.error('Error updating timesheet:', error);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!timesheet) return null;

  return (
    <SidebarModal heading='Edit Time Entry' opened={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className='flex flex-col h-full'>
        <div className='flex flex-col gap-5 p-6 flex-1'>
          {/* Project */}
          <div className='flex flex-col gap-2'>
            <FormLabel>Project</FormLabel>
            <FormSelect
              placeholder='Select Project'
              value={formData.projectId}
              onChange={(value) => setFormData((prev) => ({ ...prev, projectId: value || '' }))}
              options={projectOptions}
            />
          </div>

          {/* Task */}
          <div className='flex flex-col gap-2'>
            <FormLabel>Task</FormLabel>
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
            <FormLabel>From</FormLabel>
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
            {isLoading ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </form>
    </SidebarModal>
  );
}
