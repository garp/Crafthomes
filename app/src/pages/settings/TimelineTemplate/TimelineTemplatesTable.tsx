'use client';

import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Table, Checkbox } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { toast } from 'react-toastify';
import { IconTrash } from '@tabler/icons-react';

import {
  useGetProjectTypesQuery,
  useDeleteProjectTypeMutation,
  useBulkDeleteProjectTypesMutation,
} from '../../../store/services/projectType/projectTypeSlice';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import TableWrapper from '../../../components/base/table/TableWrapper';
import TableData from '../../../components/base/table/TableData';
import { TextHeader } from '../../../components/base/table/TableHeader';
import TableLoader from '../../../components/common/loaders/TableLoader';
import NotFoundTextTable from '../../../components/common/NotFound';
import AlertModal from '../../../components/base/AlertModal';
import { DeleteButton, EditButton } from '../../../components';
import IconButton from '../../../components/base/button/IconButton';
import type { TProjectType } from '../../../store/types/projectType.types';
import type { TErrorResponse } from '../../../store/types/common.types';
import EditTimelineTemplateSidebar from './EditTimelineTemplateSidebar';

export default function TimelineTemplatesTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '0';

  // Determine if we're in the new template structure or the old timeline-template route
  const isInTemplateStructure = location.pathname.includes('/settings/template/');

  // Get project type group filter from URL params
  const projectTypeGroupId = searchParams.get('projectTypeGroupId') || '';

  const {
    data: projectTypesData,
    isFetching,
    isError,
  } = useGetProjectTypesQuery({
    pageNo: page,
    pageLimit: '10',
    search: getParam('query') || '',
    searchText: getParam('globalQuery') || '',
    projectTypeGroupId: projectTypeGroupId || undefined,
  });

  const [deleteProjectType, { isLoading: isDeleting }] = useDeleteProjectTypeMutation();
  const [bulkDelete, { isLoading: isBulkDeleting }] = useBulkDeleteProjectTypesMutation();
  const [selectedTemplate, setSelectedTemplate] = useState<TProjectType | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isOpenDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [isOpenBulkDeleteModal, { open: openBulkDeleteModal, close: closeBulkDeleteModal }] =
    useDisclosure(false);
  const [isOpenEditSidebar, { open: openEditSidebar, close: closeEditSidebar }] =
    useDisclosure(false);

  const allIds = projectTypesData?.projectTypes?.map((t) => t.id) || [];
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
        toast.success(`${selectedIds.size} template(s) deleted successfully`);
        setSelectedIds(new Set());
        closeBulkDeleteModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Failed to delete templates');
      });
  }

  function handleRowClick(template: TProjectType) {
    const basePath = isInTemplateStructure
      ? '/settings/template/project-type'
      : '/settings/timeline-template';
    navigate(`${basePath}/${template.id}`);
  }

  function handleEdit(template: TProjectType) {
    setSelectedTemplate(template);
    openEditSidebar();
  }

  function handleDeleteClick(template: TProjectType) {
    setSelectedTemplate(template);
    openDeleteModal();
  }

  function handleDeleteConfirm() {
    if (!selectedTemplate?.id) {
      toast.error('Unable to delete template');
      return;
    }
    deleteProjectType({ id: selectedTemplate.id })
      .unwrap()
      .then(() => {
        toast.success('Timeline template deleted successfully');
        closeDeleteModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to delete template');
        }
        console.error('Error deleting template:', error);
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
        <TableWrapper totalCount={projectTypesData?.totalCount}>
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
              <TextHeader>Template Name</TextHeader>
              <TextHeader>Project Type</TextHeader>
              <TextHeader>Phases Count</TextHeader>
              <TextHeader>Tasks Count</TextHeader>
              <TextHeader>Duration</TextHeader>
              <TextHeader config='action' isSticky={{ position: 'right' }}>
                Actions
              </TextHeader>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {isFetching || isError ? (
              <TableLoader />
            ) : !projectTypesData?.projectTypes?.length ? (
              <NotFoundTextTable title='No Timeline Templates Found' />
            ) : (
              projectTypesData.projectTypes.map((template, index) => (
                <Table.Tr
                  key={template.id}
                  onClick={() => handleRowClick(template)}
                  className={`group border-b border-gray-200 hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer ${selectedIds.has(template.id) ? 'bg-blue-50' : 'bg-white'}`}
                >
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(template.id)}
                      onChange={() => toggleSelect(template.id)}
                      size='sm'
                      color='dark'
                      className='cursor-pointer'
                    />
                  </Table.Td>
                  <TableData>{template.sNo || index + 1}</TableData>
                  <TableData className='font-medium'>{template.name}</TableData>
                  <TableData>
                    {template.projectTypeGroups?.length
                      ? template.projectTypeGroups.map((ptg) => ptg.name).join(', ')
                      : '-'}
                  </TableData>
                  <TableData>{template.phasesCount || 0}</TableData>
                  <TableData>{template.tasksCount || 0}</TableData>
                  <TableData>
                    {template.totalDuration ? `${template.totalDuration} days` : '0 days'}
                  </TableData>
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
                      <EditButton tooltip='Edit Template' onEdit={() => handleEdit(template)} />
                      <DeleteButton
                        tooltip='Delete Template'
                        onDelete={() => handleDeleteClick(template)}
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
        title={`Delete ${selectedTemplate?.name}?`}
        subtitle="This action can't be undone"
        onClose={closeDeleteModal}
        opened={isOpenDeleteModal}
        onConfirm={handleDeleteConfirm}
      />

      <AlertModal
        isLoading={isBulkDeleting}
        title={`Delete ${selectedIds.size} template(s)?`}
        subtitle="This action can't be undone"
        onClose={closeBulkDeleteModal}
        opened={isOpenBulkDeleteModal}
        onConfirm={handleBulkDeleteConfirm}
      />

      <EditTimelineTemplateSidebar
        isOpen={isOpenEditSidebar}
        onClose={closeEditSidebar}
        template={selectedTemplate}
      />
    </>
  );
}
