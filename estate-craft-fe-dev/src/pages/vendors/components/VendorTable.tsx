import { motion } from 'framer-motion';
import { Table, Modal } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { TextHeader } from '../../../components/base/table/TableHeader';
import { DeleteButton, EditButton, Button } from '../../../components/base';
import { StarIcon } from '../../../components/icons';
import { Avatar } from '../../../components';
import TableData from '../../../components/base/table/TableData';
import AlertModal from '../../../components/base/AlertModal';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { toast } from 'react-toastify';

import {
  useGetVendorsQuery,
  useDeleteVendorMutation,
  useUpdateVendorStatusMutation,
} from '../../../store/services/vendor/vendorSlice';
import type { TVendor } from '../../../store/types/vendor.types';
import CustomPagination from '../../../components/base/CustomPagination';
import type { TErrorResponse } from '../../../store/types/common.types';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { getTotalPages } from '../../../utils/helper';
import EditVendorSidebar from '../../../components/vendor/EditVendorSidebar';
import TableLoader from '../../../components/common/loaders/TableLoader';
import StatusBadge from '../../../components/common/StatusBadge';
import FormSelect from '../../../components/base/FormSelect';
import { ActionButton } from '../../../components/base/button/ActionButton';
import { FaUserCheck, FaUserAltSlash } from 'react-icons/fa';

export const VendorTable = () => {
  const { getParam } = useUrlSearchParams();
  const navigate = useNavigate();
  const [selectedVendor, setSelectedVendor] = useState<TVendor | null>(null);
  const [selectedStatusVendor, setSelectedStatusVendor] = useState<TVendor | null>(null);
  const [newVendorStatus, setNewVendorStatus] = useState<string>('');
  const [opened, { open, close }] = useDisclosure(false);
  const [isOpenEditVendorSidebar, { open: openEditVendorSidebar, close: closeEditVendorSidebar }] =
    useDisclosure(false);
  const [isStatusModalOpen, { open: openStatusModal, close: closeStatusModal }] =
    useDisclosure(false);

  const statusParam = getParam('status');
  const statusValue = statusParam === null ? 'ACTIVE' : statusParam;

  const { data: vendorData, isFetching: isFetchingVendors } = useGetVendorsQuery({
    pageLimit: '10',
    pageNo: getParam('page') || '0',
    search: getParam('query'),
    searchText: getParam('globalQuery'),
    id: getParam('id'),
    projectId: getParam('projectId'),
    status: statusValue,
  });

  const [triggerDeleteVendor, { isLoading }] = useDeleteVendorMutation();
  const [updateVendorStatus, { isLoading: isUpdatingStatus }] = useUpdateVendorStatusMutation();

  const handleDelete = () => {
    triggerDeleteVendor(selectedVendor?.id || '')
      .unwrap()
      .then(() => {
        toast.success('Vendor deleted successfully');
        close();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to delete Vendor');
        console.log('Error in deleting vendor:', error);
      });
  };

  const handleVendorClick = (vendor: TVendor) => {
    navigate(`/vendors/${vendor.id}`);
  };

  const handleEdit = (vendor: TVendor) => {
    setSelectedVendor(vendor);
    openEditVendorSidebar();
  };

  function handleOpenStatusModal(vendor: TVendor) {
    setSelectedStatusVendor(vendor);
    setNewVendorStatus(vendor.status || 'ACTIVE');
    openStatusModal();
  }

  function handleUpdateStatus() {
    if (!selectedStatusVendor || !newVendorStatus) {
      toast.error('Please select a status');
      return;
    }

    updateVendorStatus({
      vendorId: selectedStatusVendor.id,
      status: newVendorStatus as 'ACTIVE' | 'INACTIVE',
    })
      .unwrap()
      .then(() => {
        toast.success('Vendor status updated successfully');
        closeStatusModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to update vendor status');
        console.log('Error in updating vendor status:', error);
      });
  }

  const totalPages = getTotalPages(vendorData?.totalCount, 10);

  return (
    <>
      <div className='h-full flex flex-col'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='bg-white rounded-lg border border-gray-200 overflow-x-auto no-scrollbar h-[calc(100vh-15rem)] mb-5'
        >
          <Table withRowBorders className='rounded-lg min-w-[1000px]'>
            <Table.Thead>
              <Table.Tr className='h-12'>
                <TextHeader config='narrow'>#</TextHeader>
                <TextHeader config='standard'>Vendor</TextHeader>
                <TextHeader config='wider'>Specialized In</TextHeader>
                <TextHeader config='standard'>Status</TextHeader>
                <TextHeader config='standard'>Actions</TextHeader>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isFetchingVendors ? (
                <TableLoader />
              ) : (
                Array.isArray(vendorData?.vendor) &&
                vendorData?.vendor?.map((vendor) => (
                  <Table.Tr
                    onClick={() => handleVendorClick(vendor)}
                    key={vendor?.id}
                    className='group h-12 border-b border-gray-200 bg-white  hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                    style={{ transformOrigin: 'center' }}
                  >
                    <TableData>
                      <div className='flex items-center gap-5 text-sm font-medium text-gray-900'>
                        {vendor?.sNo}
                        <StarIcon className='size-4 text-[#9E9E9E]' />
                      </div>
                    </TableData>
                    <TableData>
                      <div className='flex items-center space-x-3'>
                        <Avatar
                          name={vendor?.name}
                          phone={vendor?.phoneNumber}
                          email={vendor?.email}
                          size='sm'
                          showTooltip
                        />
                        <p>{vendor.name}</p>
                      </div>
                    </TableData>
                    <TableData>
                      {vendor?.specializations?.map((s) => s?.specialized?.name).toString()}
                    </TableData>
                    {/* STATUS */}
                    <TableData>
                      <StatusBadge status={vendor.status} />
                    </TableData>
                    <Table.Td>
                      <div
                        className='flex items-center space-x-2'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionButton
                          tooltip='Update Status'
                          icon={
                            vendor.status === 'ACTIVE' ? (
                              <FaUserCheck className='w-4 h-4' />
                            ) : (
                              <FaUserAltSlash className='w-4 h-4' />
                            )
                          }
                          variant='edit'
                          onClick={() => handleOpenStatusModal(vendor)}
                        />
                        <EditButton tooltip='Edit Vendor' onEdit={() => handleEdit(vendor)} />
                        <DeleteButton
                          tooltip='Delete Vendor'
                          onDelete={() => {
                            setSelectedVendor(vendor);
                            open();
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
        {totalPages > 1 && <CustomPagination total={totalPages} />}
      </div>

      <AlertModal
        isLoading={isLoading}
        title={`Delete ${selectedVendor?.name}?`}
        onClose={close}
        opened={opened}
        onConfirm={handleDelete}
      />
      <EditVendorSidebar
        isOpen={isOpenEditVendorSidebar}
        onClose={closeEditVendorSidebar}
        vendorData={selectedVendor}
      />

      {/* Status Update Modal */}
      <Modal
        opened={isStatusModalOpen}
        onClose={closeStatusModal}
        title={
          selectedStatusVendor
            ? `Update Vendor Status - ${selectedStatusVendor.name}`
            : 'Update Vendor Status'
        }
        centered
        size='md'
      >
        <div className='space-y-4'>
          {selectedStatusVendor && (
            <div className='space-y-1 text-sm text-gray-700'>
              <p>
                <span className='font-medium'>Name:</span> {selectedStatusVendor.name}
              </p>
              <p>
                <span className='font-medium'>Email:</span> {selectedStatusVendor.email}
              </p>
              <p className='flex items-center gap-2'>
                <span className='font-medium'>Current Status:</span>
                <StatusBadge status={selectedStatusVendor.status} />
              </p>
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select New Status
            </label>
            <FormSelect
              placeholder='Select Status'
              value={newVendorStatus}
              onChange={(val) => setNewVendorStatus(val || '')}
              options={[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' },
              ]}
              required
            />
          </div>

          <div className='flex justify-end gap-3 mt-6'>
            <Button
              variant='outline'
              onClick={closeStatusModal}
              disabled={isUpdatingStatus}
              radius='md'
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!newVendorStatus || isUpdatingStatus}
              radius='md'
            >
              {isUpdatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
