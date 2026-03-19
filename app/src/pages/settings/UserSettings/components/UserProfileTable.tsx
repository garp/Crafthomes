import { Modal, Table, Text } from '@mantine/core';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { toast } from 'react-toastify';
import { TextHeader } from '../../../../components/base/table/TableHeader';
import { ActionButton, Button, EditButton } from '../../../../components/base';
import { Avatar } from '../../../../components';
import { getRoleColor } from '../../constants/constants';
import { InProgressIcon } from '../../../../components/icons';
import { FaUserAltSlash, FaUserCheck } from 'react-icons/fa';
import { getUser } from '../../../../utils/auth';
import {
  useGetUserSettingsQuery,
  useDeleteUserSettingsMutation,
  useUpdateUserSettingsStatusMutation,
} from '../../../../store/services/settings/settings';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import EditUserSettingsSidebar from '../../../../components/settings/EditUserSettingsSidebar';
import type { TUser } from '../../../../store/types/user.types';
import type { TErrorResponse } from '../../../../store/types/common.types';
import TableLoader from '../../../../components/common/loaders/TableLoader';
import NotFoundTextTable from '../../../../components/common/NotFound';
import TableWrapper from '../../../../components/base/table/TableWrapper';
import AlertModal from '../../../../components/base/AlertModal';
import StatusBadge from '../../../../components/common/StatusBadge';
import FormSelect from '../../../../components/base/FormSelect';

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

export const UserProfileTable = () => {
  const { getParam } = useUrlSearchParams();
  const statusParam = getParam('status');
  const statusValue = statusParam === null ? 'ACTIVE' : statusParam;

  const { data: userSettingsData, isFetching } = useGetUserSettingsQuery({
    pageNo: getParam('page') || '',
    pageLimit: '10',
    status: statusValue,
  });
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserSettingsMutation();
  const [updateUserStatus, { isLoading: isUpdatingStatus }] = useUpdateUserSettingsStatusMutation();

  // State for edit sidebar
  const [isEditUserSidebarOpen, setIsEditUserSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TUser | null>(null);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const [openedDelete, { close: closeDeleteModal }] = useDisclosure(false);
  const [isStatusModalOpen, { open: openStatusModal, close: closeStatusModal }] =
    useDisclosure(false);

  const currentUserRoleName = getUser()?.role?.name?.toLowerCase?.() ?? '';
  const isClientOrVendorContact = ['client_contact', 'vendor_client'].includes(currentUserRoleName);
  const statusActionTooltip = isClientOrVendorContact
    ? 'You cannot update user status'
    : 'Update Status';
  const editActionTooltip = isClientOrVendorContact ? 'You cannot edit users' : 'Edit user';

  const handleEditUser = (userId: string) => {
    const user = userSettingsData?.data?.users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser({
        ...user,
        phoneNumber: user.phoneNumber,
        password: '', // We don't have password from the API
        organization: '',
        status: '',
        department: user.department || '',
        location: user.location || '',
        startDate: user.startDate || user.dateAdded,
        sNo: 0,
      });
      setIsEditUserSidebarOpen(true);
    }
  };

  // Delete is disabled for now; keep placeholder if needed in future
  // const handleOpenDeleteUser = (_userId: string) => {};

  const handleConfirmDeleteUser = () => {
    if (!userIdToDelete) return;

    deleteUser({ userId: userIdToDelete })
      .unwrap()
      .then(() => {
        toast.success('User deleted successfully');
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to delete user');
        }
        console.error('Error deleting user:', error);
      })
      .finally(() => {
        closeDeleteModal();
        setUserIdToDelete(null);
      });
  };

  const handleOpenStatusModal = (user: any) => {
    setStatusModalUser(user);
    setNewStatus((user as TUser)?.status || 'ACTIVE');
    openStatusModal();
  };

  const handleUpdateStatus = () => {
    if (!statusModalUser || !newStatus) {
      toast.error('Please select a status');
      return;
    }

    updateUserStatus({
      userId: statusModalUser.id,
      status: newStatus as 'ACTIVE' | 'INACTIVE',
    })
      .unwrap()
      .then(() => {
        toast.success('User status updated successfully');
        closeStatusModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Failed to update user status');
        }
        console.error('Error updating user status:', error);
      });
  };

  return (
    <>
      <TableWrapper totalCount={userSettingsData?.data?.totalCount}>
        <Table.Thead>
          <Table.Tr className='h-12'>
            <TextHeader config='standard'>#</TextHeader>
            <TextHeader config='standard'>Name</TextHeader>
            <TextHeader config='wider'>Designation</TextHeader>
            <TextHeader config='wider'>Reports To</TextHeader>
            <TextHeader config='wider'>Role</TextHeader>
            <TextHeader config='standard'>Status</TextHeader>
            <TextHeader config='standard'>Last Active</TextHeader>
            <TextHeader config='standard'>Invite Status</TextHeader>
            <TextHeader config='standard'>Actions</TextHeader>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isFetching ? (
            <TableLoader />
          ) : userSettingsData?.data?.users.length === 0 ? (
            <NotFoundTextTable title='No Users Found' />
          ) : (
            userSettingsData?.data?.users.map((user) => (
              <Table.Tr
                key={user.id}
                className='group h-12 border-b border-gray-200 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
                style={{
                  transformOrigin: 'center',
                }}
                onClick={() => handleEditUser(user.id)}
              >
                <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                  <Text
                    size='sm'
                    className='flex items-center text-center gap-5 text-sm font-medium text-gray-900'
                  >
                    {user.sNo ?? 0}
                  </Text>
                </Table.Td>
                <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                  <div className='flex items-center space-x-3'>
                    <Avatar
                      name={user.name}
                      phone={user.phoneNumber}
                      email={user.email}
                      size='sm'
                      showTooltip={true}
                      tooltipTitle='User contact details'
                      bgColor='bg-blue-500'
                    />
                    <Text size='sm' className='font-medium text-gray-900'>
                      {user.name}
                    </Text>
                  </div>
                </Table.Td>
                <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                  <Text size='sm'>
                    {typeof user.designation === 'object'
                      ? user.designation?.displayName
                      : user.designation}
                  </Text>
                </Table.Td>
                <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                  <Text size='sm' className='text-gray-700'>
                    {user.ReportsTo?.name || '—'}
                  </Text>
                </Table.Td>
                <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                      user?.role?.name,
                    )}`}
                  >
                    <span className='w-2 h-2 rounded-full bg-current mr-1.5'></span>
                    {typeof user.designation === 'object' && user.designation?.meta?.role
                      ? user.designation.meta.role
                      : (user?.role?.name ?? '')
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </Table.Td>
                <Table.Td
                  style={{ borderBottom: '1px solid #d1d5db' }}
                  className='cursor-pointer'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStatusModal(user);
                  }}
                >
                  <StatusBadge status={(user as unknown as TUser)?.status ?? 'ACTIVE'} />
                </Table.Td>
                <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                  <Text size='sm'>{user?.lastActive ?? '2024-02-01'}</Text>
                </Table.Td>
                <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInviteStateClass(
                      user.inviteState,
                    )}`}
                  >
                    {formatInviteStateLabel(user.inviteState)}
                  </span>
                </Table.Td>
                <Table.Td style={{ borderBottom: '1px solid #d1d5db' }}>
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
                        handleEditUser(user.id);
                      }}
                    />
                  </div>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </TableWrapper>

      {/* Edit User Sidebar */}
      <EditUserSettingsSidebar
        isOpen={isEditUserSidebarOpen}
        onClose={() => {
          setIsEditUserSidebarOpen(false);
          setSelectedUser(null);
        }}
        userData={selectedUser}
        userId={selectedUser?.id || ''}
      />

      {/* Delete confirmation modal */}
      <AlertModal
        isLoading={isDeleting}
        title='Are you sure?'
        subtitle="This action can't be undone"
        onClose={closeDeleteModal}
        opened={openedDelete}
        onConfirm={handleConfirmDeleteUser}
      />
      <Modal
        opened={isStatusModalOpen}
        onClose={closeStatusModal}
        title={
          statusModalUser ? `Update User Status - ${statusModalUser.name}` : 'Update User Status'
        }
        centered
        size='md'
      >
        <div className='space-y-4'>
          {statusModalUser && (
            <div className='space-y-1 text-sm text-gray-700'>
              <p>
                <span className='font-medium'>Name:</span> {statusModalUser.name}
              </p>
              <p>
                <span className='font-medium'>Email:</span> {statusModalUser.email}
              </p>
              <p className='flex items-center gap-2'>
                <span className='font-medium'>Current Status:</span>
                <StatusBadge status={(statusModalUser as TUser)?.status ?? 'ACTIVE'} />
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
    </>
  );
};
