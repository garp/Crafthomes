// import { IconSearch } from '@tabler/icons-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Table } from '@mantine/core';

import { TextHeader } from '../base/table/TableHeader';
import { DeleteButton } from '../base';
import { EditButton } from '../base';
import { Button } from '..';
import {
  useDeleteProjectTypeMutation,
  useGetProjectTypesQuery,
} from '../../store/services/projectType/projectTypeSlice';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';
import { useState, useEffect } from 'react';
import type { TProjectType } from '../../store/types/projectType.types';
import { useDisclosure } from '@mantine/hooks';
import { toast } from 'react-toastify';
import TableData from '../base/table/TableData';
import CustomPagination from '../base/CustomPagination';
import AlertModal from '../base/AlertModal';
import type { TErrorResponse } from '../../store/types/common.types';
import TableSearchBar from '../common/TableSearchBar';
import ClearFilterButton from '../base/button/ClearFilterButton';
import TableLoader from '../common/loaders/TableLoader';

export default function ProjectType() {
  const [searchParams] = useSearchParams();
  const { deleteParams, getParam } = useUrlSearchParams();
  const [query, setQuery] = useState(getParam('query') || '');

  useEffect(() => {
    const urlQuery = searchParams.get('query') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  function handleClearFilters() {
    setQuery('');
    deleteParams(['query', 'globalQuery']);
  }
  return (
    <div className='h-full flex flex-col'>
      {/* SEARCH SECTION */}
      <section className='flex md:flex-row flex-col justify-between gap-y-5 gap-x-5'>
        <div className='flex gap-5 mt-5'>
          <TableSearchBar query={query} setQuery={setQuery} />
          <ClearFilterButton onClick={handleClearFilters} />
        </div>
        <Link to={'/settings/add-project-type'}>
          <Button
            variant='primary'
            size='md'
            radius='full'
            className='bg-button-bg! text-white hover:bg-gray-800 w-fit px-5'
          >
            Add Project type
          </Button>
        </Link>
      </section>
      <ProjectTypeTable />
    </div>
  );
}
/////////////////////////PROJECT TYPE TABLE
function ProjectTypeTable() {
  const [selectedProjectType, setSelectedProjectType] = useState<TProjectType | null>(null);
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '0';
  const navigate = useNavigate();

  const [openedDelete, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  // const [openedEdit, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  const {
    data: projectTypesData,
    isFetching,
    isError,
  } = useGetProjectTypesQuery({
    pageNo: page,
    search: getParam('query') || '',
    searchText: getParam('globalQuery'),
  });
  const [deleteProjectType, { isLoading }] = useDeleteProjectTypeMutation();

  const totalPages = Math.ceil((projectTypesData?.totalCount || 1) / 10) || 1;

  function handleDelete() {
    if (!selectedProjectType?.id) {
      toast.error('Unable to delete Project type');
      console.log('selected project type is undefined');
      return;
    }
    deleteProjectType({ id: selectedProjectType?.id })
      .unwrap()
      .then(() => {
        toast.success('Project Type deleted successfully');
        closeDelete();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in deleting project type', error);
      });
  }

  function handleEdit(projectType: TProjectType) {
    setSelectedProjectType(projectType);
    navigate(`/settings/phase/edit-project-type/${projectType?.id}`);
  }

  return (
    <>
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
                <TextHeader config='narrow'>#</TextHeader>
                <TextHeader config='standard'>Project Type</TextHeader>
                <TextHeader config='wider'>Phases Count</TextHeader>
                <TextHeader config='wider'>Task Count</TextHeader>
                <TextHeader config='standard'>Actions</TextHeader>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isFetching || !Array.isArray(projectTypesData?.projectTypes) || isError ? (
                <TableLoader />
              ) : (
                projectTypesData?.projectTypes?.map((projectType, index) => (
                  <Table.Tr
                    onClick={() => handleEdit(projectType)}
                    key={projectType.id}
                    className='group h-12 border-b border-gray-200 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                  >
                    {/* SNO */}
                    <TableData>{index + 1}</TableData>
                    {/* NAME */}
                    <TableData>{projectType?.name}</TableData>
                    {/* PHASE COUNT */}
                    <TableData>{projectType?.phasesCount}</TableData>
                    {/* TASK COUNT */}
                    <TableData>{projectType?.tasksCount}</TableData>
                    {/* ACTIONS */}
                    <Table.Td>
                      <div className='flex items-center space-x-2'>
                        <EditButton
                          tooltip='Edit Project Type'
                          onEdit={() => handleEdit(projectType)}
                        />
                        <DeleteButton
                          tooltip='Delete Project Type'
                          onDelete={() => {
                            setSelectedProjectType(projectType);
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
        title={`Delete ${selectedProjectType?.name}?`}
        subtitle="This action can't be undone"
        onClose={closeDelete}
        opened={openedDelete}
        onConfirm={handleDelete}
      />

      {/* Edit sidebar */}
      {/* <EditProjectTypeSidebar
        projectTypeData={selectedProjectType}
        isOpen={openedEdit}
        onClose={closeEdit}
      /> */}
    </>
  );
}
