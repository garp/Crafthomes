'use client';

import { useState } from 'react';
import { Table, Checkbox } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { toast } from 'react-toastify';
import { IconTrash } from '@tabler/icons-react';

import {
  useGetProjectTypeGroupsQuery,
  useDeleteProjectTypeGroupMutation,
  useBulkDeleteProjectTypeGroupsMutation,
} from '../../../store/services/projectTypeGroup/projectTypeGroupSlice';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import TableWrapper from '../../../components/base/table/TableWrapper';
import TableData from '../../../components/base/table/TableData';
import { TextHeader } from '../../../components/base/table/TableHeader';
import TableLoader from '../../../components/common/loaders/TableLoader';
import NotFoundTextTable from '../../../components/common/NotFound';
import AlertModal from '../../../components/base/AlertModal';
import { DeleteButton, EditButton } from '../../../components';
import IconButton from '../../../components/base/button/IconButton';
import type { TProjectTypeGroup } from '../../../store/types/projectTypeGroup.types';
import type { TErrorResponse } from '../../../store/types/common.types';
import EditProjectTypeGroupSidebar from './EditProjectTypeGroupSidebar';

export default function ProjectTypeGroupTable() {
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '0';

  const {
    data: projectTypeGroupsData,
    isFetching,
    isError,
  } = useGetProjectTypeGroupsQuery({
    pageNo: page,
    pageLimit: '10',
    search: getParam('query') || '',
    searchText: getParam('globalQuery') || '',
  });

  const [deleteProjectTypeGroup, { isLoading: isDeleting }] = useDeleteProjectTypeGroupMutation();
  const [bulkDelete, { isLoading: isBulkDeleting }] = useBulkDeleteProjectTypeGroupsMutation();
  const [selectedGroup, setSelectedGroup] = useState<TProjectTypeGroup | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isOpenDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [isOpenBulkDeleteModal, { open: openBulkDeleteModal, close: closeBulkDeleteModal }] =
    useDisclosure(false);
  const [isOpenEditSidebar, { open: openEditSidebar, close: closeEditSidebar }] =
    useDisclosure(false);

  const allIds = projectTypeGroupsData?.projectTypeGroups?.map((g) => g.id) || [];
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = allIds.some((id) => selectedIds.has(id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  function handleBulkDeleteConfirm() {
    if (selectedIds.size === 0) return;
    bulkDelete({ ids: Array.from(selectedIds) })
      .unwrap()
      .then(() => {
        toast.success(`${selectedIds.size} group(s) deleted successfully`);
        setSelectedIds(new Set());
        closeBulkDeleteModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Failed to delete groups');
      });
  }

  function handleEdit(group: TProjectTypeGroup) {
    setSelectedGroup(group);
    openEditSidebar();
  }

  function handleDeleteClick(group: TProjectTypeGroup) {
    setSelectedGroup(group);
    openDeleteModal();
  }

  function handleDeleteConfirm() {
    if (!selectedGroup?.id) {
      toast.error('Unable to delete project type group');
      return;
    }
    deleteProjectTypeGroup({ id: selectedGroup.id })
      .unwrap()
      .then(() => {
        toast.success('Project type group deleted successfully');
        closeDeleteModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to delete project type group');
        }
        console.error('Error deleting project type group:', error);
      });
  }

  return (
    <>
      {/* Bulk delete button - shown when items selected */}
      {selectedIds.size > 0 && (
        <div className='mb-3 flex items-center gap-3'>
          <span className='text-sm text-gray-600'>{selectedIds.size} selected</span>
          <IconButton
            onClick={openBulkDeleteModal}
            className='bg-red-50 hover:bg-red-100 p-2 rounded-lg'
          >
            <IconTrash className='size-4 text-red-500' />
          </IconButton>
        </div>
      )}
      <div className='h-full flex flex-col'>
        <TableWrapper totalCount={projectTypeGroupsData?.totalCount}>
          <Table.Thead>
            <Table.Tr className='h-12'>
              <Table.Th className='w-10'>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleSelectAll}
                  size='sm'
                  color='dark'
                  className='cursor-pointer'
                />
              </Table.Th>
              <TextHeader config='srNo'>S. No.</TextHeader>
              <TextHeader>Group Name</TextHeader>
              <TextHeader>Description</TextHeader>
              <TextHeader>Project Types Count</TextHeader>
              <TextHeader config='action' isSticky={{ position: 'right' }}>
                Actions
              </TextHeader>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {isFetching || isError ? (
              <TableLoader />
            ) : !projectTypeGroupsData?.projectTypeGroups?.length ? (
              <NotFoundTextTable title='No Project Type Found' />
            ) : (
              projectTypeGroupsData.projectTypeGroups.map((group, index) => (
                <Table.Tr
                  key={group.id}
                  className={`group border-b border-gray-200 hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer ${selectedIds.has(group.id) ? 'bg-blue-50' : 'bg-white'}`}
                  onClick={() => handleEdit(group)}
                >
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(group.id)}
                      onChange={() => toggleSelect(group.id)}
                      size='sm'
                      color='dark'
                      className='cursor-pointer'
                    />
                  </Table.Td>
                  <TableData>{group.sNo || index + 1}</TableData>
                  <TableData className='font-medium'>{group.name}</TableData>
                  <TableData>{group.description || '-'}</TableData>
                  <TableData>{group.projectTypesCount || 0}</TableData>
                  <Table.Td
                    className='group-hover:bg-slate-100 bg-white'
                    style={{
                      position: 'sticky',
                      right: '0px',
                      zIndex: 5,
                      width: '120px',
                      minWidth: '120px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className='flex gap-2'>
                      <EditButton tooltip='Edit Group' onEdit={() => handleEdit(group)} />
                      <DeleteButton
                        tooltip='Delete Group'
                        onDelete={() => handleDeleteClick(group)}
                      />
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </TableWrapper>
      </div>

      <AlertModal
        isLoading={isDeleting}
        title={`Delete ${selectedGroup?.name}?`}
        subtitle="This action can't be undone"
        onClose={closeDeleteModal}
        opened={isOpenDeleteModal}
        onConfirm={handleDeleteConfirm}
      />

      <AlertModal
        isLoading={isBulkDeleting}
        title={`Delete ${selectedIds.size} group(s)?`}
        subtitle="This action can't be undone"
        onClose={closeBulkDeleteModal}
        opened={isOpenBulkDeleteModal}
        onConfirm={handleBulkDeleteConfirm}
      />

      <EditProjectTypeGroupSidebar
        isOpen={isOpenEditSidebar}
        onClose={closeEditSidebar}
        group={selectedGroup}
      />
    </>
  );
}
