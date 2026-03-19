import { useParams } from 'react-router-dom';
import { ActionButton, Button, DeleteButton } from '../../../../components';
import Container from '../../../../components/common/Container';
import { Table, Checkbox } from '@mantine/core';
import { useState, useMemo } from 'react';
import TableData from '../../../../components/base/table/TableData';
import StatusBadge from '../../../../components/common/StatusBadge';
import { IconEye, IconPencil } from '@tabler/icons-react';
import {
  useDeleteProjectSnagMutation,
  useGetProjectSnagsQuery,
} from '../../../../store/services/snag/snagSlice';
import { format } from 'date-fns';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import AlertModal from '../../../../components/base/AlertModal';
import { useDisclosure } from '@mantine/hooks';
import { type TSnag } from '../../../../store/types/snag.types';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';
import TableLoader from '../../../../components/common/loaders/TableLoader';
import TableSearchBar from '../../../../components/common/TableSearchBar';
import ClearFilterButton from '../../../../components/base/button/ClearFilterButton';
import StatusFilter from '../../../../components/common/selectors/StatusSelector';
import TableWrapper from '../../../../components/base/table/TableWrapper';
import ColoredBadge from '../../../../components/common/ColoredBadge';
import { Image } from '../../../../components/base/Image';
import ViewSnagSidebar from './ViewSnagSidebar';
import CreateSnagSidebar from './CreateSnagSidebar';
import VendorSelector from '../../../../components/common/selectors/VendorSelector';

const STATUS_OPTIONS = [
  { label: 'Temporary', value: 'TEMPORARY' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function SnagTable() {
  const { getParam, deleteParams, setParams } = useUrlSearchParams();
  const { id } = useParams();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [query, setQuery] = useState(() => getParam('globalQuery') || '');

  // Build query params - only include snagStatus and vendorId if they have values
  const queryParams: any = {
    pageLimit: '10',
    pageNo: getParam('page'),
    searchText: getParam('globalQuery'),
    projectId: id,
  };

  const statusParam = getParam('status');
  if (statusParam) {
    queryParams.snagStatus = statusParam;
  }

  const vendorIdParam = getParam('vendorId');
  if (vendorIdParam) {
    queryParams.vendorId = vendorIdParam;
  }

  const { data: snagData, isFetching: isFetchingSnags } = useGetProjectSnagsQuery(queryParams);
  const [deleteSnag, { isLoading: isDeletingSnag }] = useDeleteProjectSnagMutation();
  const [isOpenDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [isOpenViewSidebar, { open: openViewSidebar, close: closeViewSidebar }] =
    useDisclosure(false);
  const [isOpenCreateEditSidebar, { open: openCreateEditSidebar, close: closeCreateEditSidebar }] =
    useDisclosure(false);

  const [selectedSnag, setSelectedSnag] = useState<TSnag | null>(null);
  const [viewSnag, setViewSnag] = useState<TSnag | null>(null);
  const [editSnag, setEditSnag] = useState<TSnag | null>(null);

  // Calculate counts based on status
  const snagCounts = useMemo(() => {
    const snags = snagData?.snags || [];
    return {
      all: snags.length,
      temporary: snags.filter((snag) => snag.snagStatus === 'TEMPORARY').length,
      pending: snags.filter((snag) => snag.snagStatus === 'PENDING').length,
      open: snags.filter((snag) => snag.snagStatus === 'OPEN').length,
      inProgress: snags.filter((snag) => snag.snagStatus === 'IN_PROGRESS').length,
      resolved: snags.filter((snag) => snag.snagStatus === 'RESOLVED').length,
      rejected: snags.filter((snag) => snag.snagStatus === 'REJECTED').length,
      closed: snags.filter((snag) => snag.snagStatus === 'CLOSED').length,
    };
  }, [snagData]);

  function handleDelete() {
    deleteSnag(selectedSnag?.id || '')
      .unwrap()
      .then(() => {
        toast.success('Snag deleted successfully');
        closeDeleteModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to delete snag');
        console.log('Error in deleting snag:', error);
      });
  }

  const hasActiveFilters = getParam('status') || getParam('globalQuery') || getParam('vendorId');

  return (
    <Container className='pb-20 relative'>
      {/* HEADER SECTION */}
      <div className='flex items-center justify-between mb-3'>
        <h6 className='font-bold text-sm'>SNAG</h6>
        <Button radius='full' onClick={openCreateEditSidebar}>
          Add Snag
        </Button>
      </div>

      {/* BADGES */}
      <div className='mt-3 py-3 flex flex-wrap gap-2 border-y border-gray-200'>
        <ColoredBadge className='bg-blue-100 text-blue-500' label={`All(${snagCounts.all})`} />
        <ColoredBadge
          className='bg-gray-100 text-gray-600'
          label={`Temporary (${snagCounts.temporary})`}
        />
        <ColoredBadge
          className='bg-yellow-100 text-yellow-600'
          label={`Pending (${snagCounts.pending})`}
        />
        <ColoredBadge
          className='bg-orange-100 text-orange-600'
          label={`Open (${snagCounts.open})`}
        />
        <ColoredBadge
          className='bg-blue-100 text-blue-600'
          label={`In Progress (${snagCounts.inProgress})`}
        />
        <ColoredBadge
          className='bg-green-100 text-green-600'
          label={`Resolved (${snagCounts.resolved})`}
        />
        <ColoredBadge
          className='bg-red-100 text-red-600'
          label={`Rejected (${snagCounts.rejected})`}
        />
        <ColoredBadge
          className='bg-gray-100 text-gray-500'
          label={`Closed (${snagCounts.closed})`}
        />
      </div>

      {/* FILTERS */}
      <div className='flex flex-wrap gap-3 mt-5 items-center'>
        <div className='flex-1 min-w-[200px] max-w-md'>
          <TableSearchBar
            query={query}
            setQuery={setQuery}
            searchKey='globalQuery'
            className='w-full border rounded-lg shadow-sm'
          />
        </div>
        <StatusFilter
          value={getParam('status') as string}
          onChange={(value) => setParams('status', value as string)}
          options={STATUS_OPTIONS}
          placeholder='Filter by status'
          className='min-w-[180px]'
        />
        <div className='min-w-[200px]'>
          <VendorSelector
            value={getParam('vendorId') || null}
            setValue={(val) => setParams('vendorId', val || '')}
            allowFilter
            inputClassName='!border-0 !py-6 !rounded-lg'
            className='w-full'
          />
        </div>
        {hasActiveFilters && (
          <ClearFilterButton onClick={() => deleteParams(['status', 'globalQuery', 'vendorId'])} />
        )}
      </div>

      {/* TABLE */}
      <TableWrapper totalCount={snagData?.totalCount ?? 0}>
        <Table
          stickyHeader
          verticalSpacing='sm'
          highlightOnHover
          withColumnBorders
          className='rounded-md! overflow-hidden!'
        >
          {/* TABLE HEADER */}
          <Table.Thead className='bg-neutral-100!'>
            <Table.Tr>
              <Table.Th className='w-12'>
                <Checkbox
                  checked={
                    selectedRows.length === snagData?.snags?.length && selectedRows.length > 0
                  }
                  indeterminate={
                    selectedRows.length > 0 && selectedRows.length < (snagData?.snags?.length || 0)
                  }
                  onChange={(event) =>
                    setSelectedRows(
                      event.target.checked ? snagData?.snags?.map((s) => s.id) || [] : [],
                    )
                  }
                />
              </Table.Th>
              <Table.Th className='font-semibold'>S.No</Table.Th>
              <Table.Th className='font-semibold'>Image</Table.Th>
              <Table.Th className='font-semibold'>Title</Table.Th>
              <Table.Th className='font-semibold'>Location</Table.Th>
              <Table.Th className='font-semibold'>Category</Table.Th>
              <Table.Th className='font-semibold'>Sub Category</Table.Th>
              <Table.Th className='font-semibold'>Created Date</Table.Th>
              <Table.Th className='font-semibold'>Status</Table.Th>
              <Table.Th className='font-semibold'>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          {/* TABLE BODY */}
          <Table.Tbody>
            {isFetchingSnags ? (
              <TableLoader />
            ) : (
              snagData?.snags?.map((snag, index) => (
                <Table.Tr
                  className='cursor-pointer'
                  key={snag?.id}
                  bg={selectedRows?.includes(snag?.id) ? 'var(--color-gray-100)' : undefined}
                  onClick={() => {
                    setViewSnag(snag);
                    openViewSidebar();
                  }}
                >
                  <Table.Td className='flex items-center gap-2'>
                    <Checkbox
                      aria-label='Select row'
                      checked={selectedRows.includes(snag?.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(event) =>
                        setSelectedRows((prev) =>
                          event.target.checked
                            ? [...prev, snag?.id]
                            : prev.filter((row) => row !== snag?.id),
                        )
                      }
                    />
                  </Table.Td>
                  <TableData>{index + 1}</TableData>
                  <TableData>
                    {snag?.attachments?.[0] && (
                      <Image
                        src={snag.attachments[0].url}
                        alt={snag.title}
                        className='w-16 h-16 object-cover rounded'
                      />
                    )}
                  </TableData>
                  <TableData>{snag?.title}</TableData>
                  <TableData>{snag?.location}</TableData>
                  <TableData>{snag?.snagCategory}</TableData>
                  <TableData>{snag?.snagSubCategory}</TableData>
                  <TableData>{snag?.createdAt && format(snag?.createdAt, 'dd MMM yyyy')}</TableData>
                  <Table.Td>
                    <StatusBadge status={snag?.snagStatus || 'PENDING'} />
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <div className='flex gap-2'>
                      <ActionButton
                        tooltip='View Snag'
                        icon={<IconEye className='size-4' />}
                        onClick={() => {
                          setViewSnag(snag);
                          openViewSidebar();
                        }}
                      />
                      <ActionButton
                        tooltip='Edit Snag'
                        icon={<IconPencil className='size-4' />}
                        onClick={() => {
                          setEditSnag(snag);
                          openCreateEditSidebar();
                        }}
                      />
                      <DeleteButton
                        onDelete={() => {
                          setSelectedSnag(snag);
                          openDeleteModal();
                        }}
                        tooltip='Delete Snag'
                      />
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </TableWrapper>

      {/* DELETE MODAL */}
      <AlertModal
        opened={isOpenDeleteModal}
        onClose={closeDeleteModal}
        title='Delete Snag'
        subtitle='Are you sure you want to delete this snag? This action cannot be undone.'
        onConfirm={handleDelete}
        isLoading={isDeletingSnag}
      />

      {/* VIEW SNAG SIDEBAR */}
      <ViewSnagSidebar isOpen={isOpenViewSidebar} onClose={closeViewSidebar} snag={viewSnag} />

      {/* CREATE/EDIT SNAG SIDEBAR */}
      <CreateSnagSidebar
        isOpen={isOpenCreateEditSidebar}
        onClose={() => {
          closeCreateEditSidebar();
          setEditSnag(null);
        }}
        mode={editSnag ? 'edit' : 'create'}
        initialValues={editSnag || undefined}
        projectId={id || ''}
      />
    </Container>
  );
}
