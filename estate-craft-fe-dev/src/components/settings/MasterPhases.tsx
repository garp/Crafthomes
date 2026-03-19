import { motion } from 'framer-motion';
import { Table, Checkbox } from '@mantine/core';
import { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { IconTrash } from '@tabler/icons-react';

import { useDisclosure } from '@mantine/hooks';

import TableData from '../base/table/TableData';
import CustomPagination from '../base/CustomPagination';
import AlertModal from '../base/AlertModal';
import { TextHeader } from '../base/table/TableHeader';
import { DeleteButton } from '../base';
import { EditButton } from '../base';
import AddEditMasterPhaseSidebar from './AddEditMasterPhaseSidebar';
import { Button } from '..';
import IconButton from '../base/button/IconButton';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';
import TableSearchBar from '../common/TableSearchBar';
import ClearFilterButton from '../base/button/ClearFilterButton';
import type { TErrorResponse } from '../../store/types/common.types';
import type { TMasterPhase } from '../../store/types/masterPhase.types';
import {
  useDeleteMasterPhaseMutation,
  useGetMasterPhasesQuery,
  useBulkDeleteMasterPhasesMutation,
} from '../../store/services/masterPhase/masterPhase';
import { useGetProjectTypesQuery } from '../../store/services/projectType/projectTypeSlice';
import TableLoader from '../common/loaders/TableLoader';
import FormSelect from '../base/FormSelect';

export default function MasterPhases() {
  const [isOpenSidebar, { open: openSidebar, close: closeSidebar }] = useDisclosure();
  const [searchParams, setSearchParams] = useSearchParams();
  const { deleteParams, getParam } = useUrlSearchParams();
  const [query, setQuery] = useState(getParam('query') || '');

  // Get project type from URL params
  const projectTypeId = searchParams.get('projectTypeId') || '';

  // Fetch project types for filter dropdown
  const { data: projectTypesData } = useGetProjectTypesQuery({ pageLimit: '100' });

  // Build project type options with "All" option
  const projectTypeOptions = useMemo(() => {
    const options = [{ label: 'All Project Types', value: '' }];
    if (projectTypesData?.projectTypes) {
      projectTypesData.projectTypes.forEach((pt) => {
        options.push({ label: pt.name, value: pt.id });
      });
    }
    return options;
  }, [projectTypesData]);

  function handleProjectTypeChange(value: string | null) {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set('projectTypeId', value);
      } else {
        newParams.delete('projectTypeId');
      }
      // Reset page when filter changes
      newParams.delete('page');
      return newParams;
    });
  }

  function handleClearFilters() {
    deleteParams(['page', 'query', 'globalQuery', 'projectTypeId']);
    setQuery('');
  }

  return (
    <>
      <div className='h-full flex flex-col mt-5'>
        <section className='flex md:flex-row flex-col justify-between gap-y-5 gap-x-5'>
          <div className='flex gap-5 items-end'>
            <TableSearchBar query={query} setQuery={setQuery} />
            <FormSelect
              options={projectTypeOptions}
              value={projectTypeId}
              onChange={handleProjectTypeChange}
              placeholder='Filter by Project Type'
              className='w-56'
              searchable
            />
            <ClearFilterButton onClick={handleClearFilters} />
          </div>
          <Button
            onClick={openSidebar}
            variant='primary'
            size='md'
            radius='full'
            className='bg-button-bg! text-white hover:bg-gray-800 w-fit px-12'
          >
            Add Phase
          </Button>
        </section>
        <PhaseTable projectTypeId={projectTypeId} />
      </div>
      <AddEditMasterPhaseSidebar isOpen={isOpenSidebar} onClose={closeSidebar} mode='create' />
    </>
  );
}

/////////////////////PhaseTable///////////
function PhaseTable({ projectTypeId }: { projectTypeId: string }) {
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<TMasterPhase | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '';
  const searchQuery = getParam('query') || '';

  const [openedDelete, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [openedBulkDelete, { open: openBulkDelete, close: closeBulkDelete }] = useDisclosure(false);
  const [openedEdit, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  // Always fetch master phases from /masterPhase, optionally filtered by projectTypeId.
  // This preserves MasterPhaseMasterTask mapping (tasks) from the API.
  const { data: phasesData, isFetching } = useGetMasterPhasesQuery({
    pageNo: page,
    search: searchQuery,
    searchText: getParam('globalQuery'),
    projectTypeId: projectTypeId || undefined,
  });
  const [deletePhase, { isLoading }] = useDeleteMasterPhaseMutation();
  const [bulkDelete, { isLoading: isBulkDeleting }] = useBulkDeleteMasterPhasesMutation();

  const totalPages = Math.ceil((phasesData?.totalCount || 1) / 10) || 1;

  const allIds = phasesData?.masterPhases?.map((p) => p.id) || [];
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

  function handleDelete() {
    deletePhase(selectedPhaseId)
      .unwrap()
      .then(() => {
        toast.success('Phase deleted successfully');
        closeDelete();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in deleting project type', error);
      });
  }

  function handleBulkDeleteConfirm() {
    if (selectedIds.size === 0) return;
    bulkDelete({ ids: Array.from(selectedIds) })
      .unwrap()
      .then(() => {
        toast.success(`${selectedIds.size} phase(s) deleted successfully`);
        setSelectedIds(new Set());
        closeBulkDelete();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Failed to delete phases');
      });
  }

  function handleEdit(phase: TMasterPhase) {
    setSelectedPhase(phase);
    setSelectedPhaseId(phase.id);
    openEdit();
  }

  return (
    <>
      {/* Bulk delete button - shown when items selected */}
      {selectedIds.size > 0 && (
        <div className='mt-3 flex items-center gap-3'>
          <span className='text-sm text-gray-600'>{selectedIds.size} selected</span>
          <IconButton
            onClick={openBulkDelete}
            className='bg-red-50 hover:bg-red-100 p-2 rounded-lg'
          >
            <IconTrash className='size-4 text-red-500' />
          </IconButton>
        </div>
      )}
      <div className='h-full flex flex-col '>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='bg-white mt-5 no-scrollbar rounded-lg  border-gray-200 h-full overflow-x-auto mb-4 flex flex-col'
        >
          <Table withRowBorders className='rounded-lg min-w-full '>
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
                <TextHeader config='narrow'>#</TextHeader>
                <TextHeader config='standard'>Phase</TextHeader>
                <TextHeader config='wider'>Tasks Count</TextHeader>
                <TextHeader config='standard'>Actions</TextHeader>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody className='divide-y divide-gray-100'>
              {isFetching ? (
                <TableLoader />
              ) : (
                phasesData?.masterPhases?.map((phase, index) => (
                  <Table.Tr
                    onClick={() => handleEdit(phase)}
                    key={phase?.id}
                    className={`group h-12 border-b border-gray-200 hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer ${selectedIds.has(phase.id) ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(phase.id)}
                        onChange={() => toggleSelect(phase.id)}
                        size='sm'
                        color='dark'
                        className='cursor-pointer'
                      />
                    </Table.Td>
                    {/* SNO */}
                    <TableData>{index + 1}</TableData>
                    {/* PHASE NAME */}
                    <TableData>{phase?.name}</TableData>
                    {/* DESCRIPTION */}
                    <TableData>{phase?.MasterPhaseMasterTask?.length}</TableData>
                    {/* ACTIONS */}
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <div className='flex items-center space-x-2'>
                        <EditButton tooltip='Edit Phase' onEdit={() => handleEdit(phase)} />
                        <DeleteButton
                          tooltip='Delete Phase'
                          onDelete={() => {
                            setSelectedPhaseId(phase?.id);
                            openDelete();
                          }}
                        />
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </motion.div>
        <CustomPagination total={totalPages} />
      </div>

      {/* Delete confirmation modal */}
      <AlertModal
        isLoading={isLoading}
        title='Are you sure?'
        subtitle="This action can't be undone"
        onClose={closeDelete}
        opened={openedDelete}
        onConfirm={handleDelete}
      />

      {/* Bulk delete confirmation modal */}
      <AlertModal
        isLoading={isBulkDeleting}
        title={`Delete ${selectedIds.size} phase(s)?`}
        subtitle="This action can't be undone"
        onClose={closeBulkDelete}
        opened={openedBulkDelete}
        onConfirm={handleBulkDeleteConfirm}
      />

      {/* Edit sidebar */}
      <AddEditMasterPhaseSidebar
        phaseData={selectedPhase}
        isOpen={openedEdit}
        onClose={closeEdit}
        mode='edit'
      />
    </>
  );
}
