import { useState } from 'react';
import { toast } from 'react-toastify';
import { DatePickerInput } from '@mantine/dates';
import { format } from 'date-fns';
import { IconCheck, IconReceipt, IconX, IconEye } from '@tabler/icons-react';
import { Textarea, Collapse } from '@mantine/core';

import Container from '../../components/common/Container';
import { Button } from '../../components';
import FormSelect from '../../components/base/FormSelect';
import FormLabel from '../../components/base/FormLabel';
import Spinner from '../../components/common/loaders/Spinner';
import AlertModal from '../../components/base/AlertModal';
import IconButton from '../../components/base/button/IconButton';
import { getUser } from '../../utils/auth';
import { useGetUsersQuery } from '../../store/services/user/userSlice';

import {
  useGetTimesheetApprovalsQuery,
  useDecideTimesheetWeekMutation,
  useDecideTimesheetEntryMutation,
} from '../../store/services/timesheet/timesheetSlice';

import EditTimesheetSidebar from './components/EditTimesheetSidebar';

import type { TTimesheetWeekStatus, TTimesheet } from '../../store/types/timesheet.types';

const STATUS_OPTIONS: { label: string; value: TTimesheetWeekStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Billed', value: 'BILLED' },
];

export default function TimesheetApprovalsPage() {
  const [weekStartDate, setWeekStartDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<TTimesheetWeekStatus | ''>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [expandedWeekId, setExpandedWeekId] = useState<string>('');

  // Edit timesheet state
  const [editTimesheet, setEditTimesheet] = useState<TTimesheet | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Rejection modal state (for week-level bulk rejection)
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectWeekId, setRejectWeekId] = useState<string>('');
  const [rejectComment, setRejectComment] = useState<string>('');

  // Rejection modal state (for individual entry rejection)
  const [rejectEntryModalOpen, setRejectEntryModalOpen] = useState(false);
  const [rejectEntryId, setRejectEntryId] = useState<string>('');
  const [rejectEntryComment, setRejectEntryComment] = useState<string>('');

  const currentUser = getUser();
  const currentUserId = currentUser?.id || '';

  const { data: internalUsersData, isFetching: isFetchingUsers } = useGetUsersQuery(
    {
      pageLimit: '200',
      status: 'ACTIVE',
      userType: 'INTERNAL',
    },
    { skip: !currentUserId },
  );

  const directReports =
    internalUsersData?.users?.filter((u) => u.reportsToId === currentUserId) ?? [];

  const employeeOptions = directReports.map((u) => ({
    label: u.name,
    value: u.id,
  }));

  const { data, isLoading, isFetching, refetch } = useGetTimesheetApprovalsQuery({
    weekStartDate: weekStartDate ? format(weekStartDate, 'yyyy-MM-dd') : undefined,
    status: status || undefined,
    employeeId: employeeId || undefined,
    pageLimit: '50',
  });

  const [decideWeek, { isLoading: isDeciding }] = useDecideTimesheetWeekMutation();
  const [decideEntry, { isLoading: isDecidingEntry }] = useDecideTimesheetEntryMutation();

  const weeks = data?.weeks ?? [];
  const isRefreshing = isLoading || isFetching;

  const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    // ISO: 2026-02-04T00:00:00.000Z -> HH:mm
    return String(iso).slice(11, 16) || '—';
  };

  // Week-level bulk rejection modal handlers
  const openRejectModal = (weekId: string) => {
    setRejectWeekId(weekId);
    setRejectComment('');
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setRejectWeekId('');
    setRejectComment('');
  };

  const confirmReject = async () => {
    if (!rejectComment.trim()) {
      toast.error('Rejection comment is required');
      return;
    }

    try {
      await decideWeek({
        id: rejectWeekId,
        body: { action: 'REJECT', comment: rejectComment.trim() },
      }).unwrap();
      toast.success('Timesheet week rejected');
      closeRejectModal();
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject timesheet');
      console.error('Timesheet rejection error:', error);
    }
  };

  // Individual entry rejection modal handlers
  const openRejectEntryModal = (entryId: string) => {
    setRejectEntryId(entryId);
    setRejectEntryComment('');
    setRejectEntryModalOpen(true);
  };

  const closeRejectEntryModal = () => {
    setRejectEntryModalOpen(false);
    setRejectEntryId('');
    setRejectEntryComment('');
  };

  const confirmRejectEntry = async () => {
    if (!rejectEntryComment.trim()) {
      toast.error('Rejection comment is required');
      return;
    }

    try {
      await decideEntry({
        id: rejectEntryId,
        body: { action: 'REJECT', comment: rejectEntryComment.trim() },
      }).unwrap();
      toast.success('Timesheet entry rejected');
      closeRejectEntryModal();
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject entry');
      console.error('Entry rejection error:', error);
    }
  };

  // Handle individual entry approval
  const handleApproveEntry = async (entryId: string) => {
    try {
      await decideEntry({
        id: entryId,
        body: { action: 'APPROVE' },
      }).unwrap();
      toast.success('Timesheet entry approved');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to approve entry');
      console.error('Entry approval error:', error);
    }
  };

  // Edit timesheet handlers
  const handleEditEntry = (entry: any) => {
    setEditTimesheet(entry as TTimesheet);
    setIsEditOpen(true);
  };

  const closeEditSidebar = () => {
    setIsEditOpen(false);
    setEditTimesheet(null);
    refetch();
  };

  const handleDecision = async (weekId: string, action: 'APPROVE' | 'REJECT' | 'BILL') => {
    if (action === 'REJECT') {
      openRejectModal(weekId);
      return;
    }

    try {
      let billingRef: string | undefined;
      if (action === 'BILL') {
        billingRef = window.prompt('Billing reference (optional)') || '';
      }

      await decideWeek({ id: weekId, body: { action, billingRef } }).unwrap();
      toast.success(`Week ${action.toLowerCase()}d`);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update week status');
      console.error('Timesheet week decision error:', error);
    }
  };

  // Handle smooth expand/collapse with animation
  const toggleExpand = (weekId: string) => {
    setExpandedWeekId((prev) => (prev === weekId ? '' : weekId));
  };

  return (
    <Container className='gap-4 h-full'>
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <h6 className='font-bold text-sm'>TIMESHEET APPROVALS</h6>
        <Button
          variant='light'
          onClick={() => refetch()}
          disabled={isRefreshing}
          className='min-w-24 bg-white border border-gray-200 hover:bg-gray-50'
          leftIcon={isRefreshing ? <Spinner className='w-4 h-4' /> : undefined}
        >
          {isRefreshing ? <span className='sr-only'>Refreshing</span> : 'Refresh'}
        </Button>
      </div>

      <hr className='border border-gray-200' />

      {/* Filters */}
      <div className='flex items-end gap-4 flex-wrap'>
        <div className='flex flex-col gap-1 min-w-64'>
          <FormLabel htmlFor='employeeId'>Employee</FormLabel>
          <FormSelect
            placeholder='All'
            value={employeeId}
            onChange={(v) => setEmployeeId((v as any) || '')}
            options={employeeOptions}
            clearable
            disabled={isFetchingUsers}
          />
        </div>

        <div className='flex flex-col gap-1 min-w-64'>
          <FormLabel htmlFor='weekStartDate'>Week start (Monday)</FormLabel>
          <DatePickerInput
            id='weekStartDate'
            placeholder='Select week'
            value={weekStartDate}
            onChange={(v) => setWeekStartDate(v ? new Date(v as any) : null)}
            clearable
          />
        </div>

        <div className='flex flex-col gap-1 min-w-56'>
          <FormLabel htmlFor='status'>Status</FormLabel>
          <FormSelect
            placeholder='All'
            value={status}
            onChange={(v) => setStatus((v as any) || '')}
            options={STATUS_OPTIONS}
            clearable
          />
        </div>

        <Button
          variant='outline'
          onClick={() => {
            setWeekStartDate(null);
            setStatus('');
            setEmployeeId('');
            setExpandedWeekId('');
            setTimeout(() => refetch(), 0);
          }}
        >
          Clear
        </Button>
      </div>

      {/* List */}
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200 rounded-lg'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Employee
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Week
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Total
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {isRefreshing ? (
              <tr>
                <td colSpan={5} className='px-6 py-8 text-center text-gray-500'>
                  <span className='inline-flex items-center gap-2'>
                    <Spinner className='w-4 h-4' />
                    <span className='text-sm'>Loading</span>
                  </span>
                </td>
              </tr>
            ) : weeks.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-6 py-8 text-center text-gray-500'>
                  No approvals found
                </td>
              </tr>
            ) : (
              weeks.map((w) => (
                <>
                  <tr
                    key={w.id}
                    className='hover:bg-gray-50 transition-all duration-200 cursor-pointer'
                    onClick={() => toggleExpand(w.id)}
                  >
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      <div className='flex flex-col'>
                        <span className='font-medium'>{w.user?.name || w.userId}</span>
                        <span className='text-xs text-gray-500'>{w.user?.email || ''}</span>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {w.weekStartDate?.slice(0, 10)} → {w.weekEndDate?.slice(0, 10)}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {w.totals?.formatted || '-'} ({w.totals?.entryCount ?? 0})
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      <span className='inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700'>
                        {w.status}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      <div
                        className='flex items-center gap-2 flex-wrap'
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(() => {
                          const canApproveReject = w.status === 'SUBMITTED';
                          const canBill = w.status === 'APPROVED';
                          const disableAll = isDeciding;

                          return (
                            <>
                              <Button
                                size='sm'
                                variant='light'
                                className='h-7 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-green-700'
                                leftIcon={<IconCheck className='w-4 h-4' />}
                                onClick={() => handleDecision(w.id, 'APPROVE')}
                                disabled={disableAll || !canApproveReject}
                              >
                                Approve All
                              </Button>
                              <Button
                                size='sm'
                                variant='light'
                                className='h-7 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-red-700'
                                leftIcon={<IconX className='w-4 h-4' />}
                                onClick={() => handleDecision(w.id, 'REJECT')}
                                disabled={disableAll || !canApproveReject}
                              >
                                Reject All
                              </Button>
                              <Button
                                size='sm'
                                variant='light'
                                className='h-7 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'
                                leftIcon={<IconReceipt className='w-4 h-4' />}
                                onClick={() => handleDecision(w.id, 'BILL')}
                                disabled={disableAll || !canBill}
                              >
                                Bill
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={5} className='p-0'>
                      <Collapse in={expandedWeekId === w.id} transitionDuration={300}>
                        <div className='px-6 pb-5 pt-0 bg-gray-50/40'>
                          <div className='mt-3 rounded-md border border-gray-200 bg-white'>
                            <div className='px-4 py-3 border-b border-gray-200'>
                              <div className='text-xs text-gray-500'>Timesheet entries</div>
                              <div className='text-sm text-gray-900 font-medium'>
                                {w.user?.name || w.userId} • {w.weekStartDate?.slice(0, 10)} →{' '}
                                {w.weekEndDate?.slice(0, 10)}
                              </div>
                            </div>

                            <div className='overflow-x-auto'>
                              <table className='min-w-full'>
                                <thead className='bg-gray-50 border-b border-gray-200'>
                                  <tr>
                                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                      Date
                                    </th>
                                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                      Project
                                    </th>
                                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                      Time
                                    </th>
                                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                      Description
                                    </th>
                                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                      Status
                                    </th>
                                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100'>
                                  {(w.timesheets || []).length === 0 ? (
                                    <tr>
                                      <td colSpan={6} className='px-4 py-4 text-sm text-gray-500'>
                                        No entries found for this week.
                                      </td>
                                    </tr>
                                  ) : (
                                    (w.timesheets || []).map((t: any) => {
                                      const canApproveRejectEntry = t.status === 'SUBMITTED';
                                      return (
                                        <tr key={t.id} className='hover:bg-gray-50'>
                                          <td className='px-4 py-3 text-sm text-gray-700'>
                                            {t.date?.slice?.(0, 10) || '—'}
                                          </td>
                                          <td className='px-4 py-3 text-sm text-gray-700'>
                                            {t.project?.name || '—'}
                                          </td>
                                          <td className='px-4 py-3 text-sm text-gray-700'>
                                            {formatTime(t.startTime)}–{formatTime(t.endTime)}
                                          </td>
                                          <td className='px-4 py-3 text-sm text-gray-700'>
                                            <span className='line-clamp-2'>
                                              {t.description?.replace(/<[^>]*>/g, '') || '—'}
                                            </span>
                                          </td>
                                          <td className='px-4 py-3 text-sm text-gray-700'>
                                            <span className='inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700'>
                                              {t.status || '—'}
                                            </span>
                                          </td>
                                          <td className='px-4 py-3 text-sm text-gray-700'>
                                            <div className='flex items-center gap-1.5'>
                                              <IconButton
                                                className='h-7 w-7 bg-white border border-gray-200 hover:bg-blue-50 text-blue-700'
                                                onClick={() => handleEditEntry(t)}
                                                title='View/Edit entry'
                                              >
                                                <IconEye className='w-4 h-4' />
                                              </IconButton>
                                              <IconButton
                                                className='h-7 w-7 bg-white border border-gray-200 hover:bg-green-50 text-green-700 disabled:opacity-50'
                                                onClick={() => handleApproveEntry(t.id)}
                                                disabled={isDecidingEntry || !canApproveRejectEntry}
                                                title='Approve entry'
                                              >
                                                <IconCheck className='w-4 h-4' />
                                              </IconButton>
                                              <IconButton
                                                className='h-7 w-7 bg-white border border-gray-200 hover:bg-red-50 text-red-700 disabled:opacity-50'
                                                onClick={() => openRejectEntryModal(t.id)}
                                                disabled={isDecidingEntry || !canApproveRejectEntry}
                                                title='Reject entry'
                                              >
                                                <IconX className='w-4 h-4' />
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
                          </div>
                        </div>
                      </Collapse>
                    </td>
                  </tr>
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit timesheet sidebar */}
      <EditTimesheetSidebar
        isOpen={isEditOpen}
        onClose={closeEditSidebar}
        timesheet={editTimesheet}
      />

      {/* Week-level bulk rejection modal */}
      <AlertModal
        opened={rejectModalOpen}
        onClose={closeRejectModal}
        onConfirm={confirmReject}
        title='Reject Timesheet Week'
        subtitle='Please provide a reason for rejecting all entries for this week'
        isLoading={isDeciding}
      >
        <div className='mt-4'>
          <Textarea
            placeholder='Enter rejection reason...'
            value={rejectComment}
            onChange={(e) => setRejectComment(e.currentTarget.value)}
            minRows={4}
            maxRows={8}
            autoFocus
            disabled={isDeciding}
            classNames={{
              input: 'border-gray-300 rounded-lg focus:border-blue-500',
            }}
          />
        </div>
      </AlertModal>

      {/* Individual entry rejection modal */}
      <AlertModal
        opened={rejectEntryModalOpen}
        onClose={closeRejectEntryModal}
        onConfirm={confirmRejectEntry}
        title='Reject Timesheet Entry'
        subtitle='Please provide a reason for rejecting this entry'
        isLoading={isDecidingEntry}
      >
        <div className='mt-4'>
          <Textarea
            placeholder='Enter rejection reason...'
            value={rejectEntryComment}
            onChange={(e) => setRejectEntryComment(e.currentTarget.value)}
            minRows={4}
            maxRows={8}
            autoFocus
            disabled={isDecidingEntry}
            classNames={{
              input: 'border-gray-300 rounded-lg focus:border-blue-500',
            }}
          />
        </div>
      </AlertModal>
    </Container>
  );
}
