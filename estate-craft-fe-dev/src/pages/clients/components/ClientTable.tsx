import { motion } from 'framer-motion';
import { Table, Modal } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

import {
  useDeleteClientMutation,
  useGetClientsQuery,
  useUpdateClientStatusMutation,
} from '../../../store/services/client/clientSlice';

import { TextHeader } from '../../../components/base/table/TableHeader';
import { DeleteButton, EditButton, Button } from '../../../components/base';
import { Avatar } from '../../../components/common';
import { StarIcon } from '../../../components/icons';
import StatusBadge from '../../../components/common/StatusBadge';
import TableData from '../../../components/base/table/TableData';
import CustomPagination from '../../../components/base/CustomPagination';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { getTotalPages } from '../../../utils/helper';
import EditClientSidebar from '../../../components/client/EditClientSidebar';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import type { TClient } from '../../../store/types/client.types';
import AlertModal from '../../../components/base/AlertModal';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../store/types/common.types';
import FormSelect from '../../../components/base/FormSelect';
import { ActionButton } from '../../../components/base/button/ActionButton';
import { FaUserCheck, FaUserAltSlash } from 'react-icons/fa';

export function ClientTable() {
  const { getParam } = useUrlSearchParams();
  const navigate = useNavigate();
  const [selectedClientData, setSelectedClientData] = useState<TClient | null>(null);
  const [selectedStatusClient, setSelectedStatusClient] = useState<TClient | null>(null);
  const [newClientStatus, setNewClientStatus] = useState<string>('');
  const [opened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [openedEditSidebar, { open: openEditSidebar, close: closeEditSidebar }] =
    useDisclosure(false);
  const [isStatusModalOpen, { open: openStatusModal, close: closeStatusModal }] =
    useDisclosure(false);
  const [deleteClient, { isLoading }] = useDeleteClientMutation();
  const [updateClientStatus, { isLoading: isUpdatingStatus }] = useUpdateClientStatusMutation();

  const statusParam = getParam('status');
  const statusValue = statusParam === null ? 'ACTIVE' : statusParam;

  function handleClientClick(client: TClient) {
    navigate(`/clients/${client.id}`);
  }

  function handleEditClient(client: TClient) {
    setSelectedClientData(client);
    openEditSidebar();
  }

  function handleDeleteClient() {
    if (!selectedClientData) {
      toast.error('Unable to delete client.');
      console.log('SelectedClientData is undefined/null');
      return;
    }
    deleteClient({ clientId: selectedClientData?.id })
      .unwrap()
      .then(() => {
        toast.success('Client deleted successfully');
        closeDeleteModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in creating user:', error);
      });
  }

  function handleOpenStatusModal(client: TClient) {
    setSelectedStatusClient(client);
    setNewClientStatus(client.status || 'ACTIVE');
    openStatusModal();
  }

  function handleUpdateStatus() {
    if (!selectedStatusClient || !newClientStatus) {
      toast.error('Please select a status');
      return;
    }

    updateClientStatus({
      clientId: selectedStatusClient.id,
      status: newClientStatus as 'ACTIVE' | 'INACTIVE',
    })
      .unwrap()
      .then(() => {
        toast.success('Client status updated successfully');
        closeStatusModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to update client status');
        console.log('Error in updating client status:', error);
      });
  }
  const { data: clientsData } = useGetClientsQuery({
    pageLimit: '10',
    pageNo: getParam('page') || '0',
    id: getParam('id'),
    projectId: getParam('projectId'),
    status: statusValue,
  });
  const totalPages = getTotalPages(clientsData?.totalCount, 10);
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className='rounded-lg h-full flex flex-col'
      >
        <div className='overflow-x-auto no-scrollbar h-full mb-5 bg-white'>
          <Table className='min-w-full'>
            <Table.Thead>
              <Table.Tr className='h-12'>
                <TextHeader config='narrow'>#</TextHeader>
                <TextHeader config='standard'>Client</TextHeader>
                <TextHeader config='wider'>Project Name</TextHeader>
                <TextHeader config='wider'>Payment Progress</TextHeader>
                <TextHeader
                  config='standard'
                  isSticky={{ position: 'right', offset: 120, withShadow: true }}
                >
                  Status
                </TextHeader>
                <TextHeader
                  config='action'
                  isSticky={{ position: 'right', offset: 0, withShadow: true }}
                >
                  Actions
                </TextHeader>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody className='divide-y divide-gray-100'>
              {Array.isArray(clientsData?.clients) &&
                clientsData?.clients?.map((client) => (
                  <Table.Tr
                    onClick={() => handleClientClick(client)}
                    key={client?.id}
                    className='group h-12 border-b border-gray-200 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                    style={{
                      transformOrigin: 'center',
                    }}
                  >
                    <TableData className='flex items-center gap-8'>
                      {client?.sNo}
                      <StarIcon className='size-4 text-[#9E9E9E]' />
                    </TableData>
                    <TableData>
                      <div className='flex items-center gap-2'>
                        <Avatar
                          name={client?.name || ''}
                          phone={client?.phoneNumber}
                          email={client?.email}
                          size='sm'
                          showTooltip={true}
                        />
                        {client?.name}
                      </div>
                    </TableData>
                    <TableData>{client?.projectName ?? '—'}</TableData>
                    <TableData>
                      {client?.paymentProgress
                        ? (() => {
                            const { totalProjectCost = 0, totalPaidAmount = 0 } =
                              client.paymentProgress || {};
                            const percent =
                              totalProjectCost > 0
                                ? Math.round((totalPaidAmount / totalProjectCost) * 100)
                                : 0;
                            return (
                              <span className='text-sm text-gray-800 font-medium'>
                                ₹{totalPaidAmount.toLocaleString('en-IN')} / ₹
                                {totalProjectCost.toLocaleString('en-IN')} ({percent}%)
                              </span>
                            );
                          })()
                        : '—'}
                    </TableData>
                    <TableData className='bg-white transition-all duration-300 ease-in-out group-hover:bg-linear-to-r group-hover:from-blue-50 group-hover:to-indigo-50'>
                      <StatusBadge status={client?.status} />
                    </TableData>
                    <TableData className='bg-white transition-all duration-300 ease-in-out group-hover:bg-linear-to-r group-hover:from-blue-50 group-hover:to-indigo-50'>
                      <div
                        className='flex items-center space-x-2'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionButton
                          tooltip='Update Status'
                          icon={
                            client.status === 'ACTIVE' ? (
                              <FaUserCheck className='w-4 h-4' />
                            ) : (
                              <FaUserAltSlash className='w-4 h-4' />
                            )
                          }
                          variant='edit'
                          onClick={() => handleOpenStatusModal(client)}
                        />
                        <EditButton tooltip='Edit client' onEdit={() => handleEditClient(client)} />
                        <DeleteButton
                          tooltip='Delete client'
                          onDelete={() => {
                            setSelectedClientData(client);
                            openDeleteModal();
                          }}
                        />
                      </div>
                    </TableData>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </div>
        {totalPages > 1 && <CustomPagination total={totalPages} />}
      </motion.div>
      {opened && (
        <AlertModal
          isLoading={isLoading}
          title={`Delete ${selectedClientData?.name}?`}
          subtitle={`This action can'be undone`}
          onClose={closeDeleteModal}
          opened={opened}
          onConfirm={handleDeleteClient}
        />
      )}
      <EditClientSidebar
        clientData={selectedClientData}
        isOpen={openedEditSidebar}
        onClose={closeEditSidebar}
      />

      {/* Status Update Modal */}
      <Modal
        opened={isStatusModalOpen}
        onClose={closeStatusModal}
        title={
          selectedStatusClient
            ? `Update Client Status - ${selectedStatusClient.name}`
            : 'Update Client Status'
        }
        centered
        size='md'
      >
        <div className='space-y-4'>
          {selectedStatusClient && (
            <div className='space-y-1 text-sm text-gray-700'>
              <p>
                <span className='font-medium'>Name:</span> {selectedStatusClient.name}
              </p>
              <p>
                <span className='font-medium'>Email:</span> {selectedStatusClient.email}
              </p>
              <p className='flex items-center gap-2'>
                <span className='font-medium'>Current Status:</span>
                <StatusBadge status={selectedStatusClient.status} />
              </p>
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select New Status
            </label>
            <FormSelect
              placeholder='Select Status'
              value={newClientStatus}
              onChange={(val) => setNewClientStatus(val || '')}
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
              disabled={!newClientStatus || isUpdatingStatus}
              radius='md'
            >
              {isUpdatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
