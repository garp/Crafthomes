import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { IconCalendarWeek, IconPencil, IconTrash, IconChecklist } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

import Container from '../../components/common/Container';
import { BoxJumpLoader, Button } from '../../components';
import FormSelect from '../../components/base/FormSelect';
import IconButton from '../../components/base/button/IconButton';
import AlertModal from '../../components/base/AlertModal';

import {
  useGetTimesheetsQuery,
  useDeleteTimesheetMutation,
  useSubmitTimesheetWeekMutation,
} from '../../store/services/timesheet/timesheetSlice';
import { useGetProjectsQuery } from '../../store/services/project/projectSlice';
import type { TTimesheet } from '../../store/types/timesheet.types';

import AddTimesheetSidebar from './components/AddTimesheetSidebar';
import EditTimesheetSidebar from './components/EditTimesheetSidebar';
import TimesheetExportModal from '../../components/common/TimesheetExportModal';

type TTimesheetStatCardProps = {
  label: string;
  value: string;
  iconBgClass: string;
  icon: React.ReactNode;
};

function TimesheetStatCard({ label, value, iconBgClass, icon }: TTimesheetStatCardProps) {
  return (
    <div className='flex items-center gap-3 border border-gray-200 rounded-lg px-5 py-4 bg-white'>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgClass}`}
        aria-hidden
      >
        {icon}
      </div>
      <div className='flex flex-col'>
        <p className='text-xs text-gray-500'>{label}</p>
        <p className='text-base font-semibold text-gray-900'>{value}</p>
      </div>
    </div>
  );
}

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '-';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}:${mins.toString().padStart(2, '0')}`;
}

function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  try {
    return format(new Date(isoString), 'hh:mm a');
  } catch {
    return '-';
  }
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  try {
    return format(new Date(isoString), 'yyyy-MM-dd');
  } catch {
    return '-';
  }
}

export default function TimesheetPage() {
  const navigate = useNavigate();
  // Filters
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [filterProjectId, setFilterProjectId] = useState('');

  // Selected timesheet for edit/delete
  const [selectedTimesheet, setSelectedTimesheet] = useState<TTimesheet | null>(null);

  // Sidebar/modal states
  const [isAddOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [isEditOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [isDeleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [isExportOpen, { open: openExport, close: closeExport }] = useDisclosure(false);

  // API hooks
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    isFetching: isFetchingProjects,
  } = useGetProjectsQuery({ pageLimit: '100' });
  const {
    data: timesheetsData,
    isLoading,
    isFetching,
  } = useGetTimesheetsQuery({
    projectId: filterProjectId || undefined,
    fromDate: dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : undefined,
    toDate: dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : undefined,
    pageLimit: '50',
  });
  const [deleteTimesheet, { isLoading: isDeleting }] = useDeleteTimesheetMutation();
  const [submitWeek, { isLoading: isSubmittingWeek }] = useSubmitTimesheetWeekMutation();

  const projectOptions =
    projectsData?.projects?.map((p) => ({
      label: p.name,
      value: p.id,
    })) ?? [];

  const timesheets = timesheetsData?.timesheets ?? [];
  const isProjectsLoading = isLoadingProjects || isFetchingProjects;
  const isTableLoading = isLoading || isFetching || isProjectsLoading;

  // Fallback stats (in case backend stats is missing)
  const fallbackTotalMinutes = timesheets.reduce(
    (sum, t) => sum + (t.durationMinutes ?? t.duration ?? 0),
    0,
  );
  const formatTotalTime = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const headerStats = timesheetsData?.stats;
  const todayFormatted = headerStats?.today?.formatted ?? formatTotalTime(fallbackTotalMinutes);
  const weekFormatted = headerStats?.thisWeek?.formatted ?? formatTotalTime(fallbackTotalMinutes);
  const monthFormatted = headerStats?.thisMonth?.formatted ?? formatTotalTime(fallbackTotalMinutes);
  const fyFormatted =
    headerStats?.thisFinancialYear?.formatted ?? formatTotalTime(fallbackTotalMinutes);

  const handleDelete = async () => {
    if (!selectedTimesheet?.id) return;

    try {
      await deleteTimesheet({ id: selectedTimesheet.id }).unwrap();
      toast.success('Timesheet entry deleted successfully');
      closeDelete();
      setSelectedTimesheet(null);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete timesheet entry');
      console.error('Error deleting timesheet:', error);
    }
  };

  const handleSubmitWeek = async () => {
    try {
      await submitWeek({}).unwrap();
      toast.success('All pending timesheet entries submitted for approval');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit timesheets');
      console.error('Error submitting timesheets:', error);
    }
  };

  const getProjectName = (projectId: string | null | undefined) => {
    if (!projectId) return '-';
    const project = projectsData?.projects?.find((p) => p.id === projectId);
    return project?.name || 'Unknown project';
  };

  return (
    <>
      <Container className='gap-4 h-full'>
        <h6 className='font-bold text-sm'>TIMESHEET</h6>
        <hr className='border border-gray-200' />

        {/* Stats */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <TimesheetStatCard
            label='Working hours today'
            value={todayFormatted}
            iconBgClass='bg-emerald-50'
            icon={<span className='w-4 h-4 rounded-full bg-emerald-500' />}
          />
          <TimesheetStatCard
            label='Working hours this week'
            value={weekFormatted}
            iconBgClass='bg-blue-50'
            icon={<span className='w-4 h-4 rounded bg-blue-500' />}
          />
          <TimesheetStatCard
            label='Working hours this month'
            value={monthFormatted}
            iconBgClass='bg-orange-50'
            icon={<span className='w-4 h-4 rounded bg-orange-500' />}
          />
          <TimesheetStatCard
            label='Working hours this financial year'
            value={fyFormatted}
            iconBgClass='bg-violet-50'
            icon={<span className='w-4 h-4 rounded bg-violet-500' />}
          />
        </div>

        {/* Filters + actions */}
        <div className='flex items-center justify-between gap-4 flex-wrap'>
          <div className='flex items-center gap-3 flex-wrap'>
            <div className='flex flex-col gap-1 min-w-64'>
              <label className='text-[11px] text-gray-500'>Select Date Range</label>
              <DatePickerInput
                type='range'
                placeholder='Select date range'
                value={dateRange}
                onChange={(value) => {
                  const [from, to] = value;
                  const fromDate = from ? (typeof from === 'string' ? new Date(from) : from) : null;
                  const toDate = to ? (typeof to === 'string' ? new Date(to) : to) : null;
                  setDateRange([fromDate, toDate]);
                }}
                clearable
                rightSection={<IconCalendarWeek className='text-gray-400 size-5' />}
                styles={{
                  weekday: { color: '#000' },
                  calendarHeaderLevel: { color: '#000' },
                  calendarHeaderControl: { color: '#000' },
                  day: { color: '#000' },
                }}
                classNames={{
                  input: '!h-10 !font-medium !border-gray-300 !rounded-lg',
                }}
              />
            </div>
            <div className='flex flex-col gap-1 min-w-56'>
              <label className='text-[11px] text-gray-500'>Project</label>
              <FormSelect
                placeholder='All Projects'
                value={filterProjectId}
                onChange={(value) => setFilterProjectId(value || '')}
                options={[{ label: 'All Projects', value: '' }, ...projectOptions]}
                clearable
              />
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <Button
              size='md'
              variant='outline'
              radius='full'
              className='bg-white'
              leftIcon={<IconChecklist className='size-5' />}
              onClick={() => navigate('/timesheet/approvals')}
            >
              Approvals
            </Button>
            <Button
              size='md'
              variant='outline'
              radius='full'
              className='bg-white'
              onClick={openExport}
            >
              Export
            </Button>
            <Button
              size='md'
              variant='outline'
              radius='full'
              className='bg-white'
              onClick={handleSubmitWeek}
              disabled={isSubmittingWeek}
            >
              {isSubmittingWeek ? 'Submitting...' : 'Submit all pending'}
            </Button>
            <Button size='md' radius='full' onClick={openAdd}>
              Add Time
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className='mt-2 overflow-x-auto'>
          <table className='min-w-full bg-white border border-gray-200 rounded-lg'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8'>
                  <input type='checkbox' className='rounded border-gray-300' />
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Project Name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Date
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Start Time
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  End Time
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Hours
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {isTableLoading ? (
                <tr>
                  <td colSpan={8} className='px-6 py-10'>
                    <div className='flex items-center justify-center'>
                      <BoxJumpLoader size='sm' />
                    </div>
                  </td>
                </tr>
              ) : timesheets.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-6 py-10 text-center text-gray-500'>
                    No timesheet entries found
                  </td>
                </tr>
              ) : (
                timesheets.map((ts) => {
                  const isLocked = ts.status && ts.status !== 'PENDING';
                  return (
                    <tr key={ts.id} className='hover:bg-gray-50 transition-colors'>
                      <td className='px-6 py-4'>
                        <input type='checkbox' className='rounded border-gray-300' />
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-900'>
                        {getProjectName(ts.projectId)}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{formatDate(ts.date)}</td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {formatTime(ts.startTime)}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{formatTime(ts.endTime)}</td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {formatDuration(ts.durationMinutes ?? ts.duration)}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{ts.status || 'PENDING'}</td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        <div className='flex items-center gap-2'>
                          <IconButton
                            onClick={() => {
                              setSelectedTimesheet(ts);
                              openEdit();
                            }}
                            className='hover:bg-gray-100 p-1.5 rounded'
                            title='Edit'
                            disabled={isLocked}
                          >
                            <IconPencil className='size-4 text-gray-600' />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setSelectedTimesheet(ts);
                              openDelete();
                            }}
                            className='hover:bg-gray-100 p-1.5 rounded'
                            title='Delete'
                            disabled={isLocked}
                          >
                            <IconTrash className='size-4 text-red-500' />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Container>

      {/* Add Timesheet Sidebar */}
      <AddTimesheetSidebar isOpen={isAddOpen} onClose={closeAdd} />

      {/* Edit Timesheet Sidebar */}
      <EditTimesheetSidebar isOpen={isEditOpen} onClose={closeEdit} timesheet={selectedTimesheet} />

      {/* Delete Confirmation Modal */}
      <AlertModal
        title='Delete Timesheet Entry?'
        subtitle='This action cannot be undone.'
        opened={isDeleteOpen}
        onClose={closeDelete}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        isDeleting={isDeleting}
      />

      {/* Export Modal */}
      <TimesheetExportModal
        opened={isExportOpen}
        onClose={closeExport}
        timesheets={timesheets}
        projects={projectsData?.projects}
      />
    </>
  );
}
