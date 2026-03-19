import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Table } from '@mantine/core';

import { TextHeader } from '../base/table/TableHeader';
import { DeleteButton } from '../base';
import { EditButton } from '../base';
import { Button } from '..';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';
import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { toast } from 'react-toastify';
import TableData from '../base/table/TableData';
import CustomPagination from '../base/CustomPagination';
import AlertModal from '../base/AlertModal';
import TableSearchBar from '../common/TableSearchBar';
import ClearFilterButton from '../base/button/ClearFilterButton';
import TableLoader from '../common/loaders/TableLoader';
import {
  useGetPoliciesQuery,
  useDeletePolicyMutation,
} from '../../store/services/policy/policySlice';
import type { TPolicy } from '../../store/types/policy.types';
import type { TErrorResponse } from '../../store/types/common.types';
import AddEditPolicySidebar from './AddEditPolicySidebar';

export default function Policy() {
  const [searchParams] = useSearchParams();
  const { deleteParams, getParam } = useUrlSearchParams();
  const [query, setQuery] = useState(getParam('query') || '');
  const [isOpenAddSidebar, { open: openAddSidebar, close: closeAddSidebar }] = useDisclosure(false);

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
        <Button
          variant='primary'
          size='md'
          radius='full'
          className='bg-button-bg! text-white hover:bg-gray-800 w-fit px-5'
          onClick={openAddSidebar}
        >
          Add Policy
        </Button>
      </section>
      <PolicyTable />

      {/* Add Policy Sidebar */}
      <AddEditPolicySidebar isOpen={isOpenAddSidebar} onClose={closeAddSidebar} mode='add' />
    </div>
  );
}

/////////////////////////POLICY TABLE
function PolicyTable() {
  const [selectedPolicy, setSelectedPolicy] = useState<TPolicy | null>(null);
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '0';

  const [openedDelete, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [isOpenEditSidebar, { open: openEditSidebar, close: closeEditSidebar }] =
    useDisclosure(false);

  const {
    data: policiesData,
    isFetching,
    isError,
  } = useGetPoliciesQuery({
    pageNo: page,
    search: getParam('query') || '',
    searchText: getParam('globalQuery'),
  });

  const [deletePolicy, { isLoading }] = useDeletePolicyMutation();

  const totalPages = Math.ceil((policiesData?.totalCount || 1) / 10) || 1;

  function handleDelete() {
    if (!selectedPolicy?.id) {
      toast.error('Unable to delete Policy');
      console.log('selected policy is undefined');
      return;
    }
    deletePolicy({ id: selectedPolicy?.id })
      .unwrap()
      .then(() => {
        toast.success('Policy deleted successfully');
        closeDelete();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in deleting policy', error);
      });
  }

  function handleEdit(policy: TPolicy) {
    setSelectedPolicy(policy);
    openEditSidebar();
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
                <TextHeader config='standard'>Company Name</TextHeader>
                <TextHeader config='wider'>Address</TextHeader>
                <TextHeader config='standard'>City</TextHeader>
                <TextHeader config='standard'>State</TextHeader>
                <TextHeader config='standard'>GST IN</TextHeader>
                <TextHeader config='standard'>Actions</TextHeader>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isFetching || !Array.isArray(policiesData?.policies) || isError ? (
                <TableLoader />
              ) : (
                policiesData?.policies?.map((policy, index) => (
                  <Table.Tr
                    onClick={() => handleEdit(policy)}
                    key={policy.id}
                    className='group h-12 border-b border-gray-200 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                  >
                    {/* SNO */}
                    <TableData>{policy?.sNo || index + 1}</TableData>
                    {/* COMPANY NAME */}
                    <TableData>{policy?.companyName}</TableData>
                    {/* ADDRESS */}
                    <TableData>{policy?.address}</TableData>
                    {/* CITY */}
                    <TableData>{policy?.city}</TableData>
                    {/* STATE */}
                    <TableData>{policy?.state}</TableData>
                    {/* GST IN */}
                    <TableData>{policy?.gstIn}</TableData>
                    {/* ACTIONS */}
                    <Table.Td>
                      <div className='flex items-center space-x-2'>
                        <EditButton tooltip='Edit Policy' onEdit={() => handleEdit(policy)} />
                        <DeleteButton
                          tooltip='Delete Policy'
                          onDelete={() => {
                            setSelectedPolicy(policy);
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
        title={`Delete ${selectedPolicy?.companyName}?`}
        subtitle="This action can't be undone"
        onClose={closeDelete}
        opened={openedDelete}
        onConfirm={handleDelete}
      />

      {/* Edit Policy Sidebar */}
      <AddEditPolicySidebar
        isOpen={isOpenEditSidebar}
        onClose={closeEditSidebar}
        mode='edit'
        policyData={selectedPolicy}
      />
    </>
  );
}
