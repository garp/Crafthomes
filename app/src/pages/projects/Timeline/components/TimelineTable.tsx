import { useNavigate, useParams } from 'react-router-dom';
import { Table } from '@mantine/core';
import { useState, type MouseEvent, type PropsWithChildren } from 'react';
import { MdOutlineArchive } from 'react-icons/md';

import { Button, DeleteButton, EditButton } from '../../../../components';
import Container from '../../../../components/common/Container';
import { createTimelineData, timelineTableHeader } from '../constants/constants';
import CreateScreen from '../../../../components/common/CreateScreen';
import StatusBadge from '../../../../components/common/StatusBadge';
import SortIcon from '../../../../components/icons/SortIcon';
import TableData from '../../../../components/base/table/TableData';
import {
  useDeleteProjectTimelineMutation,
  useEditProjectTimelineMutation,
  useGetProjectTimelineQuery,
} from '../../../../store/services/projectTimeline/projectTimelineSlice';
import { format } from 'date-fns';
// import CustomPagination from '../../../../components/base/CustomPagination';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import { useDisclosure } from '@mantine/hooks';
import { AddTimelineSidebar } from './AddTimelineSidebar';
import { type TTimeline } from '../../../../store/types/timeline.types';
import { EditTimelineSidebar } from './EditTimelineSidebar';
import AlertModal from '../../../../components/base/AlertModal';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';
import TableLoader from '../../../../components/common/loaders/TableLoader';
import TableWrapper from '../../../../components/base/table/TableWrapper';
import FormSelect from '../../../../components/base/FormSelect';
import { ActionButton } from '../../../../components/base/button/ActionButton';
import type { TTimelineStatus } from '../../../../store/types/timeline.types';
// import AlertModal from '../../../../components/base/AlertModal';

const PAGE_LIMIT = 14;
const timelineStatusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Archived', value: 'ARCHIVED' },
  { label: 'Deleted', value: 'DELETED' },
];

export default function TimelineTable() {
  const { getParam, setParams, deleteParams } = useUrlSearchParams();
  const [selectedTimeline, setSelectedTimeline] = useState<TTimeline | null>(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const selectedStatus = getParam('status') || '';

  const { data: projectTimelineData, isFetching: isFetchingTimeline } = useGetProjectTimelineQuery({
    projectId: id || '',
    pageNo: getParam('page'),
    pageLimit: PAGE_LIMIT.toString(),
    timelineStatus: (selectedStatus || undefined) as TTimelineStatus | undefined,
  });
  const [updateTimeline, { isLoading: isArchivingTimeline }] = useEditProjectTimelineMutation();
  const [deleteTimeline, { isLoading: isDeletingTimeline }] = useDeleteProjectTimelineMutation();
  // const totalPages = Math.ceil((projectTimelineData?.totalCount || 1) / PAGE_LIMIT);
  const [
    isOpenCreateTimelineSidebar,
    { open: openCreateTimelineSidebar, close: closeCreateTimelinelineSidebar },
  ] = useDisclosure();

  const [
    isOpenEditTimelineSidebar,
    { open: openEditTimelineSidebar, close: closeEditTimelineSidebar },
  ] = useDisclosure(false);

  const [
    isOpenDeleteTimelineSidebar,
    { open: openDeleteTimelineSidebar, close: closeDeleteTimelineSidebar },
  ] = useDisclosure(false);

  const [
    isOpenArchiveTimelineSidebar,
    { open: openArchiveTimelineSidebar, close: closeArchiveTimelineSidebar },
  ] = useDisclosure(false);

  function handleArchiveTimeline() {
    if (!selectedTimeline?.id) {
      toast.error('Unable to update timeline status');
      return;
    }

    const isArchivedTimeline = selectedTimeline.timelineStatus === 'ARCHIVED';
    const nextTimelineStatus: TTimelineStatus = isArchivedTimeline ? 'PENDING' : 'ARCHIVED';

    updateTimeline({
      id: selectedTimeline.id,
      data: { timelineStatus: nextTimelineStatus },
    })
      .unwrap()
      .then(() => {
        toast.success(
          isArchivedTimeline
            ? 'Timeline unarchived successfully'
            : 'Timeline archived successfully',
        );
        closeArchiveTimelineSidebar();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
      });
  }

  function handleDeleteTimeleline() {
    deleteTimeline({ id: selectedTimeline?.id || '' })
      .unwrap()
      .then(() => {
        toast.success('Timeline deleted successfully');
        closeDeleteTimelineSidebar();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in creating user:', error);
      });
  }
  const hasTimelines = projectTimelineData?.timelines && projectTimelineData.timelines.length > 0;
  const hasActiveFilters = Boolean(selectedStatus);

  return (
    <>
      <Container className=' h-full'>
        {!isFetchingTimeline && !hasTimelines && !hasActiveFilters ? (
          <CreateScreen createPageData={createTimelineData} onClick={openCreateTimelineSidebar} />
        ) : (
          <>
            {/* HEADER */}
            <section className='flex sm:flex-row flex-col sm:items-center gap-y-2 justify-between'>
              <h6 className='text-sm font-bold'>ALL TIMELINE</h6>
              <div className='flex sm:flex-row flex-col gap-3 sm:items-center'>
                <FormSelect
                  clearable
                  placeholder='Filter by status'
                  value={selectedStatus || null}
                  options={timelineStatusOptions}
                  className='min-w-[220px]'
                  onChange={(value) => {
                    if (value) {
                      setParams('status', value);
                    } else {
                      deleteParams(['status']);
                    }
                  }}
                />
                <Button onClick={openCreateTimelineSidebar} radius='full'>
                  Create Timeline
                </Button>
              </div>
            </section>
            {/* TABLE SECTION */}
            <TableWrapper totalCount={projectTimelineData?.totalCount} pageLength={PAGE_LIMIT}>
              <Table.Thead>
                <Table.Tr>
                  {timelineTableHeader?.map((header) => (
                    <TableHeaderWrapper key={header}>
                      {header}
                      <button className='cursor-pointer'>
                        <SortIcon />
                      </button>
                    </TableHeaderWrapper>
                  ))}
                  <TableHeaderWrapper>Actions</TableHeaderWrapper>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {isFetchingTimeline ? (
                  <TableLoader className='h-[calc(100vh-22rem)]' />
                ) : !projectTimelineData?.timelines?.length ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={timelineTableHeader.length + 1}
                      className='py-8 text-center text-sm text-text-subHeading'
                    >
                      No timelines found
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  projectTimelineData?.timelines?.map((row, idx) => (
                    <Table.Tr
                      className={
                        row?.timelineStatus === 'DELETED'
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer'
                      }
                      key={row?.id ?? idx}
                      onClick={() => {
                        if (row?.timelineStatus === 'DELETED') return;
                        navigate(`/projects/${id}/timeline/${row?.id}`);
                      }}
                    >
                      <TableData>{row?.name}</TableData>
                      <TableData>
                        {row?.plannedStart ? format(row.plannedStart, 'dd MMM yyyy') : '—'}
                      </TableData>
                      <TableData>
                        {row?.plannedEnd ? format(row.plannedEnd, 'dd MMM yyyy') : '—'}
                      </TableData>
                      <TableData>{row?.createdByUser?.name}</TableData>
                      <TableData>
                        <StatusBadge status={row?.timelineStatus} />
                      </TableData>
                      <TableData
                        className='flex gap-3'
                        onClick={(e: MouseEvent<HTMLTableCellElement>) => e.stopPropagation()}
                      >
                        <EditButton
                          disabled={
                            row.timelineStatus === 'ARCHIVED' || row.timelineStatus === 'DELETED'
                          }
                          onEdit={() => {
                            setSelectedTimeline(row);
                            openEditTimelineSidebar();
                          }}
                        />
                        <ActionButton
                          icon={<MdOutlineArchive className='w-4 h-4' />}
                          tooltip={row.timelineStatus === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                          disabled={row.timelineStatus === 'DELETED'}
                          className='hover:text-amber-600'
                          onClick={() => {
                            setSelectedTimeline(row);
                            openArchiveTimelineSidebar();
                          }}
                        />
                        <DeleteButton
                          disabled={row.timelineStatus === 'DELETED'}
                          onDelete={() => {
                            setSelectedTimeline(row);
                            openDeleteTimelineSidebar();
                          }}
                        />
                      </TableData>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </TableWrapper>
          </>
        )}
      </Container>
      <AddTimelineSidebar
        isOpen={isOpenCreateTimelineSidebar}
        onClose={closeCreateTimelinelineSidebar}
      />
      <EditTimelineSidebar
        isOpen={isOpenEditTimelineSidebar}
        onClose={closeEditTimelineSidebar}
        timeline={selectedTimeline}
      />
      <AlertModal
        title={`${selectedTimeline?.timelineStatus === 'ARCHIVED' ? 'Unarchive' : 'Archive'} ${selectedTimeline?.name}?`}
        subtitle=''
        isLoading={isArchivingTimeline}
        onClose={closeArchiveTimelineSidebar}
        opened={isOpenArchiveTimelineSidebar}
        onConfirm={handleArchiveTimeline}
      />
      <AlertModal
        title={`Delete ${selectedTimeline?.name}?`}
        subtitle='Deleting a timeline cannot be undone. If you may need this timeline again, archive it instead of deleting it.'
        isLoading={isDeletingTimeline}
        onClose={closeDeleteTimelineSidebar}
        opened={isOpenDeleteTimelineSidebar}
        onConfirm={handleDeleteTimeleline}
      />
    </>
  );
}
//////////////Table Header Wrapper
function TableHeaderWrapper({ children }: PropsWithChildren) {
  return (
    <Table.Th>
      <div className='flex justify-between text-nowrap gap-2'>{children}</div>
    </Table.Th>
  );
}
