import { useParams } from 'react-router-dom';
import { PageTransition } from '../../components';
import {
  useGetVendorsQuery,
  useUpdateVendorStatusMutation,
} from '../../store/services/vendor/vendorSlice';
import { useGetUsersQuery, useUpdateUserStatusMutation } from '../../store/services/user/userSlice';
import { Loader } from '../../components';
import BackButton from '../../components/base/button/BackButton';
import { Button } from '../../components/base';
import { useDisclosure } from '@mantine/hooks';
import EditVendorSidebar from '../../components/vendor/EditVendorSidebar';
import EditUserSidebar from '../../components/users/EditUserSidebar';
import type { TUser } from '../../store/types/user.types';
import { Avatar } from '../../components/common';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import StatusBadge from '../../components/common/StatusBadge';
import { Table, Pagination, Modal } from '@mantine/core';
import TableData from '../../components/base/table/TableData';
import { TextHeader } from '../../components/base/table/TableHeader';
import { AddVendorContactSidebar } from '../../components/vendor/AddVendorContactSidebar';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';
import FormSelect from '../../components/base/FormSelect';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../store/types/common.types';
import { FaUserCheck, FaUserAltSlash } from 'react-icons/fa';
import { ActionButton } from '../../components/base/button/ActionButton';
import TableSearchBar from '../../components/common/TableSearchBar';
import { useState } from 'react';

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

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getParam, setParams } = useUrlSearchParams();
  const [selectedContact, setSelectedContact] = useState<TUser | null>(null);
  const [selectedStatusContact, setSelectedStatusContact] = useState<TUser | null>(null);
  const [newContactStatus, setNewContactStatus] = useState<string>('');
  const [newVendorStatus, setNewVendorStatus] = useState<string>('');
  const [isAddContactOpen, { open: openAddContact, close: closeAddContact }] = useDisclosure(false);
  const [isEditVendorOpen, { open: openEditVendor, close: closeEditVendor }] = useDisclosure(false);
  const [isEditContactOpen, { open: openEditContact, close: closeEditContact }] =
    useDisclosure(false);
  const [isVendorStatusModalOpen, { open: openVendorStatusModal, close: closeVendorStatusModal }] =
    useDisclosure(false);
  const [
    isContactStatusModalOpen,
    { open: openContactStatusModal, close: closeContactStatusModal },
  ] = useDisclosure(false);

  const [updateVendorStatus, { isLoading: isUpdatingVendorStatus }] =
    useUpdateVendorStatusMutation();
  const [updateUserStatus, { isLoading: isUpdatingContactStatus }] = useUpdateUserStatusMutation();

  const contactsPage = getParam('contactsPage') || '0';
  const contactsSearch = getParam('contactsSearch') || '';
  const contactsStatus = getParam('contactsStatus');
  const pageLimit = '10';
  const [contactsQuery, setContactsQuery] = useState(contactsSearch);

  const { data: vendorsData, isLoading: isLoadingVendor } = useGetVendorsQuery({
    id: id || '',
    pageLimit: '1',
  });

  const { data: contactsData, isLoading: isLoadingContacts } = useGetUsersQuery(
    {
      vendorId: id || '',
      userType: 'VENDOR_CONTACT',
      pageLimit,
      pageNo: contactsPage,
      searchText: contactsSearch || undefined,
      status: contactsStatus || undefined,
    },
    { skip: !id },
  );

  const contactsTotalPages = Math.ceil((contactsData?.totalCount || 1) / parseInt(pageLimit));

  const vendor = vendorsData?.vendor?.[0];

  if (isLoadingVendor) {
    return (
      <PageTransition>
        <Loader variant='component' minHeight={400} text='Loading vendor details...' />
      </PageTransition>
    );
  }

  if (!vendor) {
    return (
      <PageTransition>
        <div className='flex flex-col gap-4'>
          <BackButton backTo='/vendors'>Back to Vendors</BackButton>
          <p className='text-gray-500'>Vendor not found</p>
        </div>
      </PageTransition>
    );
  }

  function handleEditContact(contact: TUser) {
    setSelectedContact(contact);
    openEditContact();
  }

  function handleOpenVendorStatusModal() {
    setNewVendorStatus(vendor?.status || 'ACTIVE');
    openVendorStatusModal();
  }

  function handleOpenContactStatusModal(contact: TUser) {
    setSelectedStatusContact(contact);
    setNewContactStatus(contact.status || 'ACTIVE');
    openContactStatusModal();
  }

  function handleUpdateVendorStatus() {
    if (!vendor || !newVendorStatus) {
      toast.error('Please select a status');
      return;
    }

    updateVendorStatus({ vendorId: vendor.id, status: newVendorStatus as 'ACTIVE' | 'INACTIVE' })
      .unwrap()
      .then(() => {
        toast.success('Vendor status updated successfully');
        closeVendorStatusModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to update vendor status');
        console.log('Error in updating vendor status:', error);
      });
  }

  function handleUpdateContactStatus() {
    if (!selectedStatusContact || !newContactStatus) {
      toast.error('Please select a status');
      return;
    }

    updateUserStatus({
      userId: selectedStatusContact.id,
      status: newContactStatus as 'ACTIVE' | 'INACTIVE',
    })
      .unwrap()
      .then(() => {
        toast.success('Contact status updated successfully');
        closeContactStatusModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to update contact status');
        console.log('Error in updating contact status:', error);
      });
  }

  function handleContactsPageChange(page: number) {
    setParams('contactsPage', (page - 1).toString());
  }

  return (
    <PageTransition>
      <div className='flex flex-col gap-6 pb-10'>
        <BackButton backTo='/vendors'>Back to Vendors</BackButton>

        {/* Vendor Info Section */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-start justify-between mb-6'>
            <div className='flex items-center gap-4'>
              <Avatar
                name={vendor.name || ''}
                phone={vendor.phoneNumber}
                email={vendor.email}
                size='lg'
                showTooltip
              />
              <div>
                <h2 className='text-2xl font-bold text-gray-900'>{vendor.name}</h2>
                <p className='text-sm text-gray-500 mt-1'>{vendor.email}</p>
                <p className='text-sm text-gray-500'>{vendor.phoneNumber}</p>
              </div>
            </div>
            <Button variant='outline' onClick={openEditVendor} className='flex items-center gap-2'>
              <IconPencil className='size-4' />
              Edit Vendor
            </Button>
          </div>

          <div className='grid grid-cols-2 gap-6 mt-6'>
            {vendor.panDetails && (
              <div>
                <p className='text-sm font-medium text-gray-500'>PAN Details</p>
                <p className='text-sm text-gray-900 mt-1'>{vendor.panDetails}</p>
              </div>
            )}
            <div>
              <div className='flex items-center gap-2'>
                <p className='text-sm font-medium text-gray-500'>Status</p>
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
                  onClick={handleOpenVendorStatusModal}
                />
              </div>
              <div className='mt-1'>
                <StatusBadge status={vendor.status} />
              </div>
            </div>
            {vendor.specializations && vendor.specializations.length > 0 && (
              <div className='col-span-2'>
                <p className='text-sm font-medium text-gray-500 mb-2'>Specialized In</p>
                <div className='flex flex-wrap gap-2'>
                  {vendor.specializations.map((sp) => (
                    <span
                      key={sp.id}
                      className='px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm'
                    >
                      {sp.specialized?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contacts Section */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Vendor Contacts</h3>
            <Button onClick={openAddContact} className='flex items-center gap-2'>
              <IconPlus className='size-4' />
              Add Vendor Contact
            </Button>
          </div>

          {/* Filters */}
          <div className='flex flex-wrap gap-3 mb-4'>
            <div className='flex-1 min-w-[200px] max-w-md'>
              <TableSearchBar
                query={contactsQuery}
                setQuery={setContactsQuery}
                searchKey='contactsSearch'
                className='w-full border rounded-lg shadow-sm'
              />
            </div>
            <FormSelect
              inputClassName='!rounded-lg !py-6 shadow-sm'
              placeholder='Filter by status'
              value={contactsStatus || ''}
              onChange={(val) => setParams('contactsStatus', val || '')}
              options={[
                { value: '', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              clearable
              className='min-w-[180px]'
            />
            {(contactsSearch || contactsStatus) && (
              <Button
                variant='outline'
                onClick={() => {
                  setContactsQuery('');
                  setParams('contactsSearch', '');
                  setParams('contactsStatus', '');
                }}
                className='flex items-center gap-2'
              >
                Clear Filters
              </Button>
            )}
          </div>

          {isLoadingContacts ? (
            <Loader variant='component' minHeight={200} text='Loading contacts...' />
          ) : contactsData?.users && contactsData.users.length > 0 ? (
            <>
              <div className='overflow-x-auto'>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <TextHeader config='standard'>Name</TextHeader>
                      <TextHeader config='wider'>Email</TextHeader>
                      <TextHeader config='standard'>Phone</TextHeader>
                      <TextHeader config='standard'>Status</TextHeader>
                      <TextHeader config='standard'>Invite Status</TextHeader>
                      <TextHeader config='action'>Actions</TextHeader>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {contactsData.users.map((contact) => (
                      <Table.Tr key={contact.id} className='hover:bg-gray-50'>
                        <TableData>
                          <div className='flex items-center gap-2'>
                            <Avatar
                              name={contact.name || ''}
                              phone={contact.phoneNumber}
                              email={contact.email}
                              size='sm'
                              showTooltip
                            />
                            {contact.name}
                          </div>
                        </TableData>
                        <TableData>{contact.email}</TableData>
                        <TableData>{contact.phoneNumber}</TableData>
                        <TableData>
                          <StatusBadge status={contact.status || 'ACTIVE'} />
                        </TableData>
                        <TableData>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInviteStateClass(
                              contact.inviteState,
                            )}`}
                          >
                            {formatInviteStateLabel(contact.inviteState)}
                          </span>
                        </TableData>
                        <TableData>
                          <div className='flex items-center gap-2'>
                            <ActionButton
                              tooltip='Update Status'
                              icon={
                                contact.status === 'ACTIVE' ? (
                                  <FaUserCheck className='w-4 h-4' />
                                ) : (
                                  <FaUserAltSlash className='w-4 h-4' />
                                )
                              }
                              variant='edit'
                              onClick={() => handleOpenContactStatusModal(contact)}
                            />
                            <Button
                              variant='light'
                              size='sm'
                              onClick={() => handleEditContact(contact)}
                            >
                              Edit
                            </Button>
                          </div>
                        </TableData>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
              {contactsTotalPages > 1 && (
                <div className='mt-4 flex justify-center'>
                  <Pagination
                    value={parseInt(contactsPage) + 1}
                    onChange={handleContactsPageChange}
                    total={contactsTotalPages}
                  />
                </div>
              )}
            </>
          ) : (
            <p className='text-gray-500 text-center py-8'>No contacts found</p>
          )}
        </div>

        {/* Modals */}
        <AddVendorContactSidebar
          isOpen={isAddContactOpen}
          onClose={closeAddContact}
          vendorId={id || ''}
          onCreated={() => {
            closeAddContact();
          }}
        />

        <EditVendorSidebar
          isOpen={isEditVendorOpen}
          onClose={closeEditVendor}
          vendorData={vendor}
        />

        {selectedContact && (
          <EditUserSidebar
            isOpen={isEditContactOpen}
            onClose={closeEditContact}
            userData={selectedContact}
            userId={selectedContact.id}
          />
        )}

        {/* Vendor Status Update Modal */}
        <Modal
          opened={isVendorStatusModalOpen}
          onClose={closeVendorStatusModal}
          title={vendor ? `Update Vendor Status - ${vendor.name}` : 'Update Vendor Status'}
          centered
          size='md'
        >
          <div className='space-y-4'>
            {vendor && (
              <div className='space-y-1 text-sm text-gray-700'>
                <p>
                  <span className='font-medium'>Name:</span> {vendor.name}
                </p>
                <p>
                  <span className='font-medium'>Email:</span> {vendor.email}
                </p>
                <p className='flex items-center gap-2'>
                  <span className='font-medium'>Current Status:</span>
                  <StatusBadge status={vendor.status} />
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
                onClick={closeVendorStatusModal}
                disabled={isUpdatingVendorStatus}
                radius='md'
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateVendorStatus}
                disabled={!newVendorStatus || isUpdatingVendorStatus}
                radius='md'
              >
                {isUpdatingVendorStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Contact Status Update Modal */}
        <Modal
          opened={isContactStatusModalOpen}
          onClose={closeContactStatusModal}
          title={
            selectedStatusContact
              ? `Update Contact Status - ${selectedStatusContact.name}`
              : 'Update Contact Status'
          }
          centered
          size='md'
        >
          <div className='space-y-4'>
            {selectedStatusContact && (
              <div className='space-y-1 text-sm text-gray-700'>
                <p>
                  <span className='font-medium'>Name:</span> {selectedStatusContact.name}
                </p>
                <p>
                  <span className='font-medium'>Email:</span> {selectedStatusContact.email}
                </p>
                <p className='flex items-center gap-2'>
                  <span className='font-medium'>Current Status:</span>
                  <StatusBadge status={selectedStatusContact.status || 'ACTIVE'} />
                </p>
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Select New Status
              </label>
              <FormSelect
                placeholder='Select Status'
                value={newContactStatus}
                onChange={(val) => setNewContactStatus(val || '')}
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
                onClick={closeContactStatusModal}
                disabled={isUpdatingContactStatus}
                radius='md'
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateContactStatus}
                disabled={!newContactStatus || isUpdatingContactStatus}
                radius='md'
              >
                {isUpdatingContactStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
