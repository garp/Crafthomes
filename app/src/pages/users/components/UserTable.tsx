import { motion } from 'framer-motion';
import { Modal, Table } from '@mantine/core';
import { lazy } from 'react';
import type React from 'react';
import { FaUserAltSlash, FaUserCheck } from 'react-icons/fa';

import { TextHeader } from '../../../components/base/table/TableHeader';
import { ActionButton, Button, EditButton } from '../../../components/base';
import { InProgressIcon, StarIcon } from '../../../components/icons';
import { Avatar } from '../../../components';
import {
  useGetUsersQuery,
  useUpdateUserStatusMutation,
} from '../../../store/services/user/userSlice';
import TableData from '../../../components/base/table/TableData';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import FormSelect from '../../../components/base/FormSelect';
const EditUserSidebar = lazy(() => import('../../../components/users/EditUserSidebar'));

import type { TUser } from '../../../store/types/user.types';
import CustomPagination from '../../../components/base/CustomPagination';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { toast } from 'react-toastify';
import StatusBadge from '../../../components/common/StatusBadge';
import type { TErrorResponse } from '../../../store/types/common.types';
import { getUser } from '../../../utils/auth';

const inviteStateClasses: Record<string, string> = {
  SENT: 'bg-gray-100 text-gray-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  PASSWORD_ADDED: 'bg-indigo-100 text-indigo-700',
  REJECTED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

function getInviteStateClass(state?: string) {
  if (!state) return 'bg-gray-100 text-gray-700';
  return inviteStateClasses[state] ?? 'bg-gray-100 text-gray-700';
}

function formatInviteStateLabel(state?: string) {
  if (!state) return '—';
  return state
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const UserTable = () => {
  const { getParam } = useUrlSearchParams();
  const [selectedUserData, setSelectedUserData] = useState<TUser | null>(null);
  const [openedEditSidebar, { open: openEditSidebar, close: closeEditSidebar }] =
    useDisclosure(false);

  const [selectedStatusUser, setSelectedStatusUser] = useState<TUser | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isStatusModalOpen, { open: openStatusModal, close: closeStatusModal }] =
    useDisclosure(false);

  const statusParam = getParam('status');
  const statusValue = statusParam === null ? 'ACTIVE' : statusParam;

  const currentUserRoleName = getUser()?.role?.name?.toLowerCase?.() ?? '';
  const isClientOrVendorContact = ['client_contact', 'vendor_client'].includes(currentUserRoleName);
  const statusActionTooltip = isClientOrVendorContact
    ? 'You cannot update user status'
    : 'Update Status';
  const editActionTooltip = isClientOrVendorContact ? 'You cannot edit users' : 'Edit User';

  const { data: usersData } = useGetUsersQuery({
    projectId: getParam('projectId') || '',
    id: getParam('userId') || '',
    filterBy: getParam('filterBy') || '',
    clientId: getParam('clientId') || '',
    vendorId: getParam('vendorId') || '',
    status: statusValue,
    pageNo: getParam('page') || '',
    pageLimit: '10',
  });
  const [updateUserStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();

  function handleEdit(user: TUser) {
    setSelectedUserData(user);
    openEditSidebar();
  }

  function handleOpenStatusModal(user: TUser) {
    setSelectedStatusUser(user);
    setNewStatus(user.status || 'ACTIVE');
    openStatusModal();
  }

  function handleUpdateStatus() {
    if (!selectedStatusUser || !newStatus) {
      toast.error('Please select a status');
      return;
    }

    updateUserStatus({ userId: selectedStatusUser.id, status: newStatus as 'ACTIVE' | 'INACTIVE' })
      .unwrap()
      .then(() => {
        toast.success('User status updated successfully');
        closeStatusModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to update user status');
        console.log('Error in updating user status:', error);
      });
  }
  const totalPages = Math.ceil((usersData?.totalCount || 1) / 10) || 1;
  return (
    <>
      <div className='h-full flex flex-col'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='bg-white  rounded-lg border-gray-200 overflow-x-auto no-scrollbar h-[calc(100vh-15rem)] mb-5'
        >
          <Table withRowBorders className='rounded-lg'>
            <Table.Thead>
              <Table.Tr className='h-12'>
                <TextHeader config='narrow'>#</TextHeader>
                <TextHeader config='standard'>User</TextHeader>
                <TextHeader config='wider'>Department</TextHeader>
                <TextHeader config='wider'>Designation</TextHeader>
                <TextHeader config='standard'>Status</TextHeader>
                <TextHeader config='standard'>Invite Status</TextHeader>
                <TextHeader config='standard'>Actions</TextHeader>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody className='divide-y divide-gray-100'>
              {Array.isArray(usersData?.users) &&
                usersData?.users?.map((user) => {
                  if (getUser()?.id === user?.id) return;
                  return (
                    <Table.Tr
                      onClick={() => handleEdit(user)}
                      key={user?.id}
                      className='group h-12 border-b border-gray-200 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                      style={{
                        transformOrigin: 'center',
                      }}
                    >
                      <TableData>
                        <div className='flex  items-center gap-5 text-sm font-medium text-gray-900'>
                          {user?.sNo}
                          <StarIcon className='size-4 text-[#9E9E9E]' />
                        </div>
                      </TableData>
                      <TableData>
                        <div className='flex items-center space-x-3'>
                          <Avatar
                            name={user?.name}
                            phone={user?.phoneNumber}
                            email={user?.email}
                            size='sm'
                            showTooltip={true}
                          />
                          <p className=''>{user?.name}</p>
                        </div>
                      </TableData>
                      <TableData>{user?.department}</TableData>
                      <TableData>
                        {typeof user?.designation === 'object'
                          ? user?.designation?.displayName
                          : user?.designation}
                      </TableData>
                      <TableData className='cursor-pointer'>
                        <div
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleOpenStatusModal(user);
                          }}
                        >
                          <StatusBadge status={user?.status} />
                        </div>
                      </TableData>
                      <TableData>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInviteStateClass(
                            user.inviteState,
                          )}`}
                        >
                          {formatInviteStateLabel(user.inviteState)}
                        </span>
                      </TableData>
                      <Table.Td>
                        <div className='flex items-center space-x-2'>
                          <ActionButton
                            tooltip={statusActionTooltip}
                            icon={
                              user.status === 'ACTIVE' ? (
                                <FaUserCheck className='w-4 h-4' />
                              ) : user.status === 'INACTIVE' ? (
                                <FaUserAltSlash className='w-4 h-4' />
                              ) : (
                                <InProgressIcon className='w-4 h-4' />
                              )
                            }
                            disabled={isClientOrVendorContact}
                            onClick={() => {
                              if (isClientOrVendorContact) return;
                              handleOpenStatusModal(user);
                            }}
                          />
                          <EditButton
                            tooltip={editActionTooltip}
                            disabled={isClientOrVendorContact}
                            onEdit={() => {
                              if (isClientOrVendorContact) return;
                              handleEdit(user);
                            }}
                          />
                          {/* <DeleteButton
                            tooltip='Delete User'
                            onDelete={() => {
                              setSelectedUserId(user?.id);
                              open();
                            }}
                          /> */}
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
            </Table.Tbody>
          </Table>
        </motion.div>
        <CustomPagination total={totalPages} />
      </div>
      <Modal
        opened={isStatusModalOpen}
        onClose={closeStatusModal}
        title={
          selectedStatusUser
            ? `Update User Status - ${selectedStatusUser.name}`
            : 'Update User Status'
        }
        centered
        size='md'
      >
        <div className='space-y-4'>
          {selectedStatusUser && (
            <div className='space-y-1 text-sm text-gray-700'>
              <p>
                <span className='font-medium'>Name:</span> {selectedStatusUser.name}
              </p>
              <p>
                <span className='font-medium'>Email:</span> {selectedStatusUser.email}
              </p>
              <p className='flex items-center gap-2'>
                <span className='font-medium'>Current Status:</span>
                <StatusBadge status={selectedStatusUser.status} />
              </p>
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select New Status
            </label>
            <FormSelect
              placeholder='Select Status'
              value={newStatus}
              onChange={(val) => setNewStatus(val || '')}
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
              disabled={!newStatus || isUpdatingStatus}
              radius='md'
            >
              {isUpdatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>
      <EditUserSidebar
        userData={selectedUserData}
        onClose={closeEditSidebar}
        isOpen={openedEditSidebar}
        userId={selectedUserData?.id || ''}
      />
    </>
  );
};
