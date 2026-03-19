import { useParams } from 'react-router-dom';
import { PageTransition } from '../../components';
import {
  useGetClientsQuery,
  useUpdateClientStatusMutation,
} from '../../store/services/client/clientSlice';
import { useGetUsersQuery, useUpdateUserStatusMutation } from '../../store/services/user/userSlice';
import { Loader } from '../../components';
import BackButton from '../../components/base/button/BackButton';
import { Button } from '../../components/base';
import { useDisclosure } from '@mantine/hooks';
import { AddClientContactSidebar } from '../../components/client/AddClientContactSidebar';
import EditClientSidebar from '../../components/client/EditClientSidebar';
import EditUserSidebar from '../../components/users/EditUserSidebar';
import { useState } from 'react';
import type { TUser } from '../../store/types/user.types';
import { Avatar } from '../../components/common';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import StatusBadge from '../../components/common/StatusBadge';
import { Table, Pagination, Modal } from '@mantine/core';
import TableData from '../../components/base/table/TableData';
import { TextHeader } from '../../components/base/table/TableHeader';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';
import FormSelect from '../../components/base/FormSelect';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../store/types/common.types';
import { FaUserCheck, FaUserAltSlash } from 'react-icons/fa';
import { ActionButton } from '../../components/base/button/ActionButton';
import TableSearchBar from '../../components/common/TableSearchBar';

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

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getParam, setParams } = useUrlSearchParams();
  const [selectedContact, setSelectedContact] = useState<TUser | null>(null);
  const [selectedStatusContact, setSelectedStatusContact] = useState<TUser | null>(null);
  const [newContactStatus, setNewContactStatus] = useState<string>('');
  const [newClientStatus, setNewClientStatus] = useState<string>('');
  const [isAddContactOpen, { open: openAddContact, close: closeAddContact }] = useDisclosure(false);
  const [isEditClientOpen, { open: openEditClient, close: closeEditClient }] = useDisclosure(false);
  const [isEditContactOpen, { open: openEditContact, close: closeEditContact }] =
    useDisclosure(false);
  const [
    isContactStatusModalOpen,
    { open: openContactStatusModal, close: closeContactStatusModal },
  ] = useDisclosure(false);
  const [isClientStatusModalOpen, { open: openClientStatusModal, close: closeClientStatusModal }] =
    useDisclosure(false);

  const [updateClientStatus, { isLoading: isUpdatingClientStatus }] =
    useUpdateClientStatusMutation();
  const [updateUserStatus, { isLoading: isUpdatingContactStatus }] = useUpdateUserStatusMutation();

  const contactsPage = getParam('contactsPage') || '0';
  const contactsSearch = getParam('contactsSearch') || '';
  const contactsStatus = getParam('contactsStatus');
  const pageLimit = '10';
  const [contactsQuery, setContactsQuery] = useState(contactsSearch);

  const { data: clientsData, isLoading: isLoadingClient } = useGetClientsQuery({
    id: id || '',
    pageLimit: '1',
  });

  const { data: contactsData, isLoading: isLoadingContacts } = useGetUsersQuery(
    {
      clientId: id || '',
      userType: 'CLIENT_CONTACT',
      pageLimit,
      pageNo: contactsPage,
      searchText: contactsSearch || undefined,
      status: contactsStatus || undefined,
    },
    { skip: !id },
  );

  const contactsTotalPages = Math.ceil((contactsData?.totalCount || 1) / parseInt(pageLimit));

  const client = clientsData?.clients?.[0];

  if (isLoadingClient) {
    return (
      <PageTransition>
        <Loader variant='component' minHeight={400} text='Loading client details...' />
      </PageTransition>
    );
  }

  if (!client) {
    return (
      <PageTransition>
        <div className='flex flex-col gap-4'>
          <BackButton backTo='/clients'>Back to Clients</BackButton>
          <p className='text-gray-500'>Client not found</p>
        </div>
      </PageTransition>
    );
  }

  function handleEditContact(contact: TUser) {
    setSelectedContact(contact);
    openEditContact();
  }

  function handleOpenClientStatusModal() {
    setNewClientStatus(client?.status || 'ACTIVE');
    openClientStatusModal();
  }

  function handleOpenContactStatusModal(contact: TUser) {
    setSelectedStatusContact(contact);
    setNewContactStatus(contact.status || 'ACTIVE');
    openContactStatusModal();
  }

  function handleUpdateClientStatus() {
    if (!client || !newClientStatus) {
      toast.error('Please select a status');
      return;
    }

    updateClientStatus({ clientId: client.id, status: newClientStatus as 'ACTIVE' | 'INACTIVE' })
      .unwrap()
      .then(() => {
        toast.success('Client status updated successfully');
        closeClientStatusModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Unable to update client status');
        console.log('Error in updating client status:', error);
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
        <BackButton backTo='/clients'>Back to Clients</BackButton>

        {/* Client Info Section */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-start justify-between mb-6'>
            <div className='flex items-center gap-4'>
              <Avatar
                name={client.name || ''}
                phone={client.phoneNumber}
                email={client.email}
                size='lg'
                showTooltip
              />
              <div>
                <h2 className='text-2xl font-bold text-gray-900'>{client.name}</h2>
                <p className='text-sm text-gray-500 mt-1'>{client.email}</p>
                <p className='text-sm text-gray-500'>{client.phoneNumber}</p>
              </div>
            </div>
            <Button variant='outline' onClick={openEditClient} className='flex items-center gap-2'>
              <IconPencil className='size-4' />
              Edit Client
            </Button>
          </div>

          <div className='grid grid-cols-2 gap-6 mt-6'>
            <div>
              <p className='text-sm font-medium text-gray-500'>Client Type</p>
              <p className='text-sm text-gray-900 mt-1'>{client.clientType}</p>
            </div>
            {client.panDetails && (
              <div>
                <p className='text-sm font-medium text-gray-500'>PAN Details</p>
                <p className='text-sm text-gray-900 mt-1'>{client.panDetails}</p>
              </div>
            )}
            {client.gstIn && (
              <div>
                <p className='text-sm font-medium text-gray-500'>GSTIN</p>
                <p className='text-sm text-gray-900 mt-1'>{client.gstIn}</p>
              </div>
            )}
            <div>
              <div className='flex items-center gap-2'>
                <p className='text-sm font-medium text-gray-500'>Status</p>
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
                  onClick={handleOpenClientStatusModal}
                />
              </div>
              <div className='mt-1'>
                <StatusBadge status={client.status} />
              </div>
            </div>
          </div>

          {client.addresses && client.addresses.length > 0 && (
            <div className='mt-6'>
              <p className='text-sm font-medium text-gray-500 mb-2'>Addresses</p>
              <div className='space-y-2'>
                {client.addresses.map((addr, index) => (
                  <div key={index} className='text-sm text-gray-700 bg-gray-50 p-3 rounded'>
                    <p className='font-medium'>{addr.label}</p>
                    <p>
                      {[addr.building, addr.street, addr.locality, addr.city, addr.state]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {addr.pincode && <p>Pincode: {addr.pincode}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contacts Section */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Client Contacts</h3>
            <Button onClick={openAddContact} className='flex items-center gap-2'>
              <IconPlus className='size-4' />
              Add Client Contact
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
        <AddClientContactSidebar
          isOpen={isAddContactOpen}
          onClose={closeAddContact}
          clientId={id || ''}
          onCreated={() => {
            closeAddContact();
          }}
        />

        <EditClientSidebar
          isOpen={isEditClientOpen}
          onClose={closeEditClient}
          clientData={client}
        />

        {selectedContact && (
          <EditUserSidebar
            isOpen={isEditContactOpen}
            onClose={closeEditContact}
            userData={selectedContact}
            userId={selectedContact.id}
          />
        )}

        {/* Client Status Update Modal */}
        <Modal
          opened={isClientStatusModalOpen}
          onClose={closeClientStatusModal}
          title={client ? `Update Client Status - ${client.name}` : 'Update Client Status'}
          centered
          size='md'
        >
          <div className='space-y-4'>
            {client && (
              <div className='space-y-1 text-sm text-gray-700'>
                <p>
                  <span className='font-medium'>Name:</span> {client.name}
                </p>
                <p>
                  <span className='font-medium'>Email:</span> {client.email}
                </p>
                <p className='flex items-center gap-2'>
                  <span className='font-medium'>Current Status:</span>
                  <StatusBadge status={client.status} />
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
                onClick={closeClientStatusModal}
                disabled={isUpdatingClientStatus}
                radius='md'
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateClientStatus}
                disabled={!newClientStatus || isUpdatingClientStatus}
                radius='md'
              >
                {isUpdatingClientStatus ? 'Updating...' : 'Update Status'}
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
