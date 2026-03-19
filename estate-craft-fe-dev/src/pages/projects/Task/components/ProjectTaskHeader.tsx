import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SegmentedControl, Checkbox } from '@mantine/core';
import { IconLayoutGrid, IconList } from '@tabler/icons-react';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import { useDisclosure } from '@mantine/hooks';
import TableSearchBar from '../../../../components/common/TableSearchBar';
import StatusFilter from '../../../../components/common/selectors/StatusSelector';
import TimelineSelector from '../../../../components/common/selectors/TimelineSelector';
import PhaseSelector from '../../../../components/common/selectors/PhaseSelector';
import { statusOptions } from '../../../tasks/constants/constants';
import { Button } from '../../../../components';
import ClearFilterButton from '../../../../components/base/button/ClearFilterButton';
import { AddTaskSidebar } from '../../../../components/common/Task/AddTaskSidebar';

type ViewMode = 'card' | 'list';

interface ProjectTaskHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ProjectTaskHeader({ viewMode, onViewModeChange }: ProjectTaskHeaderProps) {
  const { id: projectId } = useParams();
  const [, setSearchParams] = useSearchParams();
  const { getParam, setParams, deleteParams } = useUrlSearchParams();
  const [query, setQuery] = useState(getParam('query') || '');
  const selectedTimelineId = getParam('timelineId');
  const selectedPhaseId = getParam('phaseId');
  const assignedToMe = getParam('assignedToMe') === 'true';
  const approvalPending = getParam('approvalPending') === 'true';

  function handleClearAll() {
    deleteParams([
      'query',
      'status',
      'globalQuery',
      'timelineId',
      'phaseId',
      'assignedToMe',
      'approvalPending',
    ]);
    setQuery('');
  }

  function handleTimelineChange(timelineId: string | null) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (timelineId) {
          next.set('timelineId', timelineId);
        } else {
          next.delete('timelineId');
        }
        next.delete('phaseId');
        return next;
      },
      { replace: true },
    );
  }

  function handleAssignedToMeChange(checked: boolean) {
    if (checked) setParams('assignedToMe', 'true');
    else deleteParams(['assignedToMe']);
  }

  function handleApprovalPendingChange(checked: boolean) {
    if (checked) setParams('approvalPending', 'true');
    else deleteParams(['approvalPending']);
  }

  const [isOpenAddTaskSidebar, { open: openAddTaskSidebar, close: closeAddTaskSidebar }] =
    useDisclosure(false);

  return (
    <>
      <h6 className='font-bold text-xl tracking-tight'>TASKS</h6>

      {/* Row 1: Search + filters in one horizontal row */}
      <div className='flex flex-wrap items-center gap-5 mt-4'>
        <div className='min-w-[180px] max-w-[260px] focus-within:min-w-[260px] focus-within:max-w-[320px] transition-[min-width,max-width] duration-200 ease-out flex-1'>
          <TableSearchBar
            className='border rounded-md shadow-sm'
            query={query}
            setQuery={setQuery}
          />
        </div>
        <div className='w-[160px] shrink-0'>
          <StatusFilter
            inputClassName='!border !border-border-light rounded-md'
            options={statusOptions}
          />
        </div>
        <div className='w-[160px] shrink-0'>
          <TimelineSelector
            projectId={projectId}
            value={selectedTimelineId || null}
            setValue={handleTimelineChange}
            inputClassName='!border !border-border-light rounded-md'
            allowFilter
          />
        </div>
        <div className='w-[160px] shrink-0'>
          <PhaseSelector
            projectId={projectId}
            timelineId={selectedTimelineId || undefined}
            value={selectedPhaseId || null}
            setValue={(val) => setParams('phaseId', val)}
            inputClassName='!border !border-border-light rounded-md'
            allowFilter
          />
        </div>
        <ClearFilterButton className='border shrink-0' onClick={handleClearAll} />
      </div>

      {/* Row 2: Assigned to me | View toggle + Create Task */}
      <div className='flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-border-light'>
        <div className='flex flex-wrap items-center gap-4'>
          <Checkbox
            label='Assigned to me'
            checked={assignedToMe}
            onChange={(e) => handleAssignedToMeChange(e.currentTarget.checked)}
            color='dark.6'
            iconColor='white'
            classNames={{
              label: 'text-sm text-gray-700 cursor-pointer',
            }}
          />
          <Checkbox
            label='Approval Pending'
            checked={approvalPending}
            onChange={(e) => handleApprovalPendingChange(e.currentTarget.checked)}
            color='dark.6'
            iconColor='white'
            classNames={{
              label: 'text-sm text-gray-700 cursor-pointer',
            }}
          />
        </div>
        <div className='flex items-center gap-3'>
          <SegmentedControl
            value={viewMode}
            onChange={(value) => onViewModeChange(value as ViewMode)}
            data={[
              {
                value: 'card',
                label: (
                  <div className='flex items-center gap-2'>
                    <IconLayoutGrid className='size-4' />
                    <span>Card</span>
                  </div>
                ),
              },
              {
                value: 'list',
                label: (
                  <div className='flex items-center gap-2'>
                    <IconList className='size-4' />
                    <span>List</span>
                  </div>
                ),
              },
            ]}
            classNames={{
              root: 'bg-gray-100',
              indicator: 'bg-white shadow-sm',
            }}
          />
          <Button onClick={openAddTaskSidebar} radius='full' className='px-8'>
            Create Task
          </Button>
        </div>
      </div>

      <AddTaskSidebar
        isOpen={isOpenAddTaskSidebar}
        onClose={closeAddTaskSidebar}
        fixedProjectId={projectId ?? undefined}
      />
    </>
  );
}
