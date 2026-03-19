import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Table, Checkbox } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useSearchParams } from 'react-router-dom';
import { IconTrash } from '@tabler/icons-react';

import useUrlSearchParams from '../../hooks/useUrlSearchParams';

import { Button } from '..';
import { TextHeader } from '../base/table/TableHeader';
import { DeleteButton, EditButton, CopyButton } from '../base';
import IconButton from '../base/button/IconButton';
import AddTaskSidebar from './AddMasterTaskSidebar';
import TableSearchBar from '../common/TableSearchBar';
import ClearFilterButton from '../base/button/ClearFilterButton';
import { toast } from 'react-toastify';
import CustomPagination from '../base/CustomPagination';
import AlertModal from '../base/AlertModal';
import TableData from '../base/table/TableData';
import {
  useDeleteMasterTaskMutation,
  useGetMasterTasksQuery,
  useBulkDeleteMasterTasksMutation,
} from '../../store/services/masterTask/masterTask';
import { useGetMasterPhasesQuery } from '../../store/services/masterPhase/masterPhase';
import { useGetPhasesByProjectTypeIdQuery } from '../../store/services/phase/phaseSlice';
import { useGetProjectTypesQuery } from '../../store/services/projectType/projectTypeSlice';
import type { TMasterTask } from '../../store/types/masterTask.types';
import EditTaskSidebar from './EditMasterTaskSidebar';
import type { TErrorResponse } from '../../store/types/common.types';
import TableLoader from '../common/loaders/TableLoader';
import type { TCreateMasterTaskFormData } from '../../validators/masterTask';
import type { TOption } from '../../types/common.types';
import FormSelect from '../base/FormSelect';

export default function MasterTasks() {
  const [isOpenSidebar, { open: openSidebar, close: closeSidebar }] = useDisclosure();
  const [copyTaskData, setCopyTaskData] = useState<TCreateMasterTaskFormData | null>(null);
  const [copyPhaseData, setCopyPhaseData] = useState<TOption[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { deleteParams, getParam } = useUrlSearchParams();
  const [query, setQuery] = useState(getParam('query') || '');

  // Get filters from URL params
  const projectTypeId = searchParams.get('projectTypeId') || '';
  const masterPhaseId = searchParams.get('masterPhaseId') || '';

  // Fetch project types for filter dropdown
  const { data: projectTypesData } = useGetProjectTypesQuery({ pageLimit: '100' });

  // Fetch all master phases (when no project type filter)
  const { data: allPhasesData } = useGetMasterPhasesQuery(
    { pageLimit: '100' },
    { skip: !!projectTypeId },
  );

  // Fetch phases filtered by project type
  const { data: filteredPhasesData } = useGetPhasesByProjectTypeIdQuery(
    { projectTypeId },
    { skip: !projectTypeId },
  );

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

  // Build phase options based on project type selection
  const phaseOptions = useMemo(() => {
    const options = [{ label: 'All Phases', value: '' }];
    if (projectTypeId && filteredPhasesData?.masterPhases) {
      filteredPhasesData.masterPhases.forEach((phase) => {
        options.push({ label: phase.name, value: phase.id });
      });
    } else if (allPhasesData?.masterPhases) {
      allPhasesData.masterPhases.forEach((phase) => {
        options.push({ label: phase.name, value: phase.id });
      });
    }
    return options;
  }, [projectTypeId, filteredPhasesData, allPhasesData]);

  useEffect(() => {
    const urlQuery = searchParams.get('query') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  function handleProjectTypeChange(value: string | null) {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set('projectTypeId', value);
      } else {
        newParams.delete('projectTypeId');
      }
      // Clear phase filter when project type changes
      newParams.delete('masterPhaseId');
      // Reset page when filter changes
      newParams.delete('page');
      return newParams;
    });
  }

  function handlePhaseChange(value: string | null) {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set('masterPhaseId', value);
      } else {
        newParams.delete('masterPhaseId');
      }
      // Reset page when filter changes
      newParams.delete('page');
      return newParams;
    });
  }

  function handleClearFilters() {
    setQuery('');
    deleteParams(['query', 'page', 'globalQuery', 'projectTypeId', 'masterPhaseId']);
  }

  return (
    <>
      <div className='flex flex-col h-full mt-5'>
        <div className='flex items-center justify-between w-full'>
          <div className='flex gap-5 items-end'>
            <TableSearchBar query={query} setQuery={setQuery} />
            <FormSelect
              options={projectTypeOptions}
              value={projectTypeId}
              onChange={handleProjectTypeChange}
              placeholder='Filter by Project Type'
              className='w-48'
              searchable
            />
            <FormSelect
              options={phaseOptions}
              value={masterPhaseId}
              onChange={handlePhaseChange}
              placeholder='Filter by Phase'
              className='w-48'
              searchable
            />
            <ClearFilterButton onClick={handleClearFilters} />
          </div>
          <Button
            onClick={() => {
              setCopyTaskData(null);
              setCopyPhaseData(null);
              openSidebar();
            }}
            variant='primary'
            size='md'
            radius='full'
            className='bg-button-bg! text-white hover:bg-gray-800 w-fit px-12'
          >
            Add Task
          </Button>
        </div>
        <TaskTable
          masterPhaseId={masterPhaseId}
          projectTypeId={projectTypeId}
          onCopyTask={(data, phaseData) => {
            setCopyTaskData(data);
            setCopyPhaseData(phaseData);
            openSidebar();
          }}
        />
      </div>
      <AddTaskSidebar
        isOpen={isOpenSidebar}
        onClose={() => {
          closeSidebar();
          setCopyTaskData(null);
          setCopyPhaseData(null);
        }}
        initialValues={copyTaskData}
        defaultPhaseData={copyPhaseData}
      />
    </>
  );
}

////////////////TASK TABLE/////////
function TaskTable({
  onCopyTask,
  masterPhaseId,
  projectTypeId,
}: {
  onCopyTask: (data: TCreateMasterTaskFormData, phaseData: TOption[]) => void;
  masterPhaseId: string;
  projectTypeId: string;
}) {
  const [selectedTask, setSelectedTask] = useState<TMasterTask | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '0';
  const searchQuery = getParam('query') || '';

  const [openedDelete, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [openedBulkDelete, { open: openBulkDelete, close: closeBulkDelete }] = useDisclosure(false);
  const [isOpenEditSidebar, { open: openEditSidebar, close: closeEditSidebar }] =
    useDisclosure(false);

  const { data: tasksData, isFetching } = useGetMasterTasksQuery({
    pageNo: page,
    search: searchQuery,
    searchText: getParam('globalQuery'),
    masterPhaseId: masterPhaseId || undefined,
    projectTypeId: projectTypeId || undefined,
  });
  const [deleteTask, { isLoading }] = useDeleteMasterTaskMutation();
  const [bulkDelete, { isLoading: isBulkDeleting }] = useBulkDeleteMasterTasksMutation();

  const totalPages = Math.ceil((tasksData?.totalCount || 1) / 10) || 1;

  const allIds = tasksData?.masterTasks?.map((t) => t.id) || [];
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
    if (!selectedTask) {
      toast.error('Unable to delete');
      console.log('seleced task is undefined');
      return;
    }
    deleteTask(selectedTask?.id)
      .unwrap()
      .then(() => {
        toast.success('Task deleted successfully');
        closeDelete();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in deleting task', error);
      });
  }

  function handleBulkDeleteConfirm() {
    if (selectedIds.size === 0) return;
    bulkDelete({ ids: Array.from(selectedIds) })
      .unwrap()
      .then(() => {
        toast.success(`${selectedIds.size} task(s) deleted successfully`);
        setSelectedIds(new Set());
        closeBulkDelete();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Failed to delete tasks');
      });
  }

  function handleEdit(task: TMasterTask) {
    setSelectedTask(task);
    openEditSidebar();
  }

  function handleCopy(task: TMasterTask) {
    const copyData: TCreateMasterTaskFormData = {
      name: task.name,
      masterPhaseId: task.MasterPhaseMasterTask?.map((pmt) => pmt.MasterPhase.id) || [],
      description: task.description || '',
      duration: task.duration ?? null,
      predecessorTaskId: task.predecessorTaskId ?? null,
      priority: task.priority || '',
      subTasks: task.subTasks || [],
    };
    const phaseDefaultData =
      task.MasterPhaseMasterTask?.map((pmt) => ({
        label: pmt.MasterPhase.name,
        value: pmt.MasterPhase.id,
      })) || [];
    onCopyTask(copyData, phaseDefaultData);
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
      <div className='h-full flex flex-col'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='bg-white mt-5 rounded-lg border-gray-200 h-full overflow-x-auto no-scrollbar mb-4 flex flex-col'
        >
          <Table withRowBorders className='rounded-lg min-w-full'>
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
                <TextHeader config='srNo'>#</TextHeader>
                <TextHeader config='standard'>Task</TextHeader>
                <TextHeader config='widest'>Phase</TextHeader>
                <TextHeader config='action'>Duration</TextHeader>
                <TextHeader config='wider'>Predecessor</TextHeader>
                <TextHeader config='action'>Actions</TextHeader>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody className='divide-y divide-gray-100'>
              {isFetching ? (
                <TableLoader />
              ) : (
                tasksData?.masterTasks?.map((task, index) => (
                  <Table.Tr
                    onClick={() => handleEdit(task)}
                    key={task?.id}
                    className={`group h-12 border-b border-gray-200 hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer ${selectedIds.has(task.id) ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        size='sm'
                        color='dark'
                        className='cursor-pointer'
                      />
                    </Table.Td>
                    <TableData>{index + 1}</TableData>
                    <TableData>{task?.name}</TableData>
                    <TableData className='line-clamp-3'>
                      {task?.MasterPhaseMasterTask?.map((task) => task?.MasterPhase?.name).join(
                        ', ',
                      ) || '—'}
                    </TableData>
                    <TableData>{task.duration != null ? `${task.duration} days` : '—'}</TableData>
                    <TableData>{task.predecessorTask?.name || '—'}</TableData>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <div className='flex items-center space-x-2'>
                        <CopyButton tooltip='Copy Task' onCopy={() => handleCopy(task)} />
                        <EditButton tooltip='Edit Task' onEdit={() => handleEdit(task)} />
                        <DeleteButton
                          tooltip='Delete Task'
                          onDelete={() => {
                            setSelectedTask(task);
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
        title={`Delete ${selectedTask?.name}?`}
        subtitle="This action can't be undone"
        onClose={closeDelete}
        opened={openedDelete}
        onConfirm={handleDelete}
      />

      {/* Bulk delete confirmation modal */}
      <AlertModal
        isLoading={isBulkDeleting}
        title={`Delete ${selectedIds.size} task(s)?`}
        subtitle="This action can't be undone"
        onClose={closeBulkDelete}
        opened={openedBulkDelete}
        onConfirm={handleBulkDeleteConfirm}
      />

      {/* Edit sidebar */}
      <EditTaskSidebar
        taskData={selectedTask}
        isOpen={isOpenEditSidebar}
        onClose={closeEditSidebar}
      />
    </>
  );
}
