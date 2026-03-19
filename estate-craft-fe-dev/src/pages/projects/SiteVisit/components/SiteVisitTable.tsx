import { useState, useMemo } from 'react';
import Container from '../../../../components/common/Container';
import TableSearchBar from '../../../../components/common/TableSearchBar';
import { ActionButton, Button } from '../../../../components';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Table, Checkbox } from '@mantine/core';
import TableWrapper from '../../../../components/base/table/TableWrapper';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import { format } from 'date-fns';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import AlertModal from '../../../../components/base/AlertModal';
import { useDisclosure } from '@mantine/hooks';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';
import TableLoader from '../../../../components/common/loaders/TableLoader';
import ClearFilterButton from '../../../../components/base/button/ClearFilterButton';
import TableData from '../../../../components/base/table/TableData';
import StatusBadge from '../../../../components/common/StatusBadge';
import FormSelect from '../../../../components/base/FormSelect';
import {
  useGetProjectSiteVisitsQuery,
  useDeleteSiteVisitMutation,
  type TSiteVisit,
  type SiteVisitStatus,
  type TGetSiteVisitsArgs,
} from '../services';

const STATUS_OPTIONS = [
  { label: 'Status', value: '' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Reviewed', value: 'REVIEWED' },
];

const PROGRESS_OPTIONS = [
  { label: 'Progress', value: '' },
  { label: '0-25%', value: '0-25' },
  { label: '25-50%', value: '25-50' },
  { label: '50-75%', value: '50-75' },
  { label: '75-100%', value: '75-100' },
];

function getVisitProgress(visit: TSiteVisit): number {
  if (!visit?.taskSnapshots?.length) return 0;
  const sum = visit.taskSnapshots.reduce((s, t) => s + (t.completionPercentage ?? 0), 0);
  return Math.round(sum / visit.taskSnapshots.length);
}

export default function SiteVisitTable() {
  const { getParam, deleteParams, setParams } = useUrlSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const pageParam = getParam('page');
  const globalQueryParam = getParam('globalQuery');
  const statusParam = getParam('status');
  const [query, setQuery] = useState(() => globalQueryParam || '');

  const queryParams = useMemo((): TGetSiteVisitsArgs => {
    const params: TGetSiteVisitsArgs = {
      pageLimit: '10',
      pageNo: pageParam || '0',
      searchText: globalQueryParam,
      projectId: id ?? '',
    };
    const status = statusParam as SiteVisitStatus | null;
    if (status) params.status = status;
    return params;
  }, [id, pageParam, globalQueryParam, statusParam]);

  const { data: siteVisitData, isFetching: isFetchingSiteVisits } = useGetProjectSiteVisitsQuery(
    queryParams,
    { skip: !id },
  );
  const [deleteSiteVisit, { isLoading: isDeletingSiteVisit }] = useDeleteSiteVisitMutation();
  const [isOpenDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);

  const [selectedSiteVisit, setSelectedSiteVisit] = useState<TSiteVisit | null>(null);

  const progressParam = getParam('progress') || '';

  const filteredVisits = useMemo(() => {
    const visits = siteVisitData?.siteVisits ?? [];
    if (!progressParam) return visits;
    return visits.filter((visit) => {
      const p = visit.progress ?? getVisitProgress(visit);
      if (progressParam === '0-25') return p >= 0 && p < 25;
      if (progressParam === '25-50') return p >= 25 && p < 50;
      if (progressParam === '50-75') return p >= 50 && p < 75;
      if (progressParam === '75-100') return p >= 75 && p <= 100;
      return true;
    });
  }, [siteVisitData?.siteVisits, progressParam]);

  function handleDelete() {
    if (!selectedSiteVisit || !id) return;
    deleteSiteVisit({ id: selectedSiteVisit.id, projectId: id })
      .unwrap()
      .then(() => {
        toast.success('Site visit removed from list');
        closeDeleteModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to delete site visit');
        console.log('Error in deleting site visit:', error);
      });
  }

  const hasActiveFilters = getParam('status') || getParam('globalQuery') || getParam('progress');

  return (
    <Container className='pb-20 relative'>
      {/* HEADER: title + Create button (Figma) */}
      <div className='flex items-center justify-between mb-3'>
        <h6 className='font-bold text-sm'>SITE VISIT</h6>
        <Link to={`/projects/${id}/site-visit/create`}>
          <Button radius='full'>Create Site Visit</Button>
        </Link>
      </div>

      {/* FILTERS: Search, Progress, Status */}
      <div className='flex flex-wrap gap-3 mt-4 items-center'>
        <div className='flex-1 min-w-[200px] max-w-md'>
          <TableSearchBar
            query={query}
            setQuery={setQuery}
            searchKey='globalQuery'
            className='w-full border rounded-lg shadow-sm'
          />
        </div>
        <FormSelect
          value={progressParam}
          onChange={(value) => setParams('progress', value ?? '')}
          options={PROGRESS_OPTIONS}
          placeholder='Progress'
          className='min-w-[140px] border rounded-md'
        />
        <FormSelect
          value={getParam('status') ?? ''}
          onChange={(value) => setParams('status', value ?? '')}
          options={STATUS_OPTIONS}
          placeholder='Status'
          className='min-w-[140px] border rounded-md'
        />
        {hasActiveFilters && (
          <ClearFilterButton onClick={() => deleteParams(['status', 'globalQuery', 'progress'])} />
        )}
      </div>

      {/* TABLE: Figma columns — Checkbox | Date | Assigned to | Tasks | Status | Progress | Visit Time | Actions */}
      <TableWrapper totalCount={siteVisitData?.totalCount ?? 0}>
        <Table
          stickyHeader
          verticalSpacing='sm'
          highlightOnHover
          withColumnBorders
          className='rounded-md! overflow-hidden!'
        >
          <Table.Thead className='bg-neutral-100!'>
            <Table.Tr>
              <Table.Th className='w-12'>
                <Checkbox
                  color='dark'
                  checked={selectedRows.length === filteredVisits.length && selectedRows.length > 0}
                  indeterminate={
                    selectedRows.length > 0 && selectedRows.length < filteredVisits.length
                  }
                  onChange={(event) =>
                    setSelectedRows(event.target.checked ? filteredVisits.map((v) => v.id) : [])
                  }
                />
              </Table.Th>
              <Table.Th className='font-semibold'>Date</Table.Th>
              <Table.Th className='font-semibold'>Assigned to</Table.Th>
              <Table.Th className='font-semibold'>Tasks</Table.Th>
              <Table.Th className='font-semibold'>Status</Table.Th>
              <Table.Th className='font-semibold'>Progress</Table.Th>
              <Table.Th className='font-semibold'>Visit Time</Table.Th>
              <Table.Th className='font-semibold'>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isFetchingSiteVisits ? (
              <TableLoader />
            ) : (
              filteredVisits.map((visit) => (
                <Table.Tr
                  key={visit.id}
                  className='cursor-pointer'
                  bg={selectedRows.includes(visit.id) ? 'var(--color-gray-100)' : undefined}
                  onClick={() => navigate(`/projects/${id}/site-visit/${visit.id}/summary`)}
                >
                  <Table.Td
                    onClick={(e) => e.stopPropagation()}
                    className='flex items-center gap-2'
                  >
                    <Checkbox
                      color='dark'
                      aria-label='Select row'
                      checked={selectedRows.includes(visit.id)}
                      onChange={(event) =>
                        setSelectedRows((prev) =>
                          event.target.checked
                            ? [...prev, visit.id]
                            : prev.filter((row) => row !== visit.id),
                        )
                      }
                    />
                  </Table.Td>
                  <TableData>
                    {visit.startedAt && format(new Date(visit.startedAt), 'dd MMM yyyy')}
                  </TableData>
                  <TableData>
                    <div className='flex flex-col gap-0.5'>
                      {visit.engineers?.slice(0, 2).map((eng) => (
                        <span key={eng.id} className='text-xs'>
                          {eng.engineer.name}
                        </span>
                      ))}
                      {visit.engineers?.length > 2 && (
                        <span className='text-xs text-gray-500'>
                          +{visit.engineers.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableData>
                  <TableData className='max-w-[200px] truncate'>
                    <span
                      title={visit.taskSnapshots?.map((t) => t.taskTitle).join(', ')}
                      className='block truncate'
                    >
                      {visit.taskSnapshots?.length
                        ? visit.taskSnapshots
                            .slice(0, 3)
                            .map((t) => t.taskTitle)
                            .join(', ') +
                          (visit.taskSnapshots.length > 3
                            ? ` +${visit.taskSnapshots.length - 3} more`
                            : '')
                        : '—'}
                    </span>
                  </TableData>
                  <Table.Td>
                    <StatusBadge status={visit.status || 'SCHEDULED'} />
                  </Table.Td>
                  <TableData>{visit.progress ?? getVisitProgress(visit)}%</TableData>
                  <TableData>
                    {visit.startedAt && format(new Date(visit.startedAt), 'hh:mm a')}
                  </TableData>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <div className='flex gap-2'>
                      <ActionButton
                        tooltip='View'
                        icon={<IconEye className='size-4' />}
                        onClick={() => navigate(`/projects/${id}/site-visit/${visit.id}/summary`)}
                      />
                      <ActionButton
                        tooltip='Edit'
                        icon={<IconPencil className='size-4' />}
                        onClick={() => navigate(`/projects/${id}/site-visit/${visit.id}/edit`)}
                      />
                      <ActionButton
                        tooltip='Delete'
                        icon={<IconTrash className='size-4' />}
                        onClick={() => {
                          setSelectedSiteVisit(visit);
                          openDeleteModal();
                        }}
                      />
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </TableWrapper>

      {/* SOFT DELETE MODAL */}
      <AlertModal
        opened={isOpenDeleteModal}
        onClose={closeDeleteModal}
        title='Delete Site Visit'
        subtitle='This action cannot be undone'
        onConfirm={handleDelete}
        isLoading={isDeletingSiteVisit}
      />
    </Container>
  );
}
